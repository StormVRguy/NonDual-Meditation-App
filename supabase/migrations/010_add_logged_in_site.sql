-- TRUE if the user successfully logged in via the website that calendar day
-- (row is keyed by user_id + date; personal_code identifies the user in users table)
-- Set by auth-login Edge Function on successful authentication.

ALTER TABLE daily_logs
ADD COLUMN IF NOT EXISTS logged_in_site BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_daily_logs_logged_in_site ON daily_logs(logged_in_site);
