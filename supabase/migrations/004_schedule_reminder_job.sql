-- Schedule daily reminder job using pg_cron
-- This job runs daily at 20:00 (8 PM) in UTC and calls the send-reminders Edge Function
--
-- SETUP INSTRUCTIONS:
-- 1. Get your Supabase project URL and service role key from:
--    Dashboard > Settings > API > Project URL and service_role key
-- 2. Replace the placeholders below with your actual values
-- 3. Run this migration in Supabase SQL Editor

-- First, remove any existing job with the same name (if re-running this migration)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-daily-reminders') THEN
    PERFORM cron.unschedule('send-daily-reminders');
  END IF;
END $$;

-- Schedule the job to run daily at 20:00 UTC (8 PM)
-- Cron format: minute hour day-of-month month day-of-week
-- '0 20 * * *' means: at minute 0 of hour 20 (8 PM) every day
-- 
-- To change the time, modify the cron expression:
-- - '0 20 * * *' = 8 PM UTC daily
-- - '0 14 * * *' = 2 PM UTC daily (adjust for your timezone)
-- 
-- IMPORTANT: Replace these placeholders with actual values:
-- - YOUR_SUPABASE_URL: e.g., 'https://gbmgmqhlhgjsztwasumi.supabase.co'
-- - YOUR_SERVICE_ROLE_KEY: Your actual service role key (keep secret!)

-- Example with placeholders (replace before running):
/*
SELECT cron.schedule(
  'send-daily-reminders',                    -- Job name
  '0 20 * * *',                              -- Cron schedule: daily at 20:00 UTC (8 PM)
  $$
  SELECT
    net.http_post(
      url := 'YOUR_SUPABASE_URL/functions/v1/send-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
*/

-- Note: This migration file serves as a template.
-- You need to uncomment and fill in the actual values above, or use the Supabase Dashboard
-- to schedule the job manually via SQL Editor with your actual credentials.

-- To verify the job was scheduled:
-- SELECT jobid, jobname, schedule, command FROM cron.job WHERE jobname = 'send-daily-reminders';

-- To manually test the job:
-- SELECT cron.run_job(jobid) FROM cron.job WHERE jobname = 'send-daily-reminders';

-- To unschedule the job:
-- SELECT cron.unschedule('send-daily-reminders');
