ALTER TABLE conversation_members ADD COLUMN is_muted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE messages ADD COLUMN reply_to_message_id TEXT REFERENCES messages(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS message_media (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conversation_members_is_muted
  ON conversation_members(user_id, is_muted);

CREATE INDEX IF NOT EXISTS idx_messages_reply_to_message_id
  ON messages(reply_to_message_id);

CREATE INDEX IF NOT EXISTS idx_message_media_message_id
  ON message_media(message_id, created_at ASC);
