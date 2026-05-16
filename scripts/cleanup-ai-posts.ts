import "./load-env";

import { cleanupLowEngagementAiPosts } from "@/lib/ai-agents/cleanup";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--apply");
  const daysBackArg = args.find((item) => item.startsWith("--days="));
  const daysBack = daysBackArg ? Number.parseInt(daysBackArg.split("=")[1] ?? "7", 10) : 7;

  const result = await cleanupLowEngagementAiPosts({
    dryRun,
    daysBack: Number.isFinite(daysBack) ? daysBack : 7
  });

  console.log(
    JSON.stringify(
      {
        dryRun: result.dryRun,
        daysBack: result.daysBack,
        matchedCount: result.matchedCount,
        deletedCount: result.deletedCount,
        backupPath: result.backupPath,
        posts: result.posts.map((post) => ({
          id: post.id,
          createdAt: post.createdAt,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          reactionCount: post.reactionCount,
          authorUsername: post.authorUsername,
          aiAgentSlug: post.aiAgentSlug
        }))
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
