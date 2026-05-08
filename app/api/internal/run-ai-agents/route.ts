import { NextResponse } from "next/server";
import { runAiSocialLoop } from "@/lib/ai-agents/scheduler";
import { env } from "@/lib/config/env";

export async function POST() {
  try {
    if (env.cloudflareEnv !== "preview" || env.databaseDriver !== "d1") {
      return NextResponse.json(
        { error: "This internal AI runner is available only in preview D1 mode." },
        { status: 403 }
      );
    }

    const summary = await runAiSocialLoop({ forceEligibleForTesting: true });
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
      topicHeadline: summary.conversationSummary.topicHeadline,
      results
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run AI agents." },
      { status: 400 }
    );
  }
}
