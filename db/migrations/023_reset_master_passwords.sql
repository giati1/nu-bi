UPDATE users
SET password_hash = '$2a$10$UElavQhfeEfBl5hU5rt6..w/nCIq15rRwPmYeEjg6URzrigEkP.HC',
    updated_at = CURRENT_TIMESTAMP
WHERE lower(email) IN ('master@nubi.com', 'cfjohn43@gmail.com')
   OR lower(username) IN ('nubi', 'giati');

INSERT OR IGNORE INTO users (id, email, username, password_hash, display_name)
VALUES (
  'f0e1d2c3-b4a5-4678-9012-3456789abcde',
  'master@nubi.com',
  'nubi',
  '$2a$10$UElavQhfeEfBl5hU5rt6..w/nCIq15rRwPmYeEjg6URzrigEkP.HC',
  'NUBI'
);

INSERT OR IGNORE INTO profiles (user_id, bio, website, location)
SELECT id, 'Official NUBI account for platform-wide announcements, launches, creator spotlights, and public updates.', 'https://nu-bi.com', 'Global'
FROM users
WHERE lower(username) = 'nubi';

INSERT OR IGNORE INTO users (id, email, username, password_hash, display_name)
VALUES (
  '159008bc-4b40-4ecc-ae61-d13af5dde5d2',
  'cfjohn43@gmail.com',
  'Giati',
  '$2a$10$UElavQhfeEfBl5hU5rt6..w/nCIq15rRwPmYeEjg6URzrigEkP.HC',
  'COMMANDER AND CHIEF'
);

INSERT OR IGNORE INTO profiles (user_id, bio)
SELECT id, ''
FROM users
WHERE lower(username) = 'giati';
