import { recordAIPostAnalytics } from "@/lib/db/ai-repository";
import type { AIAgentRecord, FeedPost } from "@/types/domain";

export async function recordInitialAgentPostAnalytics(input: {
  agent: AIAgentRecord;
  post: FeedPost;
}) {
  await recordAIPostAnalytics({
    agentId: input.agent.id,
    postId: input.post.id,
    impressions: 0,
    likes: input.post.likeCount,
    comments: input.post.commentCount,
    saves: 0,
    shares: input.post.repostCount,
    engagementScore: input.post.likeCount + input.post.commentCount * 2 + input.post.repostCount * 2
  });
}
