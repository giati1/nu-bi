CREATE TABLE IF NOT EXISTS ai_agents (
  id TEXT PRIMARY KEY,
  linked_user_id TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  handle TEXT NOT NULL,
  category TEXT NOT NULL,
  persona_prompt TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  avatar_seed TEXT,
  content_modes TEXT NOT NULL DEFAULT '["text"]',
  schedule_config TEXT,
  post_frequency_minutes INTEGER NOT NULL DEFAULT 360,
  max_posts_per_day INTEGER NOT NULL DEFAULT 3,
  enabled INTEGER NOT NULL DEFAULT 1,
  internal_only_notes TEXT,
  last_run_at TEXT,
  last_posted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (linked_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_content_jobs (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  job_type TEXT NOT NULL,
  topic_seed TEXT NOT NULL,
  prompt_used TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  output_text TEXT,
  output_title TEXT,
  output_excerpt TEXT,
  output_image_url TEXT,
  output_video_prompt TEXT,
  moderation_notes TEXT,
  error_message TEXT,
  published_post_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE CASCADE,
  FOREIGN KEY (published_post_id) REFERENCES posts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ai_content_assets (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  public_url TEXT NOT NULL,
  mime_type TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES ai_content_jobs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_agent_run_logs (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  run_type TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  summary TEXT,
  error_message TEXT,
  FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_post_analytics (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  engagement_score REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

ALTER TABLE posts ADD COLUMN ai_agent_id TEXT REFERENCES ai_agents(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN ai_content_job_id TEXT REFERENCES ai_content_jobs(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN ai_generation_mode TEXT;
ALTER TABLE posts ADD COLUMN ai_topic_seed TEXT;

CREATE INDEX IF NOT EXISTS idx_ai_agents_enabled_category ON ai_agents(enabled, category);
CREATE INDEX IF NOT EXISTS idx_ai_agents_linked_user_id ON ai_agents(linked_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_jobs_agent_id_created_at ON ai_content_jobs(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_content_jobs_status_created_at ON ai_content_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_content_assets_job_id ON ai_content_assets(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_run_logs_agent_id_started_at ON ai_agent_run_logs(agent_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_post_analytics_agent_id_created_at ON ai_post_analytics(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_ai_agent_id_created_at ON posts(ai_agent_id, created_at DESC);
