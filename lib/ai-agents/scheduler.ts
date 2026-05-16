import { getTrendingTags } from "@/lib/db/repository";
import { ensureGeneratedAiUsers, isGeneratedAiUser } from "@/lib/ai/ai-users";
import { runAiCommentPass } from "@/lib/ai/ai-comments";
import { generateAiImageCaption, generateAiPost } from "@/lib/ai/ai-posts";
import { generateSelfie } from "@/lib/ai/ai-images";
import { runAiConversationPass, type AiConversationSummary } from "@/lib/ai-agents/conversation-loop";
import {
  attachAIContentAsset,
  createAIAgentRunLog,
  createAIContentJob,
  finishAIAgentRunLog,
  getAIAgentById,
  getAIAgentBySlug,
  getAIAutomationSettings,
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

export type AiSocialLoopResult = {
  results: AgentRunResult[];
  imagePostsCreated: number;
  conversationSummary: AiConversationSummary;
};

export async function runAllEligibleAgentsOnce(options?: {
  forceEligibleForTesting?: boolean;
  topicOverride?: string | null;
  highAutonomy?: boolean;
  maxPostsToCreate?: number;
}) {
  const summary = await runAiSocialLoop(options);
  return summary.results;
}

export async function runAiSocialLoop(options?: {
  forceEligibleForTesting?: boolean;
  topicOverride?: string | null;
  highAutonomy?: boolean;
  maxPostsToCreate?: number;
}) {
  const forceEligibleForTesting = Boolean(options?.forceEligibleForTesting);
  const highAutonomy = options?.highAutonomy !== false;
  const automation = await getAIAutomationSettings();
  await ensureGeneratedAiUsers(9);
  const agents = await listAIAgents();
  const results: AgentRunResult[] = [];

  const eligibleAgents: AIAgentRecord[] = [];
  for (const agent of agents.filter((item) => item.enabled)) {
    const snapshot = await getAIAgentPublishingSnapshot(agent.id);
    const eligibility = checkEligibility(agent, snapshot, true, forceEligibleForTesting);
    if (eligibility.allowed) {
      eligibleAgents.push(agent);
    }
  }

  if (forceEligibleForTesting) {
    console.log(`Eligible AI users forced for testing: ${eligibleAgents.length} users`);
  }

  const shuffledAgents = shuffle(eligibleAgents);
  const defaultTargetCount = forceEligibleForTesting
    ? (highAutonomy ? 5 : 3)
    : highAutonomy
      ? Math.max(2, Math.min(6, shuffledAgents.length === 0 ? 0 : Math.floor(Math.random() * 5) + 2))
      : Math.max(1, Math.min(3, shuffledAgents.length === 0 ? 0 : Math.floor(Math.random() * 3) + 1));
  const autoPostingEnabledForRun = forceEligibleForTesting ? true : automation.autoPostEnabled;
  const configuredMaxPosts = options?.maxPostsToCreate ?? defaultTargetCount;
  const targetCount = autoPostingEnabledForRun
    ? Math.min(shuffledAgents.length, Math.max(0, configuredMaxPosts))
    : 0;
  let imagePostsCreated = 0;
  let forcedImageSlotsRemaining = forceEligibleForTesting ? (highAutonomy ? 3 : 2) : 0;

  if (targetCount > 0) {
    for (const agent of shuffledAgents) {
      if (results.filter((result) => result.status === "drafted").length >= targetCount) {
        break;
      }

      const result = await runAgentOnce(agent.id, {
        respectSchedule: true,
        runType: "eligible-pass",
        forceEligibleForTesting,
        topicOverride: options?.topicOverride,
        forcedContentMode:
          forceEligibleForTesting &&
          forcedImageSlotsRemaining > 0 &&
          agent.contentModes.includes("image_post")
            ? "image_post"
            : undefined
      });

      results.push(result);
      if (result.status === "drafted" && result.reason.includes("image_post")) {
        imagePostsCreated += 1;
        if (forcedImageSlotsRemaining > 0) {
          forcedImageSlotsRemaining -= 1;
        }
      }

      if (!forceEligibleForTesting && results.length >= targetCount) {
        break;
      }
    }
  }

  if (forceEligibleForTesting && targetCount > 0 && imagePostsCreated < targetCount) {
    for (const agent of shuffledAgents) {
      if (!agent.contentModes.includes("image_post")) {
        continue;
      }
      if (results.some((result) => result.agentId === agent.id && result.status === "drafted")) {
        continue;
      }

      const result = await runAgentOnce(agent.id, {
        respectSchedule: true,
        runType: "eligible-pass-image-retry",
        forceEligibleForTesting: true,
        topicOverride: options?.topicOverride,
        forcedContentMode: "image_post"
      });
      results.push(result);
      if (result.status === "drafted" && result.reason.includes("image_post")) {
        imagePostsCreated += 1;
      }
      if (imagePostsCreated >= targetCount) {
        break;
      }
    }
  }

  if (results.filter((result) => result.status === "drafted").length === 0) {
    const skippedResults = agents
      .filter((item) => item.enabled)
      .slice(0, 1)
      .map((agent) => ({
        agentId: agent.id,
        agentSlug: agent.slug,
        status: "skipped" as const,
        reason: "No eligible AI users were ready to post."
      }));

    const conversationSummary = await runAiConversationPass({
      allAgents: agents.filter((item) => item.enabled),
      topicOverride: options?.topicOverride
    });

      return {
        results: skippedResults,
        imagePostsCreated,
      conversationSummary
    } satisfies AiSocialLoopResult;
  }

  const interactionSummary = await runAiCommentPass({
    allAgents: agents.filter((item) => item.enabled),
    postedAgentIds: results
      .filter((result) => result.status === "drafted")
      .map((result) => result.agentId),
    highAutonomy
  });
  const conversationSummary = await runAiConversationPass({
    allAgents: agents.filter((item) => item.enabled),
    topicOverride: options?.topicOverride,
    highAutonomy
  });

  return {
    results: results.map((result, index) =>
    index === 0
      ? {
          ...result,
          reason: `${result.reason}. AI interactions: ${interactionSummary.commentsCreated} comments, ${interactionSummary.threadRepliesCreated} threaded replies, ${interactionSummary.likesCreated} likes, ${interactionSummary.voiceNotesCreated} voice notes. Direct messages: ${conversationSummary.directMessagesCreated}, introductions: ${conversationSummary.introductionsCreated}, continued threads: ${conversationSummary.continuedThreads}. Topic seed: ${conversationSummary.topicHeadline ?? "none"}.`
        }
      : result
    ),
    imagePostsCreated,
    conversationSummary
  } satisfies AiSocialLoopResult;
}

export async function runAgentNow(agentIdOrSlug: string) {
  const agent = agentIdOrSlug.includes("-")
    ? await getAIAgentById(agentIdOrSlug)
    : await getAIAgentBySlug(agentIdOrSlug);
  if (!agent) {
    throw new Error("AI agent not found.");
  }
  return await runAgentOnce(agent.id, {
    respectSchedule: false,
    runType: "manual-run"
  });
}

export async function runAgentOnce(
  agentId: string,
  options: {
    respectSchedule: boolean;
    runType: string;
    forceEligibleForTesting?: boolean;
    forcedContentMode?: AIAgentContentMode;
    topicOverride?: string | null;
  }
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
    const eligibility = checkEligibility(
      agent,
      snapshot,
      options.respectSchedule,
      Boolean(options.forceEligibleForTesting)
    );
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
    const resolvedTopicSeed = options.topicOverride?.trim() || plannedTopic.topicSeed;
    const contentMode = options.forcedContentMode ?? chooseContentMode(agent, snapshot);
    console.log(`[ai-run] Selected content mode: ${contentMode} for ${agent.slug}`);
    const prompts = buildAgentPromptBundle({
      agent,
      contentMode,
      topicSeed: resolvedTopicSeed,
      recentTopics: snapshot.recentTopics,
      recentBodies: snapshot.recentBodies
    });

    const job = await createAIContentJob({
      agentId: agent.id,
      jobType: contentMode,
      topicSeed: resolvedTopicSeed,
      promptUsed: prompts.serialized
    });

    if (!job) {
      throw new Error("Could not create AI content job.");
    }

    await updateAIContentJob(job.id, { status: "generating" });
    const content =
      contentMode === "text"
        ? (await generateAiPost(agent, { topicOverride: options.topicOverride })).content
        : contentMode === "image_post" && isGeneratedAiUser(agent)
          ? (await generateAiImageCaption(agent, { topicOverride: options.topicOverride })).content
          : await generateAgentContent({
              systemPrompt: prompts.systemPrompt,
              userPrompt: prompts.userPrompt,
              contentMode,
              topicSeed: resolvedTopicSeed
            });

    const moderation = await moderateAgentContent({
      agent,
      topicSeed: resolvedTopicSeed,
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
    if (content.contentMode === "image_post" && isGeneratedAiUser(agent)) {
      try {
        const generated = await generateSelfie({
          user: agent,
          topicOverride: options.topicOverride
        });
        if (generated) {
          console.log(`[ai-run] Selfie image generated for ${agent.slug}: ${generated.url}`);
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
            metadataJson: JSON.stringify({ prompt: generated.sourcePrompt, style: "selfie" })
          });
        }
      } catch {
        console.log(`[ai-run] Selfie image generation failed for ${agent.slug}`);
        media = [];
      }
    } else if (content.contentMode === "image_post" && content.imagePrompt) {
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

    if (media.length > 0) {
      console.log(
        `[ai-run] Media attached to post for ${agent.slug}: ${JSON.stringify(
          media.map((item) => ({ mimeType: item.mimeType, url: item.url }))
        )}`
      );
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
      topicSeed: resolvedTopicSeed,
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
      summary: `Created ${content.contentMode} draft on topic: ${resolvedTopicSeed}`
    });

    return {
      agentId: agent.id,
      agentSlug: agent.slug,
      status: "drafted",
      reason: `Published ${content.contentMode} post`,
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

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex]!, copy[index]!];
  }
  return copy;
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

  if (isGeneratedAiUser(agent) && imageCapable && textCapable) {
    return Math.random() < 0.5 ? "image_post" : "text";
  }

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

function checkEligibility(
  agent: AIAgentRecord,
  snapshot: { postsToday: number; lastPostedAt: string | null },
  respectSchedule: boolean,
  forceEligibleForTesting = false
) {
  if (!agent.enabled) {
    return { allowed: false, reason: "Agent is disabled." };
  }
  if (forceEligibleForTesting) {
    return { allowed: true, reason: "Forced eligible for testing." };
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

function pickForcedImageAgentId(primaryAgents: AIAgentRecord[], fallbackAgents: AIAgentRecord[]) {
  const pickFrom = [...primaryAgents, ...fallbackAgents];
  const imageCapable = pickFrom.find((agent) => agent.contentModes.includes("image_post"));
  return imageCapable?.id;
}
