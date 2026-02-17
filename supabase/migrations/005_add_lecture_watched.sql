-- Add lecture_watched column to daily_logs table
-- This tracks whether the user has watched at least 50% of the latest video lecture

ALTER TABLE daily_logs
ADD COLUMN IF NOT EXISTS lecture_watched BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_lecture_watched ON daily_logs(lecture_watched);
