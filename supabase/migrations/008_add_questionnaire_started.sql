-- Add questionnaire_started boolean column to daily_logs table
-- This tracks whether the user has clicked the questionnaire button and opened the Qualtrics link

ALTER TABLE daily_logs
ADD COLUMN IF NOT EXISTS questionnaire_started BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_questionnaire_started ON daily_logs(questionnaire_started);
