CREATE TABLE IF NOT EXISTS companion_profiles (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  personality TEXT NOT NULL,
  appearance TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_companion_profiles_owner
  ON companion_profiles(owner_user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS companion_messages (
  id TEXT PRIMARY KEY,
  companion_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (companion_id) REFERENCES companion_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_companion_messages_thread
  ON companion_messages(companion_id, owner_user_id, created_at DESC);
