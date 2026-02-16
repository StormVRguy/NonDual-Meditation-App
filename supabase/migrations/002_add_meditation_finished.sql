-- Add meditation_finished to daily_logs (true when user has played 90% of the meditation)
ALTER TABLE daily_logs
ADD COLUMN IF NOT EXISTS meditation_finished BOOLEAN DEFAULT FALSE;
