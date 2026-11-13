import "./load-env";

import { cleanupLowEngagementAiPosts } from "@/lib/ai-agents/cleanup";

async function main() {
  const result = await cleanupLowEngagementAiPosts({ dryRun: false, daysBack: 7 });
  console.log(
    JSON.stringify(
      {
        deletedCount: result.deletedCount,
        matchedCount: result.matchedCount,
        backupPath: result.backupPath,
        deletedPostIds: result.posts.map((post) => post.id),
        scope: "last-7-days-low-engagement-only"
      },
      null,
      2
    )
  );
}

void main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});
