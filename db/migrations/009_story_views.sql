CREATE TABLE IF NOT EXISTS story_views (
  story_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (story_id, user_id),
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_story_views_user_seen_at
  ON story_views(user_id, seen_at DESC);
