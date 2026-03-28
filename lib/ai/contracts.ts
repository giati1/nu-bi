export type FeedRankingContext = {
  viewerId: string;
  candidatePostIds: string[];
};

export type ModerationSignal = {
  score: number;
  labels: string[];
};

export interface NuBiAIAdapter {
  rankFeed(context: FeedRankingContext): Promise<string[]>;
  analyzePost(input: { postId: string; body: string }): Promise<Record<string, unknown>>;
  scoreModeration(input: { body: string; actorId: string }): Promise<ModerationSignal>;
  analyzeMessageTone(input: { conversationId: string; body: string }): Promise<Record<string, unknown>>;
  suggestCaption(input: { body: string; vibe: string }): Promise<string>;
  suggestReply(input: { body: string; intent: string }): Promise<string>;
  rewriteProfile(input: {
    displayName: string;
    bio: string;
    website?: string | null;
    location?: string | null;
    vibe: string;
  }): Promise<{ displayName: string; bio: string }>;
  summarizeInbox(input: {
    ownerDisplayName: string;
    conversations: Array<{
      counterpart: string;
      unreadCount: number;
      lastMessage: string | null;
      updatedAt: string;
    }>;
  }): Promise<{ headline: string; bullets: string[] }>;
  generateImage(input: { prompt: string; style: string }): Promise<{ url: string; prompt: string }>;
}
