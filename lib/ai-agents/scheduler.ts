import { getTrendingTags } from "@/lib/db/repository";
import {
  attachAIContentAsset,
  createAIAgentRunLog,
  createAIContentJob,
  finishAIAgentRunLog,
  getAIAgentById,
  getAIAgentBySlug,
  getAIAgentPublishingSnapshot,
  listAIAgents,
  touchAIAgentRun,
  updateAIContentJob
} from "@/lib/db/ai-repository";
import { generateAgentContent } from "@/lib/ai-agents/content-generator";
import { createAgentMediaProvider } from "@/lib/ai-agents/media-generator";
import { moderateAgentContent } from "@/lib/ai-agents/moderation";
import { publishAgentContent } from "@/lib/ai-agents/publisher";
import { buildAgentPromptBundle } from "@/lib/ai-agents/prompt-builder";
import { planAgentTopic } from "@/lib/ai-agents/topic-planner";
import type { AIAgentContentMode, AIAgentRecord } from "@/types/domain";

export type AgentRunResult = {
  agentId: string;
  agentSlug: string;
  status: "drafted" | "failed" | "skipped";
  reason: string;
  postId?: string;
  jobId?: string;
};

export async function runAllEligibleAgentsOnce() {
  const agents = await listAIAgents();
  const results: AgentRunResult[] = [];

  for (const agent of agents.filter((item) => item.enabled)) {
    results.push(await runAgentOnce(agent.id, { respectSchedule: true, runType: "eligible-pass" }));
  }

  return results;
}

export async function runAgentNow(agentIdOrSlug: string) {
  const agent = agentIdOrSlug.includes("-")
    ? await getAIAgentById(agentIdOrSlug)
    : await getAIAgentBySlug(agentIdOrSlug);
  if (!agent) {
    throw new Error("AI agent not found.");
  }
  return await runAgentOnce(agent.id, { respectSchedule: false, runType: "manual-run" });
}

export async function runAgentOnce(
  agentId: string,
  options: { respectSchedule: boolean; runType: string }
): Promise<AgentRunResult> {
  const agent = await getAIAgentById(agentId);
  if (!agent) {
    throw new Error("AI agent not found.");
  }

  const runLog = await createAIAgentRunLog({
    agentId: agent.id,
    runType: options.runType,
    status: "running"
  });

  try {
    const snapshot = await getAIAgentPublishingSnapshot(agent.id);
    const eligibility = checkEligibility(agent, snapshot, options.respectSchedule);
    if (!eligibility.allowed) {
      await touchAIAgentRun(agent.id, { lastRunAt: new Date().toISOString() });
      await finishAIAgentRunLog(runLog?.id ?? "", {
        status: "skipped",
        summary: eligibility.reason
      });
      return {
        agentId: agent.id,
        agentSlug: agent.slug,
        status: "skipped",
        reason: eligibility.reason
      };
    }

    const trendingTags = await getTrendingTags();
    const plannedTopic = planAgentTopic({
      agent,
      trendingTags,
      recentTopics: snapshot.recentTopics
    });
    const contentMode = chooseContentMode(agent, snapshot);
    const prompts = buildAgentPromptBundle({
      agent,
      contentMode,
      topicSeed: plannedTopic.topicSeed,
      recentTopics: snapshot.recentTopics,
      recentBodies: snapshot.recentBodies
    });

    const job = await createAIContentJob({
      agentId: agent.id,
      jobType: contentMode,
      topicSeed: plannedTopic.topicSeed,
      promptUsed: prompts.serialized
    });

    if (!job) {
      throw new Error("Could not create AI content job.");
    }

    await updateAIContentJob(job.id, { status: "generating" });
    const content = await generateAgentContent({
      systemPrompt: prompts.systemPrompt,
      userPrompt: prompts.userPrompt,
      contentMode,
      topicSeed: plannedTopic.topicSeed
    });

    const moderation = await moderateAgentContent({
      agent,
      topicSeed: plannedTopic.topicSeed,
      content,
      recentTopics: snapshot.recentTopics,
      recentBodies: snapshot.recentBodies
    });

    if (!moderation.approved) {
      await updateAIContentJob(job.id, {
        status: "failed",
        outputText: content.body,
        outputTitle: content.title,
        outputExcerpt: content.excerpt,
        outputVideoPrompt: content.videoPrompt,
        moderationNotes: moderation.notes.join(" "),
        errorMessage: "Content failed moderation or duplication checks."
      });
      await touchAIAgentRun(agent.id, { lastRunAt: new Date().toISOString() });
      await finishAIAgentRunLog(runLog?.id ?? "", {
        status: "failed",
        summary: "Job blocked by moderation guardrails.",
        errorMessage: moderation.notes.join(" ")
      });
      return {
        agentId: agent.id,
        agentSlug: agent.slug,
        status: "failed",
        reason: moderation.notes.join(" "),
        jobId: job.id
      };
    }

    let media: Array<{ storageKey: string; url: string; mimeType: string | null }> = [];
    let publishedImageUrl: string | null = null;
    if (content.contentMode === "image_post" && content.imagePrompt) {
      try {
        const generated = await createAgentMediaProvider().generateImage({
          prompt: content.imagePrompt,
          agentSlug: agent.slug,
          jobId: job.id
        });
        if (generated) {
          media = [
            {
              storageKey: generated.storageKey,
              url: generated.url,
              mimeType: generated.mimeType
            }
          ];
          publishedImageUrl = generated.url;
          await attachAIContentAsset({
            jobId: job.id,
            assetType: "image",
            storageKey: generated.storageKey,
            publicUrl: generated.url,
            mimeType: generated.mimeType,
            metadataJson: JSON.stringify({ prompt: generated.sourcePrompt })
          });
        }
      } catch {
        media = [];
      }
    }

    await updateAIContentJob(job.id, {
      status: "ready",
      outputText: content.body,
      outputTitle: content.title,
      outputExcerpt: content.excerpt,
      outputImageUrl: publishedImageUrl,
      outputVideoPrompt: content.videoPrompt,
      moderationNotes: moderation.notes.join(" ")
    });

    const post = await publishAgentContent({
      agent,
      jobId: job.id,
      topicSeed: plannedTopic.topicSeed,
      content,
      media
    });

    if (!post) {
      throw new Error("AI job could not publish a post.");
    }

    await updateAIContentJob(job.id, {
      status: "published",
      publishedPostId: post.id,
      outputText: content.body,
      outputTitle: content.title,
      outputExcerpt: content.excerpt,
      outputImageUrl: publishedImageUrl,
      outputVideoPrompt: content.videoPrompt,
      moderationNotes: moderation.notes.join(" ")
    });
    await touchAIAgentRun(agent.id, {
      lastRunAt: new Date().toISOString(),
      lastPostedAt: new Date().toISOString()
    });
    await finishAIAgentRunLog(runLog?.id ?? "", {
      status: "completed",
      summary: `Created ${content.contentMode} draft on topic: ${plannedTopic.topicSeed}`
    });

    return {
      agentId: agent.id,
      agentSlug: agent.slug,
      status: "drafted",
      reason: `Created ${content.contentMode} draft`,
      postId: post.id,
      jobId: job.id
    };
  } catch (error) {
    await touchAIAgentRun(agent.id, { lastRunAt: new Date().toISOString() });
    await finishAIAgentRunLog(runLog?.id ?? "", {
      status: "failed",
      summary: "Agent run failed.",
      errorMessage: error instanceof Error ? error.message : "Unknown error"
    });
    return {
      agentId: agent.id,
      agentSlug: agent.slug,
      status: "failed",
      reason: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

function chooseContentMode(
  agent: AIAgentRecord,
  snapshot: { postsToday: number; totalPublishedPosts: number }
): AIAgentContentMode {
  const supported = agent.contentModes.filter(
    (mode) => mode === "text" || mode === "image_post" || mode === "article" || mode === "video_prompt"
  );
  if (supported.length === 0) {
    return "text";
  }

  const imageCapable = supported.includes("image_post");
  const articleCapable = supported.includes("article");
  const textCapable = supported.includes("text");
  const videoCapable = supported.includes("video_prompt");
  const sequenceIndex = snapshot.totalPublishedPosts % supported.length;

  if (imageCapable && snapshot.totalPublishedPosts % 2 === 0) {
    return "image_post";
  }

  if (articleCapable && snapshot.totalPublishedPosts % 5 === 3) {
    return "article";
  }

  if (videoCapable && snapshot.totalPublishedPosts % 7 === 5) {
    return "video_prompt";
  }

  if (textCapable) {
    return "text";
  }

  return supported[sequenceIndex];
}

function checkEligibility(agent: AIAgentRecord, snapshot: { postsToday: number; lastPostedAt: string | null }, respectSchedule: boolean) {
  if (!agent.enabled) {
    return { allowed: false, reason: "Agent is disabled." };
  }
  if (!respectSchedule) {
    return { allowed: true, reason: "Manual run." };
  }
  if (snapshot.postsToday >= agent.maxPostsPerDay) {
    return { allowed: false, reason: "Daily post cap reached." };
  }
  if (snapshot.lastPostedAt) {
    const lastPostedAt = new Date(snapshot.lastPostedAt).getTime();
    const minimumGapMs = agent.postFrequencyMinutes * 60 * 1000;
    if (Date.now() - lastPostedAt < minimumGapMs) {
      return { allowed: false, reason: "Minimum time between posts has not elapsed." };
    }
  }
  return { allowed: true, reason: "Eligible" };
}
