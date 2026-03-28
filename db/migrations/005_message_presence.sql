CREATE TABLE IF NOT EXISTS conversation_typing_states (
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  is_typing INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (conversation_id, user_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conversation_typing_states_updated_at
  ON conversation_typing_states(conversation_id, updated_at DESC);
