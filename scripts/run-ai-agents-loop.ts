import "./load-env";

import { runAiSocialLoop } from "@/lib/ai-agents/scheduler";
import { ensureDatabase } from "@/lib/db/client";

type LoopOptions = {
  intervalMs: number;
  forceEligibleForTesting: boolean;
  topicOverride: string | null;
  maxRuns: number | null;
  highAutonomy: boolean;
};

async function main() {
  await ensureDatabase();

  const options = parseArgs(process.argv.slice(2));
  let runCount = 0;

  while (options.maxRuns === null || runCount < options.maxRuns) {
    runCount += 1;
    const startedAt = new Date().toISOString();

    try {
      const summary = await runAiSocialLoop({
        forceEligibleForTesting: options.forceEligibleForTesting,
        topicOverride: options.topicOverride,
        highAutonomy: options.highAutonomy
      });

      console.log(
        JSON.stringify(
          {
            run: runCount,
            startedAt,
            postsCreated: summary.results.filter((result) => result.status === "drafted").length,
            imagePostsCreated: summary.imagePostsCreated,
            directMessagesCreated: summary.conversationSummary.directMessagesCreated,
            introductionsCreated: summary.conversationSummary.introductionsCreated,
            continuedThreads: summary.conversationSummary.continuedThreads,
            regularAccountsContacted: summary.conversationSummary.regularAccountsContacted,
            aiAgentMessagesCreated: summary.conversationSummary.aiAgentMessagesCreated,
            aiAgentIntroductionsCreated: summary.conversationSummary.aiAgentIntroductionsCreated,
            aiAgentContinuedThreads: summary.conversationSummary.aiAgentContinuedThreads,
            aiAgentPairsContacted: summary.conversationSummary.aiAgentPairsContacted,
            highAutonomy: options.highAutonomy,
            topicHeadline: summary.conversationSummary.topicHeadline,
            results: summary.results
          },
          null,
          2
        )
      );
    } catch (error) {
      console.error(
        JSON.stringify(
          {
            run: runCount,
            startedAt,
            error: error instanceof Error ? error.message : String(error)
          },
          null,
          2
        )
      );
    }

    if (options.maxRuns !== null && runCount >= options.maxRuns) {
      break;
    }

    await delay(options.intervalMs);
  }
}

function parseArgs(args: string[]): LoopOptions {
  const get = (flag: string) => {
    const item = args.find((entry) => entry.startsWith(`${flag}=`));
    return item ? item.slice(flag.length + 1).trim() : "";
  };

  const intervalSeconds = Number.parseInt(get("--interval-seconds") || "86400", 10);
  const maxRunsRaw = get("--max-runs");
  const topicOverride = get("--topic") || null;
  const forceEligible = get("--force") === "true";
  const autonomy = (get("--autonomy") || "high").toLowerCase();

  return {
    intervalMs: Math.max(15, Number.isFinite(intervalSeconds) ? intervalSeconds : 86400) * 1000,
    forceEligibleForTesting: forceEligible,
    topicOverride,
    highAutonomy: autonomy !== "normal",
    maxRuns:
      maxRunsRaw && Number.isFinite(Number.parseInt(maxRunsRaw, 10))
        ? Math.max(1, Number.parseInt(maxRunsRaw, 10))
        : null
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

void main();
