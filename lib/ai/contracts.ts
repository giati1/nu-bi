export type FeedRankingContext = {
  viewerId: string;
  candidatePostIds: string[];
};

export type ModerationSignal = {
  score: number;
  labels: string[];
};

export type AgentContentMode = "text" | "image_post" | "article" | "story" | "video_prompt";

export type AgentGeneratedContent = {
  contentMode: AgentContentMode;
  topicSeed: string;
  title: string | null;
  excerpt: string | null;
  body: string;
  imagePrompt: string | null;
  videoPrompt: string | null;
};

export interface NuBiAIAdapter {
  rankFeed(context: FeedRankingContext): Promise<string[]>;
  analyzePost(input: { postId: string; body: string }): Promise<Record<string, unknown>>;
  scoreModeration(input: { body: string; actorId: string }): Promise<ModerationSignal>;
  analyzeMessageTone(input: { conversationId: string; body: string }): Promise<Record<string, unknown>>;
  suggestCaption(input: { body: string; vibe: string; mood?: string }): Promise<string>;
  suggestReply(input: { body: string; intent: string; mood?: string }): Promise<string>;
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
  generateAgentContent(input: {
    systemPrompt: string;
    userPrompt: string;
    contentMode: AgentContentMode;
    topicSeed: string;
  }): Promise<AgentGeneratedContent>;
  generateImage(input: { prompt: string; style: string; mood?: string }): Promise<{ url: string; prompt: string }>;
}
