ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username text;
-- statement-break

UPDATE users
SET username = lower(btrim(username))
WHERE username IS NOT NULL;
-- statement-break

DO $$
DECLARE
  has_email boolean;
  rec record;
  base text;
  candidate text;
  suffix integer;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'email'
  ) INTO has_email;

  FOR rec IN
    EXECUTE CASE
      WHEN has_email THEN
        'SELECT id, email, name
         FROM users
         WHERE username IS NULL OR btrim(username) = ''''
         ORDER BY created_at ASC, id ASC'
      ELSE
        'SELECT id, NULL::text AS email, name
         FROM users
         WHERE username IS NULL OR btrim(username) = ''''
         ORDER BY created_at ASC, id ASC'
    END
  LOOP
    base := lower(
      regexp_replace(
        coalesce(
          nullif(split_part(rec.email, '@', 1), ''),
          nullif(rec.name, ''),
          'user'
        ),
        '[^a-z0-9._-]+',
        '',
        'g'
      )
    );

    IF base = '' THEN
      base := 'user';
    END IF;

    candidate := base;
    suffix := 1;

    WHILE EXISTS (
      SELECT 1
      FROM users
      WHERE lower(username) = lower(candidate)
        AND id <> rec.id
    ) LOOP
      suffix := suffix + 1;
      candidate := base || suffix::text;
    END LOOP;

    UPDATE users
    SET username = candidate
    WHERE id = rec.id;
  END LOOP;
END $$;
-- statement-break

CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_uniq
  ON users (lower(username));
-- statement-break

ALTER TABLE users
  ALTER COLUMN username SET NOT NULL;
