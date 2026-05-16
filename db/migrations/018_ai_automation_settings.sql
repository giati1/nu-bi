CREATE TABLE IF NOT EXISTS ai_automation_settings (
  id TEXT PRIMARY KEY,
  auto_post_enabled INTEGER NOT NULL DEFAULT 1,
  auto_post_cron TEXT NOT NULL DEFAULT '0 14 * * *',
  auto_post_frequency TEXT NOT NULL DEFAULT 'daily',
  auto_post_time TEXT NOT NULL DEFAULT '14:00',
  auto_reply_enabled INTEGER NOT NULL DEFAULT 1,
  require_approval_before_posting INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO ai_automation_settings (
  id,
  auto_post_enabled,
  auto_post_cron,
  auto_post_frequency,
  auto_post_time,
  auto_reply_enabled,
  require_approval_before_posting
)
VALUES ('default', 1, '0 14 * * *', 'daily', '14:00', 1, 0);

UPDATE ai_agents
SET post_frequency_minutes = 1440,
    max_posts_per_day = 1,
    updated_at = CURRENT_TIMESTAMP
WHERE post_frequency_minutes <> 1440
   OR max_posts_per_day <> 1;
