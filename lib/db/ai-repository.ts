import crypto from "crypto";
import { all, get, run } from "@/lib/db/client";
import type {
  AIAgentContentMode,
  AIAgentRecord,
  AIContentAssetRecord,
  AIContentJobRecord,
  AIReviewPostRecord,
  AIAgentRunLogRecord,
  AIPostAnalyticsRecord
} from "@/types/domain";

type AIAgentRow = {
  id: string;
  linked_user_id: string;
  slug: string;
  display_name: string;
  handle: string;
  category: string;
  persona_prompt: string;
  description: string | null;
  avatar_url: string | null;
  avatar_seed: string | null;
  content_modes: string;
  post_frequency_minutes: number;
  max_posts_per_day: number;
  enabled: number;
  internal_only_notes: string | null;
  last_run_at: string | null;
  last_posted_at: string | null;
  created_at: string;
  updated_at: string;
};

type AIContentJobRow = {
  id: string;
  agent_id: string;
  job_type: string;
  topic_seed: string;
  prompt_used: string | null;
  status: "queued" | "generating" | "ready" | "published" | "failed";
  output_text: string | null;
  output_title: string | null;
  output_excerpt: string | null;
  output_image_url: string | null;
  output_video_prompt: string | null;
  moderation_notes: string | null;
  error_message: string | null;
  published_post_id: string | null;
  created_at: string;
  updated_at: string;
};

type AIAgentRunLogRow = {
  id: string;
  agent_id: string;
  run_type: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "completed" | "failed" | "skipped";
  summary: string | null;
  error_message: string | null;
};

type AIContentAssetRow = {
  id: string;
  job_id: string;
  asset_type: string;
  storage_key: string;
  public_url: string;
  mime_type: string | null;
  metadata_json: string | null;
  created_at: string;
};

type AIPostAnalyticsRow = {
  id: string;
  agent_id: string;
  post_id: string;
  impressions: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  engagement_score: number;
  created_at: string;
};

type AIReviewPostRow = {
  id: string;
  body: string;
  status: "published" | "draft" | "scheduled";
  created_at: string;
  ai_topic_seed: string | null;
  ai_generation_mode: string | null;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

export type AIAgentPublishingSnapshot = {
  postsToday: number;
  totalPublishedPosts: number;
  recentTopics: string[];
  recentBodies: string[];
  lastPostedAt: string | null;
};

function mapAgent(row: AIAgentRow): AIAgentRecord {
  return {
    id: row.id,
    linkedUserId: row.linked_user_id,
    slug: row.slug,
    displayName: row.display_name,
    handle: row.handle,
    category: row.category,
    personaPrompt: row.persona_prompt,
    description: row.description,
    avatarUrl: row.avatar_url,
    avatarSeed: row.avatar_seed,
    contentModes: parseContentModes(row.content_modes),
    postFrequencyMinutes: row.post_frequency_minutes,
    maxPostsPerDay: row.max_posts_per_day,
    enabled: Boolean(row.enabled),
    internalOnlyNotes: row.internal_only_notes,
    lastRunAt: row.last_run_at,
    lastPostedAt: row.last_posted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapJob(row: AIContentJobRow): AIContentJobRecord {
  return {
    id: row.id,
    agentId: row.agent_id,
    jobType: row.job_type as AIAgentContentMode,
    topicSeed: row.topic_seed,
    promptUsed: row.prompt_used,
    status: row.status,
    outputText: row.output_text,
    outputTitle: row.output_title,
    outputExcerpt: row.output_excerpt,
    outputImageUrl: row.output_image_url,
    outputVideoPrompt: row.output_video_prompt,
    moderationNotes: row.moderation_notes,
    errorMessage: row.error_message,
    publishedPostId: row.published_post_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapRunLog(row: AIAgentRunLogRow): AIAgentRunLogRecord {
  return {
    id: row.id,
    agentId: row.agent_id,
    runType: row.run_type,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    status: row.status,
    summary: row.summary,
    errorMessage: row.error_message
  };
}

function mapAsset(row: AIContentAssetRow): AIContentAssetRecord {
  return {
    id: row.id,
    jobId: row.job_id,
    assetType: row.asset_type,
    storageKey: row.storage_key,
    publicUrl: row.public_url,
    mimeType: row.mime_type,
    metadataJson: row.metadata_json,
    createdAt: row.created_at
  };
}

function mapAnalytics(row: AIPostAnalyticsRow): AIPostAnalyticsRecord {
  return {
    id: row.id,
    agentId: row.agent_id,
    postId: row.post_id,
    impressions: row.impressions,
    likes: row.likes,
    comments: row.comments,
    saves: row.saves,
    shares: row.shares,
    engagementScore: row.engagement_score,
    createdAt: row.created_at
  };
}

function mapReviewPost(row: AIReviewPostRow): AIReviewPostRecord {
  return {
    id: row.id,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
    topicSeed: row.ai_topic_seed,
    generationMode: row.ai_generation_mode,
    author: {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url
    }
  };
}

export async function listAIAgents() {
  const rows = await all<AIAgentRow>(`SELECT * FROM ai_agents ORDER BY enabled DESC, category ASC, display_name ASC`);
  return rows.map(mapAgent);
}

export async function getAIAgentById(id: string) {
  const row = await get<AIAgentRow>(`SELECT * FROM ai_agents WHERE id = ?`, [id]);
  return row ? mapAgent(row) : null;
}

export async function getAIAgentBySlug(slug: string) {
  const row = await get<AIAgentRow>(`SELECT * FROM ai_agents WHERE slug = ?`, [slug]);
  return row ? mapAgent(row) : null;
}

export async function upsertAIAgent(input: {
  linkedUserId: string;
  slug: string;
  displayName: string;
  handle: string;
  category: string;
  personaPrompt: string;
  description?: string | null;
  avatarUrl?: string | null;
  avatarSeed?: string | null;
  contentModes: AIAgentContentMode[];
  postFrequencyMinutes: number;
  maxPostsPerDay: number;
  enabled?: boolean;
  internalOnlyNotes?: string | null;
}) {
  const existing = await getAIAgentBySlug(input.slug);
  const id = existing?.id ?? crypto.randomUUID();
  await run(
    `INSERT INTO ai_agents (
       id, linked_user_id, slug, display_name, handle, category, persona_prompt, description, avatar_url, avatar_seed,
       content_modes, post_frequency_minutes, max_posts_per_day, enabled, internal_only_notes
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET
       linked_user_id = excluded.linked_user_id,
       display_name = excluded.display_name,
       handle = excluded.handle,
       category = excluded.category,
       persona_prompt = excluded.persona_prompt,
       description = excluded.description,
       avatar_url = excluded.avatar_url,
       avatar_seed = excluded.avatar_seed,
       content_modes = excluded.content_modes,
       post_frequency_minutes = excluded.post_frequency_minutes,
       max_posts_per_day = excluded.max_posts_per_day,
       enabled = excluded.enabled,
       internal_only_notes = excluded.internal_only_notes,
       updated_at = CURRENT_TIMESTAMP`,
    [
      id,
      input.linkedUserId,
      input.slug,
      input.displayName,
      input.handle,
      input.category,
      input.personaPrompt,
      input.description ?? null,
      input.avatarUrl ?? null,
      input.avatarSeed ?? null,
      JSON.stringify(input.contentModes),
      input.postFrequencyMinutes,
      input.maxPostsPerDay,
      Number(input.enabled ?? true),
      input.internalOnlyNotes ?? null
    ]
  );

  return await getAIAgentBySlug(input.slug);
}

export async function updateAIAgentSettings(
  agentId: string,
  input: { enabled?: boolean; postFrequencyMinutes?: number; maxPostsPerDay?: number }
) {
  const current = await getAIAgentById(agentId);
  if (!current) {
    return null;
  }

  await run(
    `UPDATE ai_agents
     SET enabled = ?, post_frequency_minutes = ?, max_posts_per_day = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      Number(input.enabled ?? current.enabled),
      input.postFrequencyMinutes ?? current.postFrequencyMinutes,
      input.maxPostsPerDay ?? current.maxPostsPerDay,
      agentId
    ]
  );

  return await getAIAgentById(agentId);
}

export async function touchAIAgentRun(agentId: string, input: { lastRunAt?: string | null; lastPostedAt?: string | null }) {
  const current = await getAIAgentById(agentId);
  if (!current) {
    return;
  }

  await run(
    `UPDATE ai_agents
     SET last_run_at = ?, last_posted_at = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [input.lastRunAt ?? current.lastRunAt, input.lastPostedAt ?? current.lastPostedAt, agentId]
  );
}

export async function createAIContentJob(input: { agentId: string; jobType: AIAgentContentMode; topicSeed: string; promptUsed?: string | null }) {
  const id = crypto.randomUUID();
  await run(
    `INSERT INTO ai_content_jobs (id, agent_id, job_type, topic_seed, prompt_used, status)
     VALUES (?, ?, ?, ?, ?, 'queued')`,
    [id, input.agentId, input.jobType, input.topicSeed.trim(), input.promptUsed ?? null]
  );
  const row = await get<AIContentJobRow>(`SELECT * FROM ai_content_jobs WHERE id = ?`, [id]);
  return row ? mapJob(row) : null;
}

export async function updateAIContentJob(
  jobId: string,
  input: {
    status: AIContentJobRecord["status"];
    outputText?: string | null;
    outputTitle?: string | null;
    outputExcerpt?: string | null;
    outputImageUrl?: string | null;
    outputVideoPrompt?: string | null;
    moderationNotes?: string | null;
    errorMessage?: string | null;
    publishedPostId?: string | null;
  }
) {
  const current = await get<AIContentJobRow>(`SELECT * FROM ai_content_jobs WHERE id = ?`, [jobId]);
  if (!current) {
    return null;
  }

  await run(
    `UPDATE ai_content_jobs
     SET status = ?, output_text = ?, output_title = ?, output_excerpt = ?, output_image_url = ?, output_video_prompt = ?,
         moderation_notes = ?, error_message = ?, published_post_id = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      input.status,
      input.outputText ?? current.output_text,
      input.outputTitle ?? current.output_title,
      input.outputExcerpt ?? current.output_excerpt,
      input.outputImageUrl ?? current.output_image_url,
      input.outputVideoPrompt ?? current.output_video_prompt,
      input.moderationNotes ?? current.moderation_notes,
      input.errorMessage ?? current.error_message,
      input.publishedPostId ?? current.published_post_id,
      jobId
    ]
  );

  const row = await get<AIContentJobRow>(`SELECT * FROM ai_content_jobs WHERE id = ?`, [jobId]);
  return row ? mapJob(row) : null;
}

export async function attachAIContentAsset(input: {
  jobId: string;
  assetType: string;
  storageKey: string;
  publicUrl: string;
  mimeType?: string | null;
  metadataJson?: string | null;
}) {
  const id = crypto.randomUUID();
  await run(
    `INSERT INTO ai_content_assets (id, job_id, asset_type, storage_key, public_url, mime_type, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.jobId, input.assetType, input.storageKey, input.publicUrl, input.mimeType ?? null, input.metadataJson ?? null]
  );
  const row = await get<AIContentAssetRow>(`SELECT * FROM ai_content_assets WHERE id = ?`, [id]);
  return row ? mapAsset(row) : null;
}

export async function createAIAgentRunLog(input: { agentId: string; runType: string; status?: AIAgentRunLogRecord["status"]; summary?: string | null }) {
  const id = crypto.randomUUID();
  await run(
    `INSERT INTO ai_agent_run_logs (id, agent_id, run_type, status, summary)
     VALUES (?, ?, ?, ?, ?)`,
    [id, input.agentId, input.runType, input.status ?? "running", input.summary ?? null]
  );
  const row = await get<AIAgentRunLogRow>(`SELECT * FROM ai_agent_run_logs WHERE id = ?`, [id]);
  return row ? mapRunLog(row) : null;
}

export async function finishAIAgentRunLog(
  runLogId: string,
  input: { status: AIAgentRunLogRecord["status"]; summary?: string | null; errorMessage?: string | null }
) {
  await run(
    `UPDATE ai_agent_run_logs
     SET status = ?, summary = ?, error_message = ?, finished_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [input.status, input.summary ?? null, input.errorMessage ?? null, runLogId]
  );
}

export async function listRecentAIContentJobs(limit = 24) {
  const rows = await all<AIContentJobRow>(
    `SELECT * FROM ai_content_jobs ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
  return rows.map(mapJob);
}

export async function listFailedAIContentJobs(limit = 12) {
  const rows = await all<AIContentJobRow>(
    `SELECT * FROM ai_content_jobs WHERE status = 'failed' ORDER BY updated_at DESC LIMIT ?`,
    [limit]
  );
  return rows.map(mapJob);
}

export async function listRecentAIAgentRunLogs(limit = 24) {
  const rows = await all<AIAgentRunLogRow>(
    `SELECT * FROM ai_agent_run_logs ORDER BY started_at DESC LIMIT ?`,
    [limit]
  );
  return rows.map(mapRunLog);
}

export async function listRecentAIReviewPosts(limit = 16) {
  const rows = await all<AIReviewPostRow>(
    `SELECT
       p.id,
       p.body,
       p.status,
       p.created_at,
       p.ai_topic_seed,
       p.ai_generation_mode,
       u.id AS user_id,
       u.username,
       u.display_name,
       u.avatar_url
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.ai_agent_id IS NOT NULL
       AND p.deleted_at IS NULL
     ORDER BY CASE WHEN p.status = 'draft' THEN 0 ELSE 1 END, p.created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows.map(mapReviewPost);
}

export async function listAIContentAssetsForJob(jobId: string) {
  const rows = await all<AIContentAssetRow>(`SELECT * FROM ai_content_assets WHERE job_id = ? ORDER BY created_at ASC`, [jobId]);
  return rows.map(mapAsset);
}

export async function recordAIPostAnalytics(input: {
  agentId: string;
  postId: string;
  impressions?: number;
  likes?: number;
  comments?: number;
  saves?: number;
  shares?: number;
  engagementScore?: number;
}) {
  const id = crypto.randomUUID();
  await run(
    `INSERT INTO ai_post_analytics (id, agent_id, post_id, impressions, likes, comments, saves, shares, engagement_score)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.agentId,
      input.postId,
      input.impressions ?? 0,
      input.likes ?? 0,
      input.comments ?? 0,
      input.saves ?? 0,
      input.shares ?? 0,
      input.engagementScore ?? 0
    ]
  );
  const row = await get<AIPostAnalyticsRow>(`SELECT * FROM ai_post_analytics WHERE id = ?`, [id]);
  return row ? mapAnalytics(row) : null;
}

export async function getAIAgentPublishingSnapshot(agentId: string): Promise<AIAgentPublishingSnapshot> {
  const [dailyRow, totalRow, topicRows, bodyRows, agent] = await Promise.all([
    get<{ count: number }>(
      `SELECT COUNT(*) AS count
       FROM posts
       WHERE ai_agent_id = ?
         AND deleted_at IS NULL
         AND date(created_at) = date('now')`,
      [agentId]
    ),
    get<{ count: number }>(
      `SELECT COUNT(*) AS count
       FROM posts
       WHERE ai_agent_id = ?
         AND deleted_at IS NULL`,
      [agentId]
    ),
    all<{ ai_topic_seed: string | null }>(
      `SELECT ai_topic_seed
       FROM posts
       WHERE ai_agent_id = ?
         AND deleted_at IS NULL
         AND ai_topic_seed IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 12`,
      [agentId]
    ),
    all<{ body: string }>(
      `SELECT body
       FROM posts
       WHERE ai_agent_id = ?
         AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 8`,
      [agentId]
    ),
    getAIAgentById(agentId)
  ]);

  return {
    postsToday: dailyRow?.count ?? 0,
    totalPublishedPosts: totalRow?.count ?? 0,
    recentTopics: topicRows.map((row) => row.ai_topic_seed ?? "").filter(Boolean),
    recentBodies: bodyRows.map((row) => row.body),
    lastPostedAt: agent?.lastPostedAt ?? null
  };
}

function parseContentModes(value: string): AIAgentContentMode[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed.filter((item): item is AIAgentContentMode => typeof item === "string") as AIAgentContentMode[]) : ["text"];
  } catch {
    return ["text"];
  }
}
