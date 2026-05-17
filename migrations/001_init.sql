CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- statement-break

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('member', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
-- statement-break

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  name text NOT NULL,
  password_hash text NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement-break

CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_uniq
  ON users (lower(username));
-- statement-break

CREATE TABLE IF NOT EXISTS media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_file_id text NOT NULL UNIQUE,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  category text NOT NULL,
  description text,
  drive_view_link text,
  uploader_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- statement-break

CREATE INDEX IF NOT EXISTS media_items_created_at_idx
  ON media_items (created_at DESC);
-- statement-break

CREATE INDEX IF NOT EXISTS media_items_category_idx
  ON media_items (category);
-- statement-break

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- statement-break

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
-- statement-break

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
