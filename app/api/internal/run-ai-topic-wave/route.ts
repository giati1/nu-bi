import { NextResponse } from "next/server";
import { z } from "zod";
import { runAiDebate } from "@/lib/ai/ai-debates";
import { runAiSocialLoop, type AgentRunResult } from "@/lib/ai-agents/scheduler";
import { listAIAgents } from "@/lib/db/ai-repository";
import { getPostById } from "@/lib/db/repository";
import { env } from "@/lib/config/env";

const requestSchema = z.object({
  topic: z.string().trim().min(6).max(200).optional(),
  debate: z.boolean().optional().default(true)
});

const DEFAULT_ANTI_AGING_TOPIC =
  "anti-aging, longevity routines, skincare tech, wellness culture, and whether people are actually chasing health or just selling youth";

export async function POST(request: Request) {
  try {
    if (env.cloudflareEnv !== "preview" || env.databaseDriver !== "d1") {
      return NextResponse.json(
        { error: "This internal AI topic wave runner is available only in preview D1 mode." },
        { status: 403 }
      );
    }

    const parsed = requestSchema.parse(await request.json().catch(() => ({})));
    const topic = parsed.topic?.trim() || DEFAULT_ANTI_AGING_TOPIC;

    const summary = await runAiSocialLoop({
      forceEligibleForTesting: true,
      topicOverride: topic
    });

    const drafted = summary.results.filter((result) => result.status === "drafted");
    const postResults = drafted.filter(hasPostId);
    const imageResult =
      postResults.find((result) => result.reason.includes("image_post")) ?? postResults[0] ?? null;
    let debateSummary: Record<string, unknown> | null = null;

    if (parsed.debate && imageResult?.postId) {
      const [post, agents] = await Promise.all([getPostById(imageResult.postId, ""), listAIAgents()]);

      if (post) {
        const debateAgents = agents
          .filter((agent) => agent.enabled && agent.linkedUserId !== post.author.id)
          .slice(0, 6);

        debateSummary = {
          targetPostId: post.id,
          targetPostUrl: `${env.appUrl}/post/${post.id}`,
          agentsUsed: debateAgents.map((agent) => agent.slug),
          ...(await runAiDebate({
            post,
            agents: debateAgents,
            topicOverride: topic
          }))
        };
      }
    }

    return NextResponse.json({
      databaseDriver: env.databaseDriver,
      cloudflareEnv: env.cloudflareEnv,
      topic,
      postsCreated: drafted.length,
      imagePostsCreated: summary.imagePostsCreated,
      directMessagesCreated: summary.conversationSummary.directMessagesCreated,
      introductionsCreated: summary.conversationSummary.introductionsCreated,
      continuedThreads: summary.conversationSummary.continuedThreads,
      regularAccountsContacted: summary.conversationSummary.regularAccountsContacted,
      results: summary.results,
      debate: debateSummary
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid topic wave input." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run AI topic wave." },
      { status: 400 }
    );
  }
}

function hasPostId(result: AgentRunResult | { agentId: string; agentSlug: string; status: "skipped"; reason: string }): result is AgentRunResult & { postId: string } {
  return "postId" in result && typeof result.postId === "string";
}
