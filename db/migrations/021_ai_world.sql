CREATE TABLE IF NOT EXISTS ai_world_snapshot (
  id TEXT PRIMARY KEY CHECK (id = 'public'),
  payload TEXT NOT NULL,
  published_at TEXT NOT NULL
);
