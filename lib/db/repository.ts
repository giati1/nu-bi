import crypto from "crypto";
import { all, get, run, transaction } from "@/lib/db/client";
import { getAIAdapter } from "@/lib/ai";
import { normalizeStoredFileUrl } from "@/lib/storage";
import { createNotification } from "@/lib/notifications/service";
import type {
  CommentRecord,
  ConversationSummary,
  FeedPost,
  MessageRecord,
  NotificationRecord,
  NotificationPreferences,
  OnboardingSummary,
  ProfilePageData,
  SearchResults,
  StoryRecord,
  UserSummary
} from "@/types/domain";

type ViewerRecord = UserSummary & {
  email: string;
  website: string | null;
  location: string | null;
};

type UserRow = {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  voice_intro_url?: string | null;
  voice_intro_mime_type?: string | null;
  is_private?: number;
};

type PostRow = {
  id: string;
  body: string;
  content_type?: "standard" | "poll";
  status?: "published" | "draft" | "scheduled";
  scheduled_for?: string | null;
  created_at: string;
  repost_of_post_id: string | null;
  like_count: number;
  comment_count: number;
  repost_count: number;
  view_count?: number;
  viewer_has_liked: number;
  viewer_follows_author: number;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
};

type MediaRow = {
  id: string;
  post_id: string;
  storage_key?: string | null;
  url: string;
  mime_type: string | null;
};

type TagRow = {
  post_id: string;
  tag: string;
};

type MentionRow = {
  post_id: string;
  mentioned_user_id: string;
  username: string;
  display_name: string;
};

type PollOptionRow = {
  id: string;
  post_id: string;
  label: string;
  vote_count: number;
  viewer_has_voted: number;
};

type RepostTargetRow = {
  repost_id: string;
  id: string;
  body: string;
  username: string;
  display_name: string;
};

type StoryRow = {
  id: string;
  body: string;
  media_url: string | null;
  destination_path: string | null;
  destination_label: string | null;
  created_at: string;
  expires_at: string | null;
  viewer_has_seen: number;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
};

function mapUser(row: UserRow): ViewerRecord {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: normalizeStoredFileUrl(row.avatar_url),
    bio: row.bio,
    voiceIntroUrl: normalizeStoredFileUrl(row.voice_intro_url),
    voiceIntroMimeType: row.voice_intro_mime_type ?? null,
    website: row.website,
    location: row.location,
    isPrivate: Boolean(row.is_private)
  };
}

function mapStory(row: StoryRow): StoryRecord {
  return {
    id: row.id,
    body: row.body,
    mediaUrl: normalizeStoredFileUrl(row.media_url),
    destinationPath: row.destination_path,
    destinationLabel: row.destination_label,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    viewerHasSeen: Boolean(row.viewer_has_seen),
    author: {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: normalizeStoredFileUrl(row.avatar_url),
      bio: row.bio
    }
  };
}

function mapPost(
  rows: PostRow[],
  mediaRows: MediaRow[],
  tagRows: TagRow[],
  mentionRows: MentionRow[],
  pollOptionRows: PollOptionRow[],
  repostTargetRows: RepostTargetRow[],
  viewerRepostedPostIds: Set<string>
) {
  return rows.map<FeedPost>((row) => ({
    id: row.id,
    body: row.body,
    contentType: (row.content_type ?? "standard") as "standard" | "poll",
    status: (row.status ?? "published") as "published" | "draft" | "scheduled",
    scheduledFor: row.scheduled_for ?? null,
    createdAt: row.created_at,
    author: {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: normalizeStoredFileUrl(row.avatar_url),
      bio: row.bio
    },
    media: mediaRows
      .filter((item) => item.post_id === row.id)
      .map((item) => ({
        id: item.id,
        url: normalizeStoredFileUrl(item.url, item.storage_key) ?? item.url,
        mimeType: item.mime_type
      })),
    linkPreview:
      (row as PostRow & {
        link_url?: string | null;
        link_title?: string | null;
        link_description?: string | null;
        link_domain?: string | null;
      }).link_url
        ? {
            url: (row as PostRow & { link_url?: string | null }).link_url ?? "",
            title: (row as PostRow & { link_title?: string | null }).link_title ?? null,
            description:
              (row as PostRow & { link_description?: string | null }).link_description ?? null,
            domain: (row as PostRow & { link_domain?: string | null }).link_domain ?? null
          }
        : null,
    tags: tagRows.filter((item) => item.post_id === row.id).map((item) => item.tag),
    mentions: mentionRows
      .filter((item) => item.post_id === row.id)
      .map((item) => ({
        id: item.mentioned_user_id,
        username: item.username,
        displayName: item.display_name
      })),
    poll:
      ((row as PostRow & { content_type?: string }).content_type ?? "standard") === "poll"
        ? {
            options: pollOptionRows
              .filter((item) => item.post_id === row.id)
              .map((item) => ({
                id: item.id,
                label: item.label,
                voteCount: item.vote_count,
                viewerHasVoted: Boolean(item.viewer_has_voted)
              })),
            totalVotes: pollOptionRows
              .filter((item) => item.post_id === row.id)
              .reduce((sum, item) => sum + item.vote_count, 0)
          }
        : null,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    repostCount: row.repost_count,
    viewCount: row.view_count ?? 0,
    viewerHasLiked: Boolean(row.viewer_has_liked),
    viewerHasSaved: Boolean((row as PostRow & { viewer_has_saved?: number }).viewer_has_saved),
    viewerHasReposted: viewerRepostedPostIds.has(row.id),
    viewerFollowsAuthor: Boolean(row.viewer_follows_author),
    repostOfPostId: row.repost_of_post_id,
    repostedPost: repostTargetRows
      .filter((item) => item.repost_id === row.id)
      .map((item) => ({
        id: item.id,
        authorUsername: item.username,
        authorDisplayName: item.display_name,
        body: item.body
      }))[0] ?? null
  }));
}

function getPostLikeCountSql(postAlias = "p") {
  return `COALESCE(
    (SELECT peo.like_count FROM post_engagement_overrides peo WHERE peo.post_id = ${postAlias}.id),
    (SELECT COUNT(*) FROM likes l WHERE l.post_id = ${postAlias}.id)
  )`;
}

function getPostViewCountSql(postAlias = "p") {
  return `COALESCE(
    (SELECT peo.view_count FROM post_engagement_overrides peo WHERE peo.post_id = ${postAlias}.id),
    (SELECT COUNT(*) FROM post_view_events pve WHERE pve.post_id = ${postAlias}.id)
  )`;
}

async function getMediaByPostIds(postIds: string[]) {
  if (postIds.length === 0) {
    return [];
  }
  const placeholders = postIds.map(() => "?").join(", ");
  return await all<MediaRow>(
    `SELECT id, post_id, storage_key, url, mime_type
     FROM post_media
     WHERE post_id IN (${placeholders})
     ORDER BY created_at ASC`,
    postIds
  );
}

async function getTagsByPostIds(postIds: string[]) {
  if (postIds.length === 0) {
    return [];
  }
  const placeholders = postIds.map(() => "?").join(", ");
  return await all<TagRow>(
    `SELECT post_id, tag FROM post_tags WHERE post_id IN (${placeholders}) ORDER BY tag ASC`,
    postIds
  );
}

async function getMentionsByPostIds(postIds: string[]) {
  if (postIds.length === 0) {
    return [];
  }
  const placeholders = postIds.map(() => "?").join(", ");
  return await all<MentionRow>(
    `SELECT pm.post_id, pm.mentioned_user_id, u.username, u.display_name
     FROM post_mentions pm
     JOIN users u ON u.id = pm.mentioned_user_id
     WHERE pm.post_id IN (${placeholders})`,
    postIds
  );
}

async function getPollOptionsByPostIds(postIds: string[], viewerId: string) {
  if (postIds.length === 0) {
    return [];
  }
  const placeholders = postIds.map(() => "?").join(", ");
  return await all<PollOptionRow>(
    `SELECT
       po.id,
       po.post_id,
       po.label,
       (SELECT COUNT(*) FROM poll_votes pv WHERE pv.poll_option_id = po.id) AS vote_count,
       EXISTS(
         SELECT 1 FROM poll_votes pv2
         WHERE pv2.poll_option_id = po.id AND pv2.user_id = ?
       ) AS viewer_has_voted
     FROM poll_options po
     WHERE po.post_id IN (${placeholders})
     ORDER BY po.position ASC`,
    [viewerId, ...postIds]
  );
}

async function getRepostTargetsByPostIds(postIds: string[]) {
  if (postIds.length === 0) {
    return [];
  }
  const placeholders = postIds.map(() => "?").join(", ");
  return await all<RepostTargetRow>(
    `SELECT
       repost.id AS repost_id,
       original.id,
       original.body,
       author.username,
       author.display_name
     FROM posts repost
     JOIN posts original ON original.id = repost.repost_of_post_id
     JOIN users author ON author.id = original.user_id
     WHERE repost.id IN (${placeholders})`,
    postIds
  );
}

async function getViewerRepostedPostIds(postIds: string[], viewerId: string) {
  if (!viewerId || postIds.length === 0) {
    return new Set<string>();
  }
  const placeholders = postIds.map(() => "?").join(", ");
  const rows = await all<{ repost_of_post_id: string }>(
    `SELECT DISTINCT repost_of_post_id
     FROM posts
     WHERE user_id = ?
       AND deleted_at IS NULL
       AND repost_of_post_id IN (${placeholders})`,
    [viewerId, ...postIds]
  );
  return new Set(rows.map((row) => row.repost_of_post_id));
}

export async function getUserByEmail(email: string) {
  const row = await get<UserRow>(
    `SELECT u.id, u.email, u.username, u.display_name, u.avatar_url, p.bio, p.website, p.location, p.voice_intro_url, p.voice_intro_mime_type, COALESCE(p.is_private, 0) AS is_private
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE lower(u.email) = lower(?)`,
    [email]
  );
  return row ? mapUser(row) : null;
}

export async function getUserWithPasswordByEmail(email: string) {
  return await get<{
    id: string;
    email: string;
    username: string;
    password_hash: string;
    display_name: string;
    avatar_url: string | null;
  }>(
    `SELECT id, email, username, password_hash, display_name, avatar_url
     FROM users
     WHERE lower(email) = lower(?)`,
    [email]
  );
}

export async function getUserByUsername(username: string) {
  const row = await get<UserRow>(
    `SELECT u.id, u.email, u.username, u.display_name, u.avatar_url, p.bio, p.website, p.location, p.voice_intro_url, p.voice_intro_mime_type, COALESCE(p.is_private, 0) AS is_private
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE lower(u.username) = lower(?)`,
    [username]
  );
  return row ? mapUser(row) : null;
}

export async function getUserById(userId: string) {
  const row = await get<UserRow>(
    `SELECT u.id, u.email, u.username, u.display_name, u.avatar_url, p.bio, p.website, p.location, p.voice_intro_url, p.voice_intro_mime_type, COALESCE(p.is_private, 0) AS is_private
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = ?`,
    [userId]
  );
  return row ? mapUser(row) : null;
}

export async function createUser(input: {
  email: string;
  username: string;
  passwordHash: string;
  displayName: string;
}) {
  const id = crypto.randomUUID();
  await transaction(async () => {
    await run(
      `INSERT INTO users (id, email, username, password_hash, display_name)
       VALUES (?, ?, ?, ?, ?)`,
      [id, input.email, input.username, input.passwordHash, input.displayName]
    );
    await run(`INSERT INTO profiles (user_id, bio) VALUES (?, '')`, [id]);
  });
  return await getUserById(id);
}

export async function updateProfile(input: {
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  website: string | null;
  location: string | null;
  avatarUrl: string | null;
  voiceIntroUrl?: string | null;
  voiceIntroMimeType?: string | null;
  isPrivate: boolean;
}) {
  const existing = await get<{ id: string }>(
    `SELECT id FROM users WHERE lower(username) = lower(?) AND id <> ?`,
    [input.username, input.userId]
  );
  if (existing) {
    throw new Error("That username is already taken.");
  }

  await transaction(async () => {
    await run(
      `UPDATE users
       SET username = ?, display_name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [input.username, input.displayName, input.avatarUrl, input.userId]
    );
    await run(
      `UPDATE profiles
       SET bio = ?, website = ?, location = ?, voice_intro_url = ?, voice_intro_mime_type = ?, is_private = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [
        input.bio,
        input.website,
        input.location,
        input.voiceIntroUrl ?? null,
        input.voiceIntroMimeType ?? null,
        Number(input.isPrivate),
        input.userId
      ]
    );
  });

  return await getUserById(input.userId);
}

export async function createSession(input: { id: string; userId: string; expiresAt: string }) {
  await run(`INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`, [
    input.id,
    input.userId,
    input.expiresAt
  ]);
}

export async function deleteSessionById(sessionId: string) {
  await run(`DELETE FROM sessions WHERE id = ?`, [sessionId]);
}

export async function getUserBySessionToken(sessionId: string) {
  const row = await get<UserRow>(
    `SELECT u.id, u.email, u.username, u.display_name, u.avatar_url, p.bio, p.website, p.location, p.voice_intro_url, p.voice_intro_mime_type, COALESCE(p.is_private, 0) AS is_private
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP`,
    [sessionId]
  );
  return row ? mapUser(row) : null;
}

async function getPostRowsForSql(sql: string, params: unknown[]) {
  const rows = await all<PostRow>(sql, params);
  let rankedIds = rows.map((row) => row.id);

  try {
    rankedIds = await getAIAdapter().rankFeed({
      viewerId: String(params[0] ?? ""),
      candidatePostIds: rows.map((row) => row.id)
    });
  } catch {
    rankedIds = rows.map((row) => row.id);
  }

  const ordered = rows.sort(
    (left, right) => rankedIds.indexOf(left.id) - rankedIds.indexOf(right.id)
  );
  const postIds = ordered.map((row) => row.id);
  const [mediaRows, tagRows, mentionRows, pollOptionRows, repostTargetRows, viewerRepostedPostIds] = await Promise.all([
    getMediaByPostIds(postIds),
    getTagsByPostIds(postIds),
    getMentionsByPostIds(postIds),
    getPollOptionsByPostIds(postIds, String(params[0] ?? "")),
    getRepostTargetsByPostIds(postIds),
    getViewerRepostedPostIds(postIds, String(params[0] ?? ""))
  ]);
  return mapPost(ordered, mediaRows, tagRows, mentionRows, pollOptionRows, repostTargetRows, viewerRepostedPostIds);
}

async function canViewerAccessPrivateContent(targetUserId: string, viewerId: string) {
  if (!viewerId) {
    return false;
  }
  if (targetUserId === viewerId) {
    return true;
  }
  const row = await get<{ match: number }>(
    `SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?) AS match`,
    [viewerId, targetUserId]
  );
  return Boolean(row?.match);
}

export async function getHomeFeed(viewerId: string) {
  return await getDiscoveryFeed(viewerId);
}

export async function getActiveStories(viewerId: string) {
  const rows = await all<StoryRow>(
    `SELECT
       s.id,
       s.body,
       s.media_url,
       s.destination_path,
       s.destination_label,
       s.created_at,
       s.expires_at,
       EXISTS(
         SELECT 1 FROM story_views sv
         WHERE sv.story_id = s.id AND sv.user_id = ?
       ) AS viewer_has_seen,
       u.id AS user_id,
       u.username,
       u.display_name,
       u.avatar_url,
       p.bio
     FROM stories s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE s.status = 'published'
       AND (s.expires_at IS NULL OR s.expires_at > CURRENT_TIMESTAMP)
       AND (
         COALESCE(p.is_private, 0) = 0
         OR u.id = ?
         OR EXISTS(
           SELECT 1 FROM follows f
           WHERE f.follower_id = ? AND f.following_id = u.id
         )
       )
     ORDER BY
       CASE WHEN s.user_id = ? THEN 0 ELSE 1 END,
       s.created_at DESC
     LIMIT 12`,
    [viewerId, viewerId, viewerId, viewerId]
  );

  return rows.map(mapStory);
}

export async function getDiscoveryFeed(viewerId: string) {
  return await getPostRowsForSql(
    `SELECT
       p.id,
       p.body,
       p.content_type,
       p.status,
       p.scheduled_for,
       p.created_at,
       p.repost_of_post_id,
       p.link_url,
       p.link_title,
       p.link_description,
       p.link_domain,
       u.id AS user_id,
       u.username,
       u.display_name,
       u.avatar_url,
       pr.bio,
       ${getPostLikeCountSql("p")} AS like_count,
       (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
       (SELECT COUNT(*) FROM posts rp WHERE rp.repost_of_post_id = p.id) AS repost_count,
       ${getPostViewCountSql("p")} AS view_count,
       EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS viewer_has_liked,
       EXISTS(SELECT 1 FROM saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = ?) AS viewer_has_saved,
       EXISTS(SELECT 1 FROM follows f2 WHERE f2.following_id = u.id AND f2.follower_id = ?) AS viewer_follows_author
     FROM posts p
     JOIN users u ON u.id = p.user_id
     LEFT JOIN profiles pr ON pr.user_id = u.id
     WHERE p.deleted_at IS NULL
       AND p.status = 'published'
       AND (p.scheduled_for IS NULL OR p.scheduled_for <= CURRENT_TIMESTAMP)
       AND (
         COALESCE(pr.is_private, 0) = 0
         OR u.id = ?
         OR EXISTS(
           SELECT 1 FROM follows f3
           WHERE f3.follower_id = ? AND f3.following_id = u.id
         )
       )
     ORDER BY p.created_at DESC
     LIMIT 25`,
    [viewerId, viewerId, viewerId, viewerId, viewerId]
  );
}

export async function getShortsFeed(viewerId: string) {
  return await getPostRowsForSql(
    `SELECT
       p.id,
       p.body,
       p.content_type,
       p.status,
       p.scheduled_for,
       p.created_at,
       p.repost_of_post_id,
       p.link_url,
       p.link_title,
       p.link_description,
       p.link_domain,
       u.id AS user_id,
       u.username,
       u.display_name,
       u.avatar_url,
       pr.bio,
       ${getPostLikeCountSql("p")} AS like_count,
       (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
       (SELECT COUNT(*) FROM posts rp WHERE rp.repost_of_post_id = p.id) AS repost_count,
       ${getPostViewCountSql("p")} AS view_count,
       EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS viewer_has_liked,
       EXISTS(SELECT 1 FROM saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = ?) AS viewer_has_saved,
       EXISTS(SELECT 1 FROM follows f2 WHERE f2.following_id = u.id AND f2.follower_id = ?) AS viewer_follows_author
     FROM posts p
     JOIN users u ON u.id = p.user_id
     LEFT JOIN profiles pr ON pr.user_id = u.id
     WHERE p.deleted_at IS NULL
       AND p.status = 'published'
       AND (p.scheduled_for IS NULL OR p.scheduled_for <= CURRENT_TIMESTAMP)
       AND (
         COALESCE(pr.is_private, 0) = 0
         OR u.id = ?
         OR EXISTS(
           SELECT 1 FROM follows f3
           WHERE f3.follower_id = ? AND f3.following_id = u.id
         )
       )
       AND EXISTS (
         SELECT 1 FROM post_media pm
         WHERE pm.post_id = p.id
           AND pm.mime_type LIKE 'video/%'
       )
     ORDER BY p.created_at DESC
     LIMIT 30`,
    [viewerId, viewerId, viewerId, viewerId, viewerId]
  );
}

export async function createPost(input: {
  userId: string;
  body: string;
  contentType?: "standard" | "poll";
  status?: "published" | "draft" | "scheduled";
  scheduledFor?: string | null;
  repostOfPostId?: string | null;
  aiAgentId?: string | null;
  aiContentJobId?: string | null;
  aiGenerationMode?: string | null;
  aiTopicSeed?: string | null;
  media?: Array<{ storageKey: string; url: string; mimeType: string | null }>;
  pollOptions?: string[];
}) {
  const id = crypto.randomUUID();
  const normalizedBody = input.body.trim();
  const hashtags = extractHashtags(normalizedBody);
  const mentions = extractMentions(normalizedBody);
  const linkPreview = buildLinkPreview(normalizedBody);
  await transaction(async () => {
      await run(
        `INSERT INTO posts (
           id, user_id, body, repost_of_post_id, content_type, status, scheduled_for, link_url, link_title, link_description, link_domain,
           ai_agent_id, ai_content_job_id, ai_generation_mode, ai_topic_seed
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.userId,
          normalizedBody,
          input.repostOfPostId ?? null,
          input.contentType ?? "standard",
          input.status ?? "published",
          input.scheduledFor ?? null,
          linkPreview?.url ?? null,
          linkPreview?.title ?? null,
          linkPreview?.description ?? null,
          linkPreview?.domain ?? null,
          input.aiAgentId ?? null,
          input.aiContentJobId ?? null,
          input.aiGenerationMode ?? null,
          input.aiTopicSeed ?? null
      ]
    );
    for (const media of input.media ?? []) {
      await run(
        `INSERT INTO post_media (id, post_id, storage_key, url, mime_type)
         VALUES (?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), id, media.storageKey, media.url, media.mimeType]
      );
    }
    for (const tag of hashtags) {
      await run(`INSERT OR IGNORE INTO post_tags (post_id, tag) VALUES (?, ?)`, [id, tag]);
    }
    for (const username of mentions) {
      const mentioned = await get<{ id: string }>(
        `SELECT id FROM users WHERE lower(username) = lower(?)`,
        [username]
      );
      if (mentioned) {
        await run(
          `INSERT OR IGNORE INTO post_mentions (post_id, mentioned_user_id) VALUES (?, ?)`,
          [id, mentioned.id]
        );
      }
    }
    for (const [index, option] of (input.pollOptions ?? [])
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 4)
      .entries()) {
      await run(
        `INSERT INTO poll_options (id, post_id, label, position) VALUES (?, ?, ?, ?)`,
        [crypto.randomUUID(), id, option, index]
      );
    }
  });
  for (const username of mentions) {
    const mentioned = await get<{ id: string }>(
      `SELECT id FROM users WHERE lower(username) = lower(?)`,
      [username]
    );
    if (mentioned && mentioned.id !== input.userId) {
      await createNotification({
        userId: mentioned.id,
        actorId: input.userId,
        type: "mention",
        entityType: "post",
        entityId: id
      });
    }
  }
  if (input.repostOfPostId) {
    const original = await get<{ user_id: string }>(`SELECT user_id FROM posts WHERE id = ?`, [input.repostOfPostId]);
    if (original && original.user_id !== input.userId) {
      await createNotification({
        userId: original.user_id,
        actorId: input.userId,
        type: "repost",
        entityType: "post",
        entityId: input.repostOfPostId
      });
    }
  }
  return await getPostById(id, input.userId);
}

export async function createStory(input: {
  userId: string;
  body: string;
  mediaUrl?: string | null;
  destinationPath?: string | null;
  destinationLabel?: string | null;
  expiresAt?: string | null;
}) {
  const id = crypto.randomUUID();
  await run(
    `INSERT INTO stories (
       id, user_id, body, media_url, destination_path, destination_label, expires_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.body.trim(),
      input.mediaUrl ?? null,
      input.destinationPath ?? null,
      input.destinationLabel ?? null,
      input.expiresAt ?? null
    ]
  );

  const row = await get<StoryRow>(
    `SELECT
       s.id,
       s.body,
       s.media_url,
       s.destination_path,
       s.destination_label,
       s.created_at,
       s.expires_at,
       0 AS viewer_has_seen,
       u.id AS user_id,
       u.username,
       u.display_name,
       u.avatar_url,
       p.bio
     FROM stories s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE s.id = ?`,
    [id]
  );

  if (!row) {
    throw new Error("Story could not be created.");
  }

  return mapStory(row);
}

export async function markStorySeen(input: { storyId: string; viewerId: string }) {
  await run(
    `INSERT INTO story_views (story_id, user_id, seen_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(story_id, user_id) DO UPDATE SET seen_at = CURRENT_TIMESTAMP`,
    [input.storyId, input.viewerId]
  );
}

export async function createStoryEngagement(input: {
  storyId: string;
  viewerId: string;
  kind: "reaction" | "reply";
  emoji?: string | null;
  body?: string | null;
  media?: Array<{ storageKey: string; url: string; mimeType: string | null }>;
}) {
  const story = await get<{ user_id: string }>(
    `SELECT user_id FROM stories WHERE id = ? AND status = 'published'`,
    [input.storyId]
  );

  if (!story) {
    throw new Error("Story not found.");
  }

  await run(
    `INSERT INTO story_engagements (id, story_id, user_id, kind, emoji, body, storage_key, media_url, mime_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      input.storyId,
      input.viewerId,
      input.kind,
      input.emoji ?? null,
      input.body?.trim() ?? null,
      input.media?.[0]?.storageKey ?? null,
      input.media?.[0]?.url ?? null,
      input.media?.[0]?.mimeType ?? null
    ]
  );

  if (story.user_id !== input.viewerId) {
    await createNotification({
      userId: story.user_id,
      actorId: input.viewerId,
      type: input.kind === "reaction" ? "story_reaction" : "story_reply",
      entityType: "story",
      entityId: input.storyId
    });
  }

  return { ok: true };
}

export async function getStoryInbox(viewerId: string) {
  const [items, metrics] = await Promise.all([
    all<{
      id: string;
      kind: string;
      emoji: string | null;
      body: string | null;
      created_at: string;
      story_id: string;
      story_body: string;
      story_media_url: string | null;
      media_url: string | null;
      mime_type: string | null;
      actor_id: string;
      actor_username: string;
      actor_display_name: string;
      actor_avatar_url: string | null;
      actor_bio: string | null;
    }>(
      `SELECT
         se.id,
         se.kind,
         se.emoji,
         se.body,
         se.created_at,
         s.id AS story_id,
         s.body AS story_body,
         s.media_url AS story_media_url,
         se.media_url,
         se.mime_type,
         u.id AS actor_id,
         u.username AS actor_username,
         u.display_name AS actor_display_name,
         u.avatar_url AS actor_avatar_url,
         p.bio AS actor_bio
       FROM story_engagements se
       JOIN stories s ON s.id = se.story_id
       JOIN users u ON u.id = se.user_id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE s.user_id = ?
       ORDER BY se.created_at DESC
       LIMIT 20`,
      [viewerId]
    ),
    get<{
      reaction_count: number;
      reply_count: number;
    }>(
      `SELECT
         SUM(CASE WHEN se.kind = 'reaction' THEN 1 ELSE 0 END) AS reaction_count,
         SUM(CASE WHEN se.kind = 'reply' THEN 1 ELSE 0 END) AS reply_count
       FROM story_engagements se
       JOIN stories s ON s.id = se.story_id
       WHERE s.user_id = ?`,
      [viewerId]
    )
  ]);

  return {
    reactionsCount: metrics?.reaction_count ?? 0,
    repliesCount: metrics?.reply_count ?? 0,
    items: items.map((item) => ({
      id: item.id,
      kind: item.kind as "reaction" | "reply",
      emoji: item.emoji,
      body: item.body,
      media: item.media_url
        ? {
            url: normalizeStoredFileUrl(item.media_url) ?? item.media_url,
            mimeType: item.mime_type
          }
        : null,
      createdAt: item.created_at,
      story: {
        id: item.story_id,
        body: item.story_body,
        mediaUrl: normalizeStoredFileUrl(item.story_media_url)
      },
      actor: {
        id: item.actor_id,
        username: item.actor_username,
        displayName: item.actor_display_name,
        avatarUrl: normalizeStoredFileUrl(item.actor_avatar_url),
        bio: item.actor_bio
      }
    }))
  };
}

export async function updatePost(input: {
  postId: string;
  viewerId: string;
  body: string;
  status: "published" | "draft" | "scheduled";
  scheduledFor?: string | null;
}) {
  const normalizedBody = input.body.trim();
  const hashtags = extractHashtags(normalizedBody);
  const mentions = extractMentions(normalizedBody);
  const linkPreview = buildLinkPreview(normalizedBody);

  await transaction(async () => {
    await run(
      `UPDATE posts
       SET body = ?, status = ?, scheduled_for = ?, link_url = ?, link_title = ?, link_description = ?, link_domain = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [
        normalizedBody,
        input.status,
        input.status === "scheduled" ? input.scheduledFor ?? null : null,
        linkPreview?.url ?? null,
        linkPreview?.title ?? null,
        linkPreview?.description ?? null,
        linkPreview?.domain ?? null,
        input.postId,
        input.viewerId
      ]
    );
    await run(`DELETE FROM post_tags WHERE post_id = ?`, [input.postId]);
    await run(`DELETE FROM post_mentions WHERE post_id = ?`, [input.postId]);

    for (const tag of hashtags) {
      await run(`INSERT OR IGNORE INTO post_tags (post_id, tag) VALUES (?, ?)`, [input.postId, tag]);
    }
    for (const username of mentions) {
      const mentioned = await get<{ id: string }>(
        `SELECT id FROM users WHERE lower(username) = lower(?)`,
        [username]
      );
      if (mentioned) {
        await run(
          `INSERT OR IGNORE INTO post_mentions (post_id, mentioned_user_id) VALUES (?, ?)`,
          [input.postId, mentioned.id]
        );
      }
    }
  });

  return await getPostById(input.postId, input.viewerId);
}

export async function toggleRepost(postId: string, viewerId: string) {
  const existing = await get<{ id: string }>(
    `SELECT id
     FROM posts
     WHERE user_id = ? AND repost_of_post_id = ? AND deleted_at IS NULL
     LIMIT 1`,
    [viewerId, postId]
  );

  if (existing) {
    await run(
      `UPDATE posts
       SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [existing.id, viewerId]
    );
    return { reposted: false };
  }

  await createPost({
    userId: viewerId,
    body: "",
    repostOfPostId: postId,
    status: "published"
  });

  return { reposted: true };
}

export async function deletePost(postId: string, viewerId: string, canDeleteAnyPost = false) {
  if (canDeleteAnyPost) {
    await run(
      `UPDATE posts
       SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND deleted_at IS NULL`,
      [postId]
    );
    return;
  }

  await run(
    `UPDATE posts
     SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    [postId, viewerId]
  );
}

export async function updatePostStatus(input: {
  postId: string;
  viewerId: string;
  status: "published" | "draft" | "scheduled";
  scheduledFor?: string | null;
  canUpdateAnyPost?: boolean;
}) {
  if (input.canUpdateAnyPost) {
    await run(
      `UPDATE posts
       SET status = ?, scheduled_for = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND deleted_at IS NULL`,
      [input.status, input.status === "scheduled" ? input.scheduledFor ?? null : null, input.postId]
    );
    return;
  }

  await run(
    `UPDATE posts
     SET status = ?, scheduled_for = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [input.status, input.status === "scheduled" ? input.scheduledFor ?? null : null, input.postId, input.viewerId]
  );
}

export async function getCreatorDashboard(viewerId: string) {
  const [drafts, scheduled, published, metrics] = await Promise.all([
    getPostRowsForSql(
      `SELECT
         p.id, p.body, p.content_type, p.status, p.scheduled_for, p.created_at, p.repost_of_post_id,
         p.link_url, p.link_title, p.link_description, p.link_domain,
         u.id AS user_id, u.username, u.display_name, u.avatar_url, pr.bio,
         ${getPostLikeCountSql("p")} AS like_count,
         (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
         (SELECT COUNT(*) FROM posts rp WHERE rp.repost_of_post_id = p.id) AS repost_count,
         ${getPostViewCountSql("p")} AS view_count,
         EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS viewer_has_liked,
         EXISTS(SELECT 1 FROM saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = ?) AS viewer_has_saved,
         0 AS viewer_follows_author
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN profiles pr ON pr.user_id = u.id
       WHERE p.user_id = ? AND p.deleted_at IS NULL AND p.status = 'draft'
       ORDER BY p.created_at DESC`,
      [viewerId, viewerId, viewerId]
    ),
    getPostRowsForSql(
      `SELECT
         p.id, p.body, p.content_type, p.status, p.scheduled_for, p.created_at, p.repost_of_post_id,
         p.link_url, p.link_title, p.link_description, p.link_domain,
         u.id AS user_id, u.username, u.display_name, u.avatar_url, pr.bio,
         ${getPostLikeCountSql("p")} AS like_count,
         (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
         (SELECT COUNT(*) FROM posts rp WHERE rp.repost_of_post_id = p.id) AS repost_count,
         ${getPostViewCountSql("p")} AS view_count,
         EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS viewer_has_liked,
         EXISTS(SELECT 1 FROM saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = ?) AS viewer_has_saved,
         0 AS viewer_follows_author
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN profiles pr ON pr.user_id = u.id
       WHERE p.user_id = ? AND p.deleted_at IS NULL AND p.status = 'scheduled'
       ORDER BY p.scheduled_for ASC, p.created_at DESC`,
      [viewerId, viewerId, viewerId]
    ),
    getPostRowsForSql(
      `SELECT
         p.id, p.body, p.content_type, p.status, p.scheduled_for, p.created_at, p.repost_of_post_id,
         p.link_url, p.link_title, p.link_description, p.link_domain,
         u.id AS user_id, u.username, u.display_name, u.avatar_url, pr.bio,
         ${getPostLikeCountSql("p")} AS like_count,
         (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
         (SELECT COUNT(*) FROM posts rp WHERE rp.repost_of_post_id = p.id) AS repost_count,
         ${getPostViewCountSql("p")} AS view_count,
         EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS viewer_has_liked,
         EXISTS(SELECT 1 FROM saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = ?) AS viewer_has_saved,
         0 AS viewer_follows_author
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN profiles pr ON pr.user_id = u.id
       WHERE p.user_id = ?
         AND p.deleted_at IS NULL
         AND p.status = 'published'
         AND (p.scheduled_for IS NULL OR p.scheduled_for <= CURRENT_TIMESTAMP)
       ORDER BY p.created_at DESC
       LIMIT 12`,
      [viewerId, viewerId, viewerId]
    ),
    get<{
      published_count: number;
      draft_count: number;
      scheduled_count: number;
      total_likes: number;
      total_comments: number;
      total_saved: number;
      total_views: number;
    }>(
      `SELECT
         SUM(CASE WHEN p.status = 'published' AND p.deleted_at IS NULL THEN 1 ELSE 0 END) AS published_count,
         SUM(CASE WHEN p.status = 'draft' AND p.deleted_at IS NULL THEN 1 ELSE 0 END) AS draft_count,
         SUM(CASE WHEN p.status = 'scheduled' AND p.deleted_at IS NULL THEN 1 ELSE 0 END) AS scheduled_count,
         COUNT(DISTINCT l.rowid) AS total_likes,
         COUNT(DISTINCT c.id) AS total_comments,
         COUNT(DISTINCT s.rowid) AS total_saved,
         COUNT(DISTINCT v.id) AS total_views
       FROM posts p
       LEFT JOIN likes l ON l.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       LEFT JOIN saved_posts s ON s.post_id = p.id
       LEFT JOIN post_view_events v ON v.post_id = p.id
       WHERE p.user_id = ?`,
      [viewerId]
    )
  ]);

  return {
    drafts,
    scheduled,
    published,
    metrics: {
      publishedCount: metrics?.published_count ?? 0,
      draftCount: metrics?.draft_count ?? 0,
      scheduledCount: metrics?.scheduled_count ?? 0,
      totalLikes: metrics?.total_likes ?? 0,
      totalComments: metrics?.total_comments ?? 0,
      totalSaved: metrics?.total_saved ?? 0,
      totalViews: metrics?.total_views ?? 0
    }
  };
}

export async function getPostById(postId: string, viewerId: string) {
  const posts = await getPostRowsForSql(
    `SELECT
       p.id,
       p.body,
       p.content_type,
       p.status,
       p.scheduled_for,
       p.created_at,
       p.repost_of_post_id,
       p.link_url,
       p.link_title,
       p.link_description,
       p.link_domain,
       u.id AS user_id,
       u.username,
       u.display_name,
       u.avatar_url,
       pr.bio,
       ${getPostLikeCountSql("p")} AS like_count,
       (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
       (SELECT COUNT(*) FROM posts rp WHERE rp.repost_of_post_id = p.id) AS repost_count,
       ${getPostViewCountSql("p")} AS view_count,
       EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS viewer_has_liked,
       EXISTS(SELECT 1 FROM saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = ?) AS viewer_has_saved,
       EXISTS(SELECT 1 FROM follows f2 WHERE f2.following_id = u.id AND f2.follower_id = ?) AS viewer_follows_author
     FROM posts p
     JOIN users u ON u.id = p.user_id
     LEFT JOIN profiles pr ON pr.user_id = u.id
     WHERE p.deleted_at IS NULL
       AND (
         (p.status = 'published' AND (p.scheduled_for IS NULL OR p.scheduled_for <= CURRENT_TIMESTAMP))
         OR (u.id = ? AND p.status IN ('published', 'draft', 'scheduled'))
       )
       AND (
         COALESCE(pr.is_private, 0) = 0
         OR u.id = ?
         OR EXISTS(
           SELECT 1 FROM follows f3
           WHERE f3.follower_id = ? AND f3.following_id = u.id
         )
       )
       AND p.id = ?`,
    [viewerId, viewerId, viewerId, viewerId, viewerId, viewerId, postId]
  );
  return posts[0] ?? null;
}

export async function getOwnedEditablePost(postId: string, viewerId: string) {
  const posts = await getPostRowsForSql(
    `SELECT
       p.id,
       p.body,
       p.content_type,
       p.status,
       p.scheduled_for,
       p.created_at,
       p.repost_of_post_id,
       p.link_url,
       p.link_title,
       p.link_description,
       p.link_domain,
       u.id AS user_id,
       u.username,
       u.display_name,
       u.avatar_url,
       pr.bio,
       ${getPostLikeCountSql("p")} AS like_count,
       (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
       (SELECT COUNT(*) FROM posts rp WHERE rp.repost_of_post_id = p.id) AS repost_count,
       ${getPostViewCountSql("p")} AS view_count,
       EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS viewer_has_liked,
       EXISTS(SELECT 1 FROM saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = ?) AS viewer_has_saved,
       0 AS viewer_follows_author
     FROM posts p
     JOIN users u ON u.id = p.user_id
     LEFT JOIN profiles pr ON pr.user_id = u.id
     WHERE p.deleted_at IS NULL
       AND p.user_id = ?
       AND p.id = ?`,
    [viewerId, viewerId, viewerId, postId]
  );
  return posts[0] ?? null;
}

export async function toggleLike(postId: string, viewerId: string) {
  const existing = await get<{ user_id: string }>(
    `SELECT user_id FROM likes WHERE post_id = ? AND user_id = ?`,
    [postId, viewerId]
  );

  if (existing) {
    await run(`DELETE FROM likes WHERE post_id = ? AND user_id = ?`, [postId, viewerId]);
    return { liked: false };
  }

  await run(`INSERT INTO likes (user_id, post_id) VALUES (?, ?)`, [viewerId, postId]);
  const postOwner = await get<{ user_id: string }>(`SELECT user_id FROM posts WHERE id = ?`, [postId]);
  if (postOwner && postOwner.user_id !== viewerId) {
    await createNotification({
      userId: postOwner.user_id,
      actorId: viewerId,
      type: "like",
      entityType: "post",
      entityId: postId
    });
  }
  return { liked: true };
}

export async function toggleSavePost(postId: string, viewerId: string) {
  const existing = await get<{ user_id: string }>(
    `SELECT user_id FROM saved_posts WHERE post_id = ? AND user_id = ?`,
    [postId, viewerId]
  );
  if (existing) {
    await run(`DELETE FROM saved_posts WHERE post_id = ? AND user_id = ?`, [postId, viewerId]);
    return { saved: false };
  }
  await run(`INSERT INTO saved_posts (user_id, post_id) VALUES (?, ?)`, [viewerId, postId]);
  return { saved: true };
}

export async function getSavedPosts(viewerId: string) {
  return await getPostRowsForSql(
    `SELECT
       p.id,
       p.body,
       p.content_type,
       p.status,
       p.scheduled_for,
       p.created_at,
       p.repost_of_post_id,
       p.link_url,
       p.link_title,
       p.link_description,
       p.link_domain,
       u.id AS user_id,
       u.username,
       u.display_name,
       u.avatar_url,
       pr.bio,
       ${getPostLikeCountSql("p")} AS like_count,
       (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
       (SELECT COUNT(*) FROM posts rp WHERE rp.repost_of_post_id = p.id) AS repost_count,
       ${getPostViewCountSql("p")} AS view_count,
       EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS viewer_has_liked,
       EXISTS(SELECT 1 FROM saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = ?) AS viewer_has_saved,
       EXISTS(SELECT 1 FROM follows f2 WHERE f2.following_id = u.id AND f2.follower_id = ?) AS viewer_follows_author
     FROM saved_posts s
     JOIN posts p ON p.id = s.post_id
     JOIN users u ON u.id = p.user_id
     LEFT JOIN profiles pr ON pr.user_id = u.id
     WHERE s.user_id = ? AND p.deleted_at IS NULL
     ORDER BY s.created_at DESC`,
    [viewerId, viewerId, viewerId, viewerId]
  );
}

export async function voteOnPoll(optionId: string, viewerId: string) {
  const option = await get<{ post_id: string }>(`SELECT post_id FROM poll_options WHERE id = ?`, [optionId]);
  if (!option) {
    throw new Error("Poll option not found.");
  }
  await run(
    `DELETE FROM poll_votes
     WHERE user_id = ?
       AND poll_option_id IN (SELECT id FROM poll_options WHERE post_id = ?)`,
    [viewerId, option.post_id]
  );
  await run(`INSERT INTO poll_votes (poll_option_id, user_id) VALUES (?, ?)`, [optionId, viewerId]);
  return await getPostById(option.post_id, viewerId);
}

export async function addComment(input: {
  postId: string;
  viewerId: string;
  body: string;
  media?: Array<{ storageKey: string; url: string; mimeType: string | null }>;
}) {
  const id = crypto.randomUUID();
  await transaction(async () => {
    await run(`INSERT INTO comments (id, post_id, user_id, body) VALUES (?, ?, ?, ?)`, [
      id,
      input.postId,
      input.viewerId,
      input.body
    ]);
    for (const media of input.media ?? []) {
      await run(
        `INSERT INTO comment_media (id, comment_id, storage_key, url, mime_type)
         VALUES (?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), id, media.storageKey, media.url, media.mimeType]
      );
    }
  });

  const postOwner = await get<{ user_id: string }>(`SELECT user_id FROM posts WHERE id = ?`, [
    input.postId
  ]);
  if (postOwner && postOwner.user_id !== input.viewerId) {
    await createNotification({
      userId: postOwner.user_id,
      actorId: input.viewerId,
      type: "comment",
      entityType: "post",
      entityId: input.postId
    });
  }

  return id;
}

export async function getCommentsForPost(postId: string) {
  const rows = await all<
    {
      id: string;
      body: string;
      created_at: string;
      user_id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      bio: string | null;
    }
  >(
    `SELECT
       c.id,
       c.body,
       c.created_at,
       u.id AS user_id,
       u.username,
       u.display_name,
       u.avatar_url,
       p.bio
     FROM comments c
     JOIN users u ON u.id = c.user_id
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE c.post_id = ?
     ORDER BY c.created_at ASC`,
    [postId]
  );

  const media = await all<{
    id: string;
    comment_id: string;
    storage_key: string | null;
    url: string;
    mime_type: string | null;
  }>(
    `SELECT id, comment_id, storage_key, url, mime_type
     FROM comment_media
     WHERE comment_id IN (SELECT id FROM comments WHERE post_id = ?)
     ORDER BY created_at ASC`,
    [postId]
  );

  return rows.map<CommentRecord>((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    media: media
      .filter((item) => item.comment_id === row.id)
      .map((item) => ({
        id: item.id,
        url: normalizeStoredFileUrl(item.url, item.storage_key) ?? item.url,
        mimeType: item.mime_type
      })),
    author: {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: normalizeStoredFileUrl(row.avatar_url),
      bio: row.bio
    }
  }));
}

export async function toggleFollow(targetUserId: string, viewerId: string) {
  const existing = await get<{ follower_id: string }>(
    `SELECT follower_id FROM follows WHERE follower_id = ? AND following_id = ?`,
    [viewerId, targetUserId]
  );

  if (existing) {
    await run(`DELETE FROM follows WHERE follower_id = ? AND following_id = ?`, [
      viewerId,
      targetUserId
    ]);
    return { following: false };
  }

  await run(`INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`, [
    viewerId,
    targetUserId
  ]);

  if (viewerId !== targetUserId) {
    await createNotification({
      userId: targetUserId,
      actorId: viewerId,
      type: "follow",
      entityType: "user",
      entityId: targetUserId
    });
  }
  return { following: true };
}

async function getFollowList(userId: string, kind: "followers" | "following") {
  const query =
    kind === "followers"
      ? `SELECT u.id, u.email, u.username, u.display_name, u.avatar_url, p.bio, p.website, p.location, COALESCE(p.is_private, 0) AS is_private
         FROM follows f
         JOIN users u ON u.id = f.follower_id
         LEFT JOIN profiles p ON p.user_id = u.id
         WHERE f.following_id = ?
         ORDER BY f.created_at DESC
         LIMIT 12`
      : `SELECT u.id, u.email, u.username, u.display_name, u.avatar_url, p.bio, p.website, p.location, COALESCE(p.is_private, 0) AS is_private
         FROM follows f
         JOIN users u ON u.id = f.following_id
         LEFT JOIN profiles p ON p.user_id = u.id
         WHERE f.follower_id = ?
         ORDER BY f.created_at DESC
         LIMIT 12`;

  const rows = await all<UserRow>(query, [userId]);
  return rows.map((row) => mapUser(row));
}

export async function getProfilePage(username: string, viewerId: string) {
  const user = await getUserByUsername(username);
  if (!user) {
    return null;
  }

  const canViewContent =
    !user.isPrivate || (await canViewerAccessPrivateContent(user.id, viewerId));

  const [followerCountRow, followingCountRow, postCountRow, isFollowingRow, followers, following, pinnedPostRef, insightRow] =
    await Promise.all([
      get<{ count: number }>(`SELECT COUNT(*) AS count FROM follows WHERE following_id = ?`, [user.id]),
      get<{ count: number }>(`SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?`, [user.id]),
      get<{ count: number }>(`SELECT COUNT(*) AS count FROM posts WHERE user_id = ? AND deleted_at IS NULL`, [
        user.id
      ]),
      get<{ match: number }>(
        `SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?) AS match`,
        [viewerId, user.id]
      ),
      getFollowList(user.id, "followers"),
      getFollowList(user.id, "following"),
      get<{ pinned_post_id: string | null }>(`SELECT pinned_post_id FROM profiles WHERE user_id = ?`, [user.id]),
      get<{
        total_posts: number;
        total_likes: number;
        total_comments: number;
        total_saved: number;
        total_views: number;
      }>(
        `SELECT
           (SELECT COUNT(*) FROM posts p WHERE p.user_id = ? AND p.deleted_at IS NULL) AS total_posts,
           COALESCE(
             (SELECT ueo.like_count FROM user_engagement_overrides ueo WHERE ueo.user_id = ?),
             (
               SELECT COUNT(DISTINCT l.rowid)
               FROM posts p
               LEFT JOIN likes l ON l.post_id = p.id
               WHERE p.user_id = ? AND p.deleted_at IS NULL
             )
           ) AS total_likes,
           (
             SELECT COUNT(DISTINCT c.id)
             FROM posts p
             LEFT JOIN comments c ON c.post_id = p.id
             WHERE p.user_id = ? AND p.deleted_at IS NULL
           ) AS total_comments,
           (
             SELECT COUNT(DISTINCT s.rowid)
             FROM posts p
             LEFT JOIN saved_posts s ON s.post_id = p.id
             WHERE p.user_id = ? AND p.deleted_at IS NULL
           ) AS total_saved,
           COALESCE(
             (SELECT ueo.view_count FROM user_engagement_overrides ueo WHERE ueo.user_id = ?),
             (
               SELECT COUNT(DISTINCT v.id)
               FROM posts p
               LEFT JOIN post_view_events v ON v.post_id = p.id
               WHERE p.user_id = ? AND p.deleted_at IS NULL
             )
           ) AS total_views`,
        [user.id, user.id, user.id, user.id, user.id, user.id, user.id]
      )
    ]);

  const postRows = canViewContent
    ? await getPostRowsForSql(
        `SELECT
        p.id,
        p.body,
        p.content_type,
        p.status,
        p.scheduled_for,
        p.created_at,
       p.repost_of_post_id,
       p.link_url,
       p.link_title,
       p.link_description,
       p.link_domain,
       u.id AS user_id,
       u.username,
       u.display_name,
       u.avatar_url,
       pr.bio,
       ${getPostLikeCountSql("p")} AS like_count,
       (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
       (SELECT COUNT(*) FROM posts rp WHERE rp.repost_of_post_id = p.id) AS repost_count,
       ${getPostViewCountSql("p")} AS view_count,
       EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS viewer_has_liked,
       EXISTS(SELECT 1 FROM saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = ?) AS viewer_has_saved,
       EXISTS(SELECT 1 FROM follows f2 WHERE f2.following_id = u.id AND f2.follower_id = ?) AS viewer_follows_author
     FROM posts p
     JOIN users u ON u.id = p.user_id
     LEFT JOIN profiles pr ON pr.user_id = u.id
     WHERE p.user_id = ?
       AND p.deleted_at IS NULL
       AND (
         p.status = 'published'
         OR (u.id = ? AND p.status IN ('draft', 'scheduled'))
       )
     ORDER BY p.created_at DESC`,
        [viewerId, viewerId, viewerId, user.id, viewerId]
      )
    : [];

  const pinnedPost = canViewContent && pinnedPostRef?.pinned_post_id
    ? postRows.find((post) => post.id === pinnedPostRef.pinned_post_id) ??
      (await getPostById(pinnedPostRef.pinned_post_id, viewerId))
    : null;

  return {
    user: {
      ...user,
      pinnedPostId: pinnedPostRef?.pinned_post_id ?? null,
      followerCount: followerCountRow?.count ?? 0,
      followingCount: followingCountRow?.count ?? 0,
      postCount: postCountRow?.count ?? 0,
      isFollowing: Boolean(isFollowingRow?.match),
      followers,
      following
    },
    canViewContent,
    posts: postRows,
    pinnedPost,
    insights: {
      totalPosts: insightRow?.total_posts ?? 0,
      totalLikes: insightRow?.total_likes ?? 0,
      totalComments: insightRow?.total_comments ?? 0,
      totalSaved: insightRow?.total_saved ?? 0,
      totalViews: insightRow?.total_views ?? 0
    }
  } satisfies ProfilePageData;
}

export async function pinProfilePost(postId: string | null, viewerId: string) {
  await run(`UPDATE profiles SET pinned_post_id = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`, [
    postId,
    viewerId
  ]);
}

export async function setUserEngagementOverride(input: {
  userId: string;
  likeCount: number;
  viewCount: number;
}) {
  await run(
    `INSERT INTO user_engagement_overrides (user_id, like_count, view_count, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO UPDATE SET
       like_count = excluded.like_count,
       view_count = excluded.view_count,
       updated_at = CURRENT_TIMESTAMP`,
    [input.userId, input.likeCount, input.viewCount]
  );
}

export async function setPostEngagementOverride(input: {
  postId: string;
  likeCount: number;
  viewCount: number;
}) {
  await run(
    `INSERT INTO post_engagement_overrides (post_id, like_count, view_count, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(post_id) DO UPDATE SET
       like_count = excluded.like_count,
       view_count = excluded.view_count,
       updated_at = CURRENT_TIMESTAMP`,
    [input.postId, input.likeCount, input.viewCount]
  );
}

export async function searchAll(query: string, viewerId: string) {
  const like = `%${query}%`;
  const normalizedTag = query.startsWith("#") ? query.slice(1).toLowerCase() : null;
  const users = (
    await all<UserRow>(
      `SELECT u.id, u.email, u.username, u.display_name, u.avatar_url, p.bio, p.website, p.location, COALESCE(p.is_private, 0) AS is_private
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.username LIKE ? OR u.display_name LIKE ? OR p.bio LIKE ?
       ORDER BY u.created_at DESC
       LIMIT 12`,
      [like, like, like]
    )
  ).map((row) => mapUser(row));

  const posts = await getPostRowsForSql(
    `SELECT
       p.id,
       p.body,
       p.content_type,
       p.status,
       p.scheduled_for,
       p.created_at,
       p.repost_of_post_id,
       p.link_url,
       p.link_title,
       p.link_description,
       p.link_domain,
       u.id AS user_id,
       u.username,
       u.display_name,
       u.avatar_url,
       pr.bio,
       ${getPostLikeCountSql("p")} AS like_count,
       (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
       (SELECT COUNT(*) FROM posts rp WHERE rp.repost_of_post_id = p.id) AS repost_count,
       ${getPostViewCountSql("p")} AS view_count,
       EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) AS viewer_has_liked,
       EXISTS(SELECT 1 FROM saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = ?) AS viewer_has_saved,
       EXISTS(SELECT 1 FROM follows f2 WHERE f2.following_id = u.id AND f2.follower_id = ?) AS viewer_follows_author
     FROM posts p
     JOIN users u ON u.id = p.user_id
     LEFT JOIN profiles pr ON pr.user_id = u.id
     WHERE p.deleted_at IS NULL
       AND p.status = 'published'
       AND (p.scheduled_for IS NULL OR p.scheduled_for <= CURRENT_TIMESTAMP)
       AND (
         COALESCE(pr.is_private, 0) = 0
         OR u.id = ?
         OR EXISTS(
           SELECT 1 FROM follows f3
           WHERE f3.follower_id = ? AND f3.following_id = u.id
         )
       )
       AND (
         p.body LIKE ?
         OR (? IS NOT NULL AND EXISTS(SELECT 1 FROM post_tags pt WHERE pt.post_id = p.id AND pt.tag = ?))
       )
     ORDER BY p.created_at DESC
     LIMIT 12`,
    [viewerId, viewerId, viewerId, viewerId, viewerId, like, normalizedTag, normalizedTag]
  );

  return {
    users,
    posts
  } satisfies SearchResults;
}

export async function getConversationSummaries(viewerId: string) {
  const rows = await all<
    {
      id: string;
      updated_at: string;
      is_pinned: number;
      is_archived: number;
      is_muted: number;
      counterpart_id: string;
      counterpart_username: string;
      counterpart_display_name: string;
      counterpart_avatar_url: string | null;
      counterpart_bio: string | null;
      last_message_body: string | null;
      last_message_created_at: string | null;
      last_message_sender_id: string | null;
      last_message_media_mime_type: string | null;
      unread_count: number;
    }
  >(
    `SELECT
       c.id,
       c.updated_at,
       self_member.is_pinned,
       self_member.is_archived,
       self_member.is_muted,
       u.id AS counterpart_id,
       u.username AS counterpart_username,
       u.display_name AS counterpart_display_name,
       u.avatar_url AS counterpart_avatar_url,
       p.bio AS counterpart_bio,
       (
         SELECT m.body
         FROM messages m
         WHERE m.conversation_id = c.id
         ORDER BY m.created_at DESC
         LIMIT 1
       ) AS last_message_body,
       (
         SELECT m.created_at
         FROM messages m
         WHERE m.conversation_id = c.id
         ORDER BY m.created_at DESC
         LIMIT 1
       ) AS last_message_created_at,
       (
         SELECT m.sender_id
         FROM messages m
         WHERE m.conversation_id = c.id
         ORDER BY m.created_at DESC
         LIMIT 1
       ) AS last_message_sender_id,
       (
         SELECT mm.mime_type
         FROM messages m
         JOIN message_media mm ON mm.message_id = m.id
         WHERE m.conversation_id = c.id
         ORDER BY m.created_at DESC, mm.created_at ASC
         LIMIT 1
       ) AS last_message_media_mime_type,
       (
         SELECT COUNT(*)
         FROM messages m
         JOIN conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = ?
         WHERE m.conversation_id = c.id
           AND m.sender_id <> ?
           AND (cm.last_read_message_at IS NULL OR m.created_at > cm.last_read_message_at)
       ) AS unread_count
     FROM conversations c
     JOIN conversation_members self_member ON self_member.conversation_id = c.id AND self_member.user_id = ?
     JOIN conversation_members other_member ON other_member.conversation_id = c.id AND other_member.user_id <> ?
     JOIN users u ON u.id = other_member.user_id
     LEFT JOIN profiles p ON p.user_id = u.id
     ORDER BY self_member.is_pinned DESC, self_member.is_archived ASC, c.updated_at DESC`,
    [viewerId, viewerId, viewerId, viewerId]
  );

  return rows.map<ConversationSummary>((row) => ({
    id: row.id,
    updatedAt: row.updated_at,
    unreadCount: row.unread_count,
    isPinned: Boolean(row.is_pinned),
    isArchived: Boolean(row.is_archived),
    isMuted: Boolean(row.is_muted),
    counterpart: {
      id: row.counterpart_id,
      username: row.counterpart_username,
      displayName: row.counterpart_display_name,
      avatarUrl: row.counterpart_avatar_url,
      bio: row.counterpart_bio
    },
    lastMessage: row.last_message_body
      ? {
          body: row.last_message_body,
          createdAt: row.last_message_created_at ?? row.updated_at,
          senderId: row.last_message_sender_id ?? row.counterpart_id,
          mediaMimeType: row.last_message_media_mime_type
        }
      : row.last_message_media_mime_type
        ? {
            body: "",
            createdAt: row.last_message_created_at ?? row.updated_at,
            senderId: row.last_message_sender_id ?? row.counterpart_id,
            mediaMimeType: row.last_message_media_mime_type
          }
        : null
  }));
}

export async function createOrGetDirectConversation(firstUserId: string, secondUserId: string) {
  if (!secondUserId) {
    throw new Error("Recipient is required to start a new conversation.");
  }

  const existing = await get<{ conversation_id: string }>(
    `SELECT cm.conversation_id
     FROM conversation_members cm
     WHERE cm.user_id IN (?, ?)
     GROUP BY cm.conversation_id
     HAVING COUNT(DISTINCT cm.user_id) = 2
       AND (SELECT COUNT(*) FROM conversation_members x WHERE x.conversation_id = cm.conversation_id) = 2
     LIMIT 1`,
    [firstUserId, secondUserId]
  );

  if (existing) {
    return existing.conversation_id;
  }

  const conversationId = crypto.randomUUID();
  await transaction(async () => {
    await run(`INSERT INTO conversations (id) VALUES (?)`, [conversationId]);
    await run(`INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)`, [
      conversationId,
      firstUserId
    ]);
    await run(`INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)`, [
      conversationId,
      secondUserId
    ]);
  });
  return conversationId;
}

export async function sendMessage(input: {
  senderId: string;
  conversationId?: string;
  recipientId?: string;
  body: string;
  replyToMessageId?: string | null;
  media?: Array<{ storageKey: string; url: string; mimeType: string | null }>;
}) {
  const conversationId =
    input.conversationId ??
    (await createOrGetDirectConversation(input.senderId, input.recipientId ?? ""));
  const id = crypto.randomUUID();
  const normalizedBody = input.body.trim();

  await transaction(async () => {
    await run(
      `INSERT INTO messages (id, conversation_id, sender_id, body, reply_to_message_id)
       VALUES (?, ?, ?, ?, ?)`,
      [id, conversationId, input.senderId, normalizedBody, input.replyToMessageId ?? null]
    );
    for (const media of input.media ?? []) {
      await run(
        `INSERT INTO message_media (id, message_id, storage_key, url, mime_type)
         VALUES (?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), id, media.storageKey, media.url, media.mimeType]
      );
    }
    await run(
      `UPDATE conversations
       SET updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [conversationId]
    );
    await run(
      `UPDATE conversation_members
       SET last_read_message_at = CURRENT_TIMESTAMP
       WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, input.senderId]
    );
  });

  const recipients = await all<{ user_id: string }>(
    `SELECT user_id FROM conversation_members WHERE conversation_id = ? AND user_id <> ?`,
    [conversationId, input.senderId]
  );

  for (const recipient of recipients) {
    await createNotification({
      userId: recipient.user_id,
      actorId: input.senderId,
      type: "message",
      entityType: "conversation",
      entityId: conversationId
    });
  }

  return {
    conversationId,
    messageId: id
  };
}

export async function setConversationState(input: {
  viewerId: string;
  conversationId: string;
  isPinned?: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
}) {
  const current = await get<{ is_pinned: number; is_archived: number; is_muted: number }>(
    `SELECT is_pinned, is_archived, is_muted FROM conversation_members WHERE conversation_id = ? AND user_id = ?`,
    [input.conversationId, input.viewerId]
  );
  if (!current) {
    throw new Error("Conversation not found.");
  }
  await run(
    `UPDATE conversation_members
     SET is_pinned = ?, is_archived = ?, is_muted = ?
     WHERE conversation_id = ? AND user_id = ?`,
    [
      input.isPinned === undefined ? current.is_pinned : Number(input.isPinned),
      input.isArchived === undefined ? current.is_archived : Number(input.isArchived),
      input.isMuted === undefined ? current.is_muted : Number(input.isMuted),
      input.conversationId,
      input.viewerId
    ]
  );
}

export async function getConversationThread(conversationId: string, viewerId: string) {
  const member = await get<{ user_id: string }>(
    `SELECT user_id FROM conversation_members WHERE conversation_id = ? AND user_id = ?`,
    [conversationId, viewerId]
  );
  if (!member) {
    return null;
  }

  const messages = await all<
    {
      id: string;
      body: string;
      created_at: string;
      sender_id: string;
      reply_to_message_id: string | null;
      reply_to_body: string | null;
      reply_to_sender_display_name: string | null;
      username: string;
      display_name: string;
      avatar_url: string | null;
      bio: string | null;
    }
  >(
    `SELECT
       m.id,
       m.body,
       m.created_at,
       u.id AS sender_id,
       m.reply_to_message_id,
       reply_message.body AS reply_to_body,
       reply_sender.display_name AS reply_to_sender_display_name,
       u.username,
       u.display_name,
       u.avatar_url,
       p.bio
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     LEFT JOIN profiles p ON p.user_id = u.id
     LEFT JOIN messages reply_message ON reply_message.id = m.reply_to_message_id
     LEFT JOIN users reply_sender ON reply_sender.id = reply_message.sender_id
     WHERE m.conversation_id = ?
     ORDER BY m.created_at ASC`,
    [conversationId]
  );
  const media = await all<{
    id: string;
    message_id: string;
    storage_key: string | null;
    url: string;
    mime_type: string | null;
  }>(
    `SELECT id, message_id, storage_key, url, mime_type
     FROM message_media
     WHERE message_id IN (SELECT id FROM messages WHERE conversation_id = ?)
     ORDER BY created_at ASC`,
    [conversationId]
  );
  const reactions = await all<{
    message_id: string;
    emoji: string;
    count: number;
    viewer_reacted: number;
  }>(
    `SELECT
       mr.message_id,
       mr.emoji,
       COUNT(*) AS count,
       MAX(CASE WHEN mr.user_id = ? THEN 1 ELSE 0 END) AS viewer_reacted
     FROM message_reactions mr
     WHERE mr.message_id IN (
       SELECT id FROM messages WHERE conversation_id = ?
     )
     GROUP BY mr.message_id, mr.emoji`,
    [viewerId, conversationId]
  );

  await run(
    `UPDATE conversation_members
     SET last_read_message_at = CURRENT_TIMESTAMP
     WHERE conversation_id = ? AND user_id = ?`,
    [conversationId, viewerId]
  );

  return messages.map<MessageRecord>((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    senderId: row.sender_id,
    media: media
      .filter((item) => item.message_id === row.id)
      .map((item) => ({
        id: item.id,
        url: normalizeStoredFileUrl(item.url, item.storage_key) ?? item.url,
        mimeType: item.mime_type
      })),
    replyTo: row.reply_to_message_id
      ? {
          id: row.reply_to_message_id,
          body: row.reply_to_body ?? "",
          senderDisplayName: row.reply_to_sender_display_name ?? "Unknown"
        }
      : null,
    reactions: reactions
      .filter((reaction) => reaction.message_id === row.id)
      .map((reaction) => ({
        emoji: reaction.emoji,
        count: reaction.count,
        viewerReacted: Boolean(reaction.viewer_reacted)
      })),
    sender: {
      id: row.sender_id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: normalizeStoredFileUrl(row.avatar_url),
      bio: row.bio
    }
  }));
}

export async function getConversationReadState(conversationId: string, viewerId: string) {
  const row = await get<{
    counterpart_display_name: string;
    counterpart_last_read_message_at: string | null;
  }>(
    `SELECT
       u.display_name AS counterpart_display_name,
       cm.last_read_message_at AS counterpart_last_read_message_at
     FROM conversation_members self_member
     JOIN conversation_members cm ON cm.conversation_id = self_member.conversation_id AND cm.user_id <> self_member.user_id
     JOIN users u ON u.id = cm.user_id
     WHERE self_member.conversation_id = ? AND self_member.user_id = ?
     LIMIT 1`,
    [conversationId, viewerId]
  );

  if (!row) {
    return null;
  }

  return {
    counterpartDisplayName: row.counterpart_display_name,
    counterpartLastReadMessageAt: row.counterpart_last_read_message_at
  };
}

export async function setConversationTypingState(input: {
  conversationId: string;
  viewerId: string;
  isTyping: boolean;
}) {
  await run(
    `INSERT INTO conversation_typing_states (conversation_id, user_id, is_typing, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(conversation_id, user_id) DO UPDATE SET
       is_typing = excluded.is_typing,
       updated_at = CURRENT_TIMESTAMP`,
    [input.conversationId, input.viewerId, Number(input.isTyping)]
  );
}

export async function getConversationTypingState(conversationId: string, viewerId: string) {
  const row = await get<{
    counterpart_display_name: string;
    is_typing: number;
    updated_at: string;
  }>(
    `SELECT
       u.display_name AS counterpart_display_name,
       cts.is_typing,
       cts.updated_at
     FROM conversation_members self_member
     JOIN conversation_members cm ON cm.conversation_id = self_member.conversation_id AND cm.user_id <> self_member.user_id
     JOIN users u ON u.id = cm.user_id
     LEFT JOIN conversation_typing_states cts
       ON cts.conversation_id = self_member.conversation_id
      AND cts.user_id = cm.user_id
     WHERE self_member.conversation_id = ? AND self_member.user_id = ?
     LIMIT 1`,
    [conversationId, viewerId]
  );

  if (!row) {
    return null;
  }

  const active =
    Boolean(row.is_typing) &&
    Date.now() - new Date(row.updated_at).getTime() < 10000;

  return {
    counterpartDisplayName: row.counterpart_display_name,
    isTyping: active
  };
}

export async function recordPostView(input: {
  postId: string;
  viewerId: string;
  context: string;
}) {
  const recent = await get<{ id: string }>(
    `SELECT id
     FROM post_view_events
     WHERE post_id = ?
       AND viewer_user_id = ?
       AND view_context = ?
       AND created_at >= datetime('now', '-30 minutes')
     LIMIT 1`,
    [input.postId, input.viewerId, input.context]
  );

  if (recent) {
    return { recorded: false };
  }

  await run(
    `INSERT INTO post_view_events (id, post_id, viewer_user_id, view_context)
     VALUES (?, ?, ?, ?)`,
    [crypto.randomUUID(), input.postId, input.viewerId, input.context]
  );

  return { recorded: true };
}

export async function toggleMessageReaction(messageId: string, viewerId: string, emoji: string) {
  const existing = await get<{ message_id: string }>(
    `SELECT message_id FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?`,
    [messageId, viewerId, emoji]
  );
  if (existing) {
    await run(`DELETE FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?`, [
      messageId,
      viewerId,
      emoji
    ]);
    return { reacted: false };
  }
  await run(`INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)`, [
    messageId,
    viewerId,
    emoji
  ]);
  return { reacted: true };
}

export async function getNotifications(viewerId: string) {
  const rows = await all<
    {
      id: string;
      type: string;
      entity_type: string | null;
      entity_id: string | null;
      read_at: string | null;
      created_at: string;
      actor_id: string | null;
      actor_username: string | null;
      actor_display_name: string | null;
      actor_avatar_url: string | null;
      actor_bio: string | null;
    }
  >(
    `SELECT
       n.id,
       n.type,
       n.entity_type,
       n.entity_id,
       n.read_at,
       n.created_at,
       u.id AS actor_id,
       u.username AS actor_username,
       u.display_name AS actor_display_name,
       u.avatar_url AS actor_avatar_url,
       p.bio AS actor_bio
     FROM notifications n
     LEFT JOIN users u ON u.id = n.actor_id
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE n.user_id = ?
     ORDER BY n.created_at DESC
     LIMIT 100`,
    [viewerId]
  );

  return rows.map<NotificationRecord>((row) => ({
    id: row.id,
    type: row.type,
    entityId: row.entity_id,
    entityType: row.entity_type,
    readAt: row.read_at,
    createdAt: row.created_at,
    actor: row.actor_id
      ? {
          id: row.actor_id,
          username: row.actor_username ?? "unknown",
          displayName: row.actor_display_name ?? "Unknown",
          avatarUrl: normalizeStoredFileUrl(row.actor_avatar_url),
          bio: row.actor_bio
        }
      : null
  }));
}

export async function getActivitySummary(viewerId: string) {
  const [unreadNotifications, unreadMessages, notifications] = await Promise.all([
    get<{ count: number }>(
      `SELECT COUNT(*) AS count
       FROM notifications
       WHERE user_id = ? AND read_at IS NULL`,
      [viewerId]
    ),
    get<{ count: number }>(
      `SELECT COUNT(*) AS count
       FROM messages m
       JOIN conversation_members cm
         ON cm.conversation_id = m.conversation_id
        AND cm.user_id = ?
       WHERE m.sender_id <> ?
         AND (cm.last_read_message_at IS NULL OR m.created_at > cm.last_read_message_at)`,
      [viewerId, viewerId]
    ),
    getNotifications(viewerId)
  ]);

  return {
    unreadNotificationCount: unreadNotifications?.count ?? 0,
    unreadMessageCount: unreadMessages?.count ?? 0,
    notifications: notifications.slice(0, 8)
  };
}

export async function markNotificationsRead(viewerId: string) {
  await run(
    `UPDATE notifications
     SET read_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND read_at IS NULL`,
    [viewerId]
  );
}

export async function getNotificationPreferences(viewerId: string) {
  const row = await get<{
    likes_enabled: number;
    comments_enabled: number;
    follows_enabled: number;
    messages_enabled: number;
    quiet_hours_start: number | null;
    quiet_hours_end: number | null;
  }>(
    `SELECT likes_enabled, comments_enabled, follows_enabled, messages_enabled, quiet_hours_start, quiet_hours_end
     FROM notification_preferences
     WHERE user_id = ?`,
    [viewerId]
  );
  return {
    likesEnabled: Boolean(row?.likes_enabled ?? 1),
    commentsEnabled: Boolean(row?.comments_enabled ?? 1),
    followsEnabled: Boolean(row?.follows_enabled ?? 1),
    messagesEnabled: Boolean(row?.messages_enabled ?? 1),
    quietHoursStart: row?.quiet_hours_start ?? null,
    quietHoursEnd: row?.quiet_hours_end ?? null
  } satisfies NotificationPreferences;
}

export async function updateNotificationPreferences(
  viewerId: string,
  input: NotificationPreferences
) {
  await run(
    `INSERT INTO notification_preferences (
       user_id, likes_enabled, comments_enabled, follows_enabled, messages_enabled, quiet_hours_start, quiet_hours_end, updated_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO UPDATE SET
       likes_enabled = excluded.likes_enabled,
       comments_enabled = excluded.comments_enabled,
       follows_enabled = excluded.follows_enabled,
       messages_enabled = excluded.messages_enabled,
       quiet_hours_start = excluded.quiet_hours_start,
       quiet_hours_end = excluded.quiet_hours_end,
       updated_at = CURRENT_TIMESTAMP`,
    [
      viewerId,
      Number(input.likesEnabled),
      Number(input.commentsEnabled),
      Number(input.followsEnabled),
      Number(input.messagesEnabled),
      input.quietHoursStart,
      input.quietHoursEnd
    ]
  );
}

export async function setUserInterest(viewerId: string, interest: string, enabled: boolean) {
  if (enabled) {
    await run(`INSERT OR IGNORE INTO user_interests (user_id, interest) VALUES (?, ?)`, [
      viewerId,
      interest
    ]);
    return;
  }
  await run(`DELETE FROM user_interests WHERE user_id = ? AND interest = ?`, [viewerId, interest]);
}

export async function getUserInterests(viewerId: string) {
  const rows = await all<{ interest: string }>(
    `SELECT interest FROM user_interests WHERE user_id = ? ORDER BY interest ASC`,
    [viewerId]
  );
  return rows.map((row) => row.interest);
}

export async function getSuggestedUsers(viewerId: string) {
  const interests = await getUserInterests(viewerId);
  const interestUsers =
    interests.length > 0
      ? await all<UserRow>(
          `SELECT DISTINCT u.id, u.email, u.username, u.display_name, u.avatar_url, p.bio, p.website, p.location, COALESCE(p.is_private, 0) AS is_private
           FROM user_interests ui
           JOIN users u ON u.id = ui.user_id
           LEFT JOIN profiles p ON p.user_id = u.id
           WHERE ui.interest IN (${interests.map(() => "?").join(", ")})
             AND u.id <> ?
             AND NOT EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.following_id = u.id)
           LIMIT 8`,
          [...interests, viewerId, viewerId]
        )
      : [];

  const fallback = await all<UserRow>(
    `SELECT u.id, u.email, u.username, u.display_name, u.avatar_url, p.bio, p.website, p.location, COALESCE(p.is_private, 0) AS is_private
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id <> ?
       AND NOT EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.following_id = u.id)
     ORDER BY u.created_at DESC
     LIMIT 8`,
    [viewerId, viewerId]
  );

  return [...interestUsers, ...fallback]
    .filter((row, index, rows) => rows.findIndex((item) => item.id === row.id) === index)
    .slice(0, 8)
    .map((row) => mapUser(row));
}

export async function getOnboardingSummary(viewerId: string): Promise<OnboardingSummary> {
  const [viewer, interestsRow, followingRow, publishedRow] = await Promise.all([
    getUserById(viewerId),
    get<{ count: number }>(`SELECT COUNT(*) AS count FROM user_interests WHERE user_id = ?`, [viewerId]),
    get<{ count: number }>(`SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?`, [viewerId]),
    get<{ count: number }>(
      `SELECT COUNT(*) AS count FROM posts WHERE user_id = ? AND deleted_at IS NULL AND status = 'published'`,
      [viewerId]
    )
  ]);

  const hasAvatar = Boolean(viewer?.avatarUrl);
  const hasBio = Boolean(viewer?.bio?.trim() && viewer.bio.trim().length >= 16);
  const hasLocationOrWebsite = Boolean(viewer?.location?.trim() || viewer?.website?.trim());
  const profileScore = [hasAvatar, hasBio, hasLocationOrWebsite].filter(Boolean).length;

  return {
    profileScore,
    hasAvatar,
    hasBio,
    hasLocationOrWebsite,
    interestCount: interestsRow?.count ?? 0,
    followingCount: followingRow?.count ?? 0,
    publishedPostCount: publishedRow?.count ?? 0
  };
}

export async function getTrendingTags() {
  return await all<{ tag: string; count: number }>(
    `SELECT tag, COUNT(*) AS count
     FROM post_tags
     GROUP BY tag
     ORDER BY count DESC, tag ASC
     LIMIT 12`
  );
}

export async function toggleBlockUser(targetUserId: string, viewerId: string) {
  const existing = await get<{ blocker_id: string }>(
    `SELECT blocker_id FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?`,
    [viewerId, targetUserId]
  );
  if (existing) {
    await run(`DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?`, [viewerId, targetUserId]);
    return { blocked: false };
  }
  await run(`INSERT INTO user_blocks (blocker_id, blocked_id) VALUES (?, ?)`, [viewerId, targetUserId]);
  return { blocked: true };
}

export async function toggleMuteUser(targetUserId: string, viewerId: string) {
  const existing = await get<{ muter_id: string }>(
    `SELECT muter_id FROM user_mutes WHERE muter_id = ? AND muted_id = ?`,
    [viewerId, targetUserId]
  );
  if (existing) {
    await run(`DELETE FROM user_mutes WHERE muter_id = ? AND muted_id = ?`, [viewerId, targetUserId]);
    return { muted: false };
  }
  await run(`INSERT INTO user_mutes (muter_id, muted_id) VALUES (?, ?)`, [viewerId, targetUserId]);
  return { muted: true };
}

export async function createReport(input: {
  reporterId: string;
  targetUserId?: string | null;
  targetPostId?: string | null;
  reason: string;
  details?: string | null;
}) {
  await run(
    `INSERT INTO reports (id, reporter_id, target_user_id, target_post_id, reason, details)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      input.reporterId,
      input.targetUserId ?? null,
      input.targetPostId ?? null,
      input.reason,
      input.details ?? null
    ]
  );
}

function extractHashtags(body: string) {
  return Array.from(
    new Set(
      [...body.matchAll(/(^|\s)#([a-z0-9_]{2,40})/gi)].map((match) => match[2].toLowerCase())
    )
  );
}

function extractMentions(body: string) {
  return Array.from(
    new Set(
      [...body.matchAll(/(^|\s)@([a-z0-9_]{3,24})/gi)].map((match) => match[2].toLowerCase())
    )
  );
}

function buildLinkPreview(body: string) {
  const match = body.match(/https?:\/\/[^\s]+/i);
  if (!match) {
    return null;
  }
  const url = match[0];
  try {
    const parsed = new URL(url);
    return {
      url,
      title: parsed.hostname.replace(/^www\./, ""),
      description: `Shared link from ${parsed.hostname.replace(/^www\./, "")}`,
      domain: parsed.hostname.replace(/^www\./, "")
    };
  } catch {
    return null;
  }
}
