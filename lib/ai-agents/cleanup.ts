import fs from "fs/promises";
import path from "path";
import { ensureDatabase } from "@/lib/db/client";
import {
  listLowEngagementAIPosts,
  softDeletePosts
} from "@/lib/db/ai-repository";

type CleanupAiPostsOptions = {
  dryRun?: boolean;
  daysBack?: number;
  backupDir?: string;
};

export async function cleanupLowEngagementAiPosts(options?: CleanupAiPostsOptions) {
  await ensureDatabase();

  const dryRun = options?.dryRun !== false;
  const daysBack = Math.max(1, Math.min(options?.daysBack ?? 7, 30));
  const candidates = await listLowEngagementAIPosts({ daysBack });

  const backupDir = path.resolve(process.cwd(), options?.backupDir ?? "backups");
  await fs.mkdir(backupDir, { recursive: true });

  const stamp = new Date().toISOString().slice(0, 10);
  const backupPath = path.join(backupDir, `deleted-low-engagement-posts-${stamp}.json`);
  const backupPayload = {
    generatedAt: new Date().toISOString(),
    dryRun,
    daysBack,
    deletedCount: dryRun ? 0 : candidates.length,
    posts: candidates.map((post) => ({
      postId: post.id,
      title: null,
      caption: post.body,
      content: post.body,
      createdAt: post.createdAt,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      reactionCount: post.reactionCount,
      isAiGenerated: post.isAiGenerated,
      originalAuthor: {
        id: post.authorId,
        username: post.authorUsername,
        displayName: post.authorDisplayName
      },
      source: post.source,
      aiAgentId: post.aiAgentId,
      aiAgentSlug: post.aiAgentSlug
    }))
  };

  await fs.writeFile(backupPath, JSON.stringify(backupPayload, null, 2));

  const deletedCount = dryRun ? 0 : await softDeletePosts(candidates.map((post) => post.id));

  return {
    dryRun,
    daysBack,
    backupPath,
    matchedCount: candidates.length,
    deletedCount,
    posts: candidates
  };
}
