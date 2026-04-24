CREATE TABLE IF NOT EXISTS user_engagement_overrides (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  like_count INTEGER,
  view_count INTEGER,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS post_engagement_overrides (
  post_id TEXT PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  like_count INTEGER,
  view_count INTEGER,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
