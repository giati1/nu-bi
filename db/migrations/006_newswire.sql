CREATE TABLE IF NOT EXISTS news_items (
  id TEXT PRIMARY KEY,
  source_label TEXT NOT NULL,
  topic TEXT NOT NULL,
  article_url TEXT NOT NULL UNIQUE,
  headline TEXT NOT NULL,
  summary TEXT,
  published_at TEXT,
  post_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS news_sync_runs (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  item_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_news_items_topic_published_at
  ON news_items(topic, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_sync_runs_started_at
  ON news_sync_runs(started_at DESC);
