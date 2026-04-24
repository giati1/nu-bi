CREATE TABLE IF NOT EXISTS comment_media (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comment_media_comment_id
  ON comment_media(comment_id, created_at ASC);
