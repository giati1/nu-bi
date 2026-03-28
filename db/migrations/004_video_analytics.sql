CREATE TABLE IF NOT EXISTS post_view_events (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  viewer_user_id TEXT,
  view_context TEXT NOT NULL DEFAULT 'feed',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (viewer_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_post_view_events_post_created_at
  ON post_view_events(post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_view_events_viewer_post
  ON post_view_events(viewer_user_id, post_id, created_at DESC);
