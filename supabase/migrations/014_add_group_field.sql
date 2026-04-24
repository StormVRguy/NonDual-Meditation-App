-- Add "group" (TEXT, nullable) to users.
-- NULL means no group assigned (admin users, or unassigned participants).
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "group" TEXT;

-- -------------------------------------------------------
-- meditation_files: add "group", fix UNIQUE constraint
-- -------------------------------------------------------
ALTER TABLE meditation_files
ADD COLUMN IF NOT EXISTS "group" TEXT NOT NULL DEFAULT '';

-- The implicit constraint created by "date DATE UNIQUE NOT NULL" in the original migration
-- is named meditation_files_date_key by PostgreSQL naming convention.
ALTER TABLE meditation_files
DROP CONSTRAINT IF EXISTS meditation_files_date_key;

ALTER TABLE meditation_files
ADD CONSTRAINT meditation_files_date_group_key UNIQUE (date, "group");

CREATE INDEX IF NOT EXISTS idx_meditation_files_group ON meditation_files ("group");

-- -------------------------------------------------------
-- lecture_files: same treatment
-- -------------------------------------------------------
ALTER TABLE lecture_files
ADD COLUMN IF NOT EXISTS "group" TEXT NOT NULL DEFAULT '';

ALTER TABLE lecture_files
DROP CONSTRAINT IF EXISTS lecture_files_date_key;

ALTER TABLE lecture_files
ADD CONSTRAINT lecture_files_date_group_key UNIQUE (date, "group");

CREATE INDEX IF NOT EXISTS idx_lecture_files_group ON lecture_files ("group");

-- -------------------------------------------------------
-- questionnaire_windows: add "group"
-- -------------------------------------------------------
ALTER TABLE questionnaire_windows
ADD COLUMN IF NOT EXISTS "group" TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_questionnaire_windows_group_enabled_starts_ends
ON questionnaire_windows ("group", enabled, starts_at, ends_at);
