export type UserSummary = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isPrivate?: boolean;
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
  viewerFollowsAuthor: boolean;
  repostOfPostId: string | null;
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
