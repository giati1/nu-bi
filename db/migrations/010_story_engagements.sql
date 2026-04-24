CREATE TABLE IF NOT EXISTS story_engagements (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  emoji TEXT,
  body TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_story_engagements_story_created_at
  ON story_engagements(story_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_story_engagements_user_created_at
  ON story_engagements(user_id, created_at DESC);
