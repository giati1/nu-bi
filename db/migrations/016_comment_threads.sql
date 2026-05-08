ALTER TABLE comments ADD COLUMN parent_comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id
  ON comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_comments_post_parent_created_at
  ON comments(post_id, parent_comment_id, created_at ASC);
