CREATE TABLE IF NOT EXISTS ai_chat_personas (
  id TEXT PRIMARY KEY,
  linked_user_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  avatar_url TEXT,
  system_prompt TEXT NOT NULL,
  personality TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (linked_user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE conversations ADD COLUMN type TEXT NOT NULL DEFAULT 'user_to_user';
ALTER TABLE conversations ADD COLUMN title TEXT;
ALTER TABLE conversations ADD COLUMN ai_persona_id TEXT REFERENCES ai_chat_personas(id) ON DELETE SET NULL;

ALTER TABLE messages ADD COLUMN sender_type TEXT NOT NULL DEFAULT 'user';
ALTER TABLE messages ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE messages ADD COLUMN persona_id TEXT REFERENCES ai_chat_personas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_type_updated_at
  ON conversations(type, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_ai_persona_id
  ON conversations(ai_persona_id);

CREATE INDEX IF NOT EXISTS idx_messages_persona_id_created_at
  ON messages(persona_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_ai_chat_personas_type
  ON ai_chat_personas(type, created_at DESC);
