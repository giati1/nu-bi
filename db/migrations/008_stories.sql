CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  destination_path TEXT,
  destination_label TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stories_user_id_created_at
  ON stories(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stories_status_expires_at
  ON stories(status, expires_at);
