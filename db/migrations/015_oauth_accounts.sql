CREATE TABLE IF NOT EXISTS oauth_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  provider_email TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_accounts_provider_account
  ON oauth_accounts(provider, provider_account_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_accounts_user_provider
  ON oauth_accounts(user_id, provider);

CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider_email
  ON oauth_accounts(provider_email);
