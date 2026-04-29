export type UserSummary = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  voiceIntroUrl?: string | null;
  voiceIntroMimeType?: string | null;
  isPrivate?: boolean;
};

export type AIPersonaSummary = {
  id: string;
  linkedUserId: string;
  slug: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  category: string;
  specialty: string;
  personality: string;
  description: string | null;
  isFollowing: boolean;
  followerCount: number;
};

export type FeedPost = {
  id: string;
  body: string;
  contentType: "standard" | "poll";
  status?: "published" | "draft" | "scheduled";
  scheduledFor?: string | null;
  createdAt: string;
  author: UserSummary;
  media: Array<{
    id: string;
    url: string;
    mimeType: string | null;
  }>;
  linkPreview: {
    url: string;
    title: string | null;
    description: string | null;
    domain: string | null;
  } | null;
  tags: string[];
  mentions: Array<Pick<UserSummary, "id" | "username" | "displayName">>;
  poll:
    | {
        options: Array<{
          id: string;
          label: string;
          voteCount: number;
          viewerHasVoted: boolean;
        }>;
        totalVotes: number;
      }
    | null;
  likeCount: number;
  commentCount: number;
  repostCount: number;
  viewCount: number;
  viewerHasLiked: boolean;
  viewerHasSaved: boolean;
  viewerHasReposted: boolean;
  viewerFollowsAuthor: boolean;
  repostOfPostId: string | null;
  repostedPost:
    | {
        id: string;
        authorUsername: string;
        authorDisplayName: string;
        body: string;
      }
    | null;
};

export type ProfilePageData = {
  user: UserSummary & {
    website: string | null;
    location: string | null;
    pinnedPostId?: string | null;
    followerCount: number;
    followingCount: number;
    postCount: number;
    isFollowing: boolean;
    followers: UserSummary[];
    following: UserSummary[];
  };
  canViewContent: boolean;
  posts: FeedPost[];
  pinnedPost: FeedPost | null;
  insights: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalSaved: number;
    totalViews: number;
  };
};

export type CommentRecord = {
  id: string;
  body: string;
  createdAt: string;
  parentCommentId: string | null;
  depth: number;
  media: Array<{
    id: string;
    url: string;
    mimeType: string | null;
  }>;
  author: UserSummary;
};

export type ConversationSummary = {
  id: string;
  updatedAt: string;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  isMuted: boolean;
  counterpart: UserSummary;
  lastMessage: {
    body: string;
    createdAt: string;
    senderId: string;
    mediaMimeType: string | null;
  } | null;
};

export type MessageRecord = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  media: Array<{
    id: string;
    url: string;
    mimeType: string | null;
  }>;
  replyTo: {
    id: string;
    body: string;
    senderDisplayName: string;
  } | null;
  reactions: Array<{
    emoji: string;
    count: number;
    viewerReacted: boolean;
  }>;
  sender: UserSummary;
};

export type NotificationRecord = {
  id: string;
  type: string;
  entityId: string | null;
  entityType: string | null;
  readAt: string | null;
  createdAt: string;
  actor: UserSummary | null;
};

export type NotificationPreferences = {
  likesEnabled: boolean;
  commentsEnabled: boolean;
  followsEnabled: boolean;
  messagesEnabled: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
};

export type SearchResults = {
  users: UserSummary[];
  posts: FeedPost[];
};

export type StoryRecord = {
  id: string;
  body: string;
  mediaUrl: string | null;
  destinationPath: string | null;
  destinationLabel: string | null;
  createdAt: string;
  expiresAt: string | null;
  viewerHasSeen: boolean;
  author: UserSummary;
};

export type OnboardingSummary = {
  profileScore: number;
  hasAvatar: boolean;
  hasBio: boolean;
  hasLocationOrWebsite: boolean;
  interestCount: number;
  followingCount: number;
  publishedPostCount: number;
};

export type AIAgentContentMode = "text" | "image_post" | "article" | "story" | "video_prompt";

export type AIAgentRecord = {
  id: string;
  linkedUserId: string;
  slug: string;
  displayName: string;
  handle: string;
  category: string;
  personaPrompt: string;
  description: string | null;
  avatarUrl: string | null;
  avatarSeed: string | null;
  contentModes: AIAgentContentMode[];
  postFrequencyMinutes: number;
  maxPostsPerDay: number;
  enabled: boolean;
  internalOnlyNotes: string | null;
  lastRunAt: string | null;
  lastPostedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AIContentJobRecord = {
  id: string;
  agentId: string;
  jobType: AIAgentContentMode;
  topicSeed: string;
  promptUsed: string | null;
  status: "queued" | "generating" | "ready" | "published" | "failed";
  outputText: string | null;
  outputTitle: string | null;
  outputExcerpt: string | null;
  outputImageUrl: string | null;
  outputVideoPrompt: string | null;
  moderationNotes: string | null;
  errorMessage: string | null;
  publishedPostId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AIContentAssetRecord = {
  id: string;
  jobId: string;
  assetType: string;
  storageKey: string;
  publicUrl: string;
  mimeType: string | null;
  metadataJson: string | null;
  createdAt: string;
};

export type AIAgentRunLogRecord = {
  id: string;
  agentId: string;
  runType: string;
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "completed" | "failed" | "skipped";
  summary: string | null;
  errorMessage: string | null;
};

export type AIPostAnalyticsRecord = {
  id: string;
  agentId: string;
  postId: string;
  impressions: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  engagementScore: number;
  createdAt: string;
};

export type AIReviewPostRecord = {
  id: string;
  body: string;
  status: "published" | "draft" | "scheduled";
  createdAt: string;
  topicSeed: string | null;
  generationMode: string | null;
  author: Pick<UserSummary, "id" | "username" | "displayName" | "avatarUrl">;
};
