-- Enable pg_cron and pg_net extensions for scheduled jobs
-- These extensions allow us to schedule cron jobs that call Edge Functions

-- Enable pg_net extension (required for making HTTP requests from pg_cron)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Enable pg_cron extension (for scheduling jobs)
-- Note: This may require superuser privileges. In Supabase, check if it's already enabled
-- in Dashboard > Database > Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Verify extensions are enabled
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('pg_cron', 'pg_net');
