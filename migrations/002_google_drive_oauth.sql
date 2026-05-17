CREATE TABLE IF NOT EXISTS integration_tokens (
  provider text PRIMARY KEY,
  refresh_token text NOT NULL,
  scope text,
  account_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement-break

DROP TRIGGER IF EXISTS integration_tokens_set_updated_at ON integration_tokens;
-- statement-break

CREATE TRIGGER integration_tokens_set_updated_at
  BEFORE UPDATE ON integration_tokens
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
