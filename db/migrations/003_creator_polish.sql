ALTER TABLE posts ADD COLUMN status TEXT NOT NULL DEFAULT 'published';
ALTER TABLE posts ADD COLUMN scheduled_for TEXT;

CREATE INDEX IF NOT EXISTS idx_posts_status_created_at ON posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status_scheduled_for ON posts(status, scheduled_for ASC);
