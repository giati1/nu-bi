ALTER TABLE profiles ADD COLUMN is_private INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_is_private ON profiles(is_private);
