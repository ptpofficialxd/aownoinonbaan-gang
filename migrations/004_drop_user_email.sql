DROP INDEX IF EXISTS users_email_lower_uniq;
-- statement-break

ALTER TABLE users
  DROP COLUMN IF EXISTS email;
