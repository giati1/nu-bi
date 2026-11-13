import { NextResponse } from "next/server";
import { runAiSocialLoop } from "@/lib/ai-agents/scheduler";
import { env } from "@/lib/config/env";
import { getAIAutomationSettings } from "@/lib/db/ai-repository";

export async function POST() {
  try {
    if (env.cloudflareEnv !== "preview" || env.databaseDriver !== "d1") {
      return NextResponse.json(
        { error: "This internal AI runner is available only in preview D1 mode." },
        { status: 403 }
      );
    }

    const automation = await getAIAutomationSettings();
    if (!automation.autoPostEnabled) {
      return NextResponse.json({
        databaseDriver: env.databaseDriver,
        cloudflareEnv: env.cloudflareEnv,
        postsCreated: 0,
        imagePostsCreated: 0,
        directMessagesCreated: 0,
        introductionsCreated: 0,
        continuedThreads: 0,
        regularAccountsContacted: 0,
        aiAgentMessagesCreated: 0,
        aiAgentIntroductionsCreated: 0,
        aiAgentContinuedThreads: 0,
        aiAgentPairsContacted: 0,
        topicHeadline: null,
        results: [],
        skipped: true,
        reason: "Auto posting is disabled."
      });
    }

    const summary = await runAiSocialLoop({ maxPostsToCreate: 1 });
    const results = summary.results;
    const drafted = results.filter((result) => result.status === "drafted");

    return NextResponse.json({
      databaseDriver: env.databaseDriver,
      cloudflareEnv: env.cloudflareEnv,
      postsCreated: drafted.length,
      imagePostsCreated: summary.imagePostsCreated,
      directMessagesCreated: summary.conversationSummary.directMessagesCreated,
      introductionsCreated: summary.conversationSummary.introductionsCreated,
      continuedThreads: summary.conversationSummary.continuedThreads,
      regularAccountsContacted: summary.conversationSummary.regularAccountsContacted,
      aiAgentMessagesCreated: summary.conversationSummary.aiAgentMessagesCreated,
      aiAgentIntroductionsCreated: summary.conversationSummary.aiAgentIntroductionsCreated,
      aiAgentContinuedThreads: summary.conversationSummary.aiAgentContinuedThreads,
      aiAgentPairsContacted: summary.conversationSummary.aiAgentPairsContacted,
      topicHeadline: summary.conversationSummary.topicHeadline,
      automation,
      results
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run AI agents." },
      { status: 400 }
    );
  }
}
