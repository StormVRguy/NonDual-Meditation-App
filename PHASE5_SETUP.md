# Phase 5: Email Reminder System - Setup Guide

This guide walks you through setting up the automated email reminder system using Supabase pg_cron and Resend.

## Overview

Phase 5 implements:
1. **send-reminders Edge Function**: Queries users who haven't completed both meditation and questionnaire for today, sends reminder emails via Resend API
2. **Scheduled cron job**: Runs daily at 8 PM UTC (configurable) to trigger the reminder function
3. **Email tracking**: Updates `daily_logs` with `reminder_sent_at` to prevent duplicate emails

## Prerequisites

1. **Resend account**: Sign up at https://resend.com (free tier: 100 emails/day)
2. **Supabase project**: Already set up from previous phases
3. **Verified domain** (optional but recommended): For better email deliverability

## Step 1: Set Up Resend

1. Go to https://resend.com and create an account
2. Navigate to **API Keys** and create a new API key
3. Copy the API key (starts with `re_`)
4. **Optional**: Verify your sending domain in Resend dashboard for better deliverability
   - Go to **Domains** > **Add Domain**
   - Follow DNS setup instructions
   - Update the `from` field in `send-reminders/index.ts` with your verified domain

## Step 2: Configure Edge Function Secrets

Add the required secrets to your Supabase Edge Functions:

```bash
# Using Supabase CLI (recommended)
supabase secrets set RESEND_API_KEY=re_your_actual_api_key_here
supabase secrets set FRONTEND_URL=https://your-domain.com

# Optional: Set timezone (defaults to America/New_York)
supabase secrets set APP_TIMEZONE=America/New_York
```

**Or via Supabase Dashboard:**
1. Go to **Project Settings** > **Edge Functions** > **Secrets**
2. Add:
   - `RESEND_API_KEY`: Your Resend API key
   - `FRONTEND_URL`: Your frontend dashboard URL (e.g., `https://your-app.vercel.app`)
   - `APP_TIMEZONE`: (Optional) Timezone for "today" logic (default: `America/New_York`)

## Step 3: Deploy the Edge Function

Deploy the `send-reminders` Edge Function:

```bash
supabase functions deploy send-reminders
```

Or use the Supabase Dashboard:
1. Go to **Edge Functions** > **Deploy**
2. Upload or sync the `supabase/functions/send-reminders` directory

## Step 4: Enable PostgreSQL Extensions

Run the migration to enable `pg_cron` and `pg_net`:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase Dashboard > SQL Editor
# Run: supabase/migrations/003_enable_pg_cron.sql
```

**Note**: In Supabase, `pg_cron` may already be enabled. Check in **Database** > **Extensions** to verify.

## Step 5: Schedule the Cron Job

### Option A: Using SQL Editor (Recommended)

1. Go to **Supabase Dashboard** > **SQL Editor**
2. Get your project URL and service role key:
   - **Project URL**: Settings > API > Project URL
   - **Service Role Key**: Settings > API > `service_role` key (keep secret!)
3. Run the following SQL, replacing placeholders:

```sql
-- Remove existing job if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-daily-reminders') THEN
    PERFORM cron.unschedule('send-daily-reminders');
  END IF;
END $$;

-- Schedule the job (daily at 20:00 UTC = 8 PM UTC)
SELECT cron.schedule(
  'send-daily-reminders',
  '0 20 * * *',  -- Cron: minute hour day month weekday (daily at 8 PM UTC)
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
```

**Replace:**
- `YOUR_SUPABASE_URL`: Your Supabase project URL (e.g., `https://abc123.supabase.co`)
- `YOUR_SERVICE_ROLE_KEY`: Your service role key from Settings > API

### Option B: Using Migration File

Edit `supabase/migrations/004_schedule_reminder_job.sql` with your actual values, then run:

```bash
supabase db push
```

### Adjusting the Schedule

To change when reminders are sent, modify the cron expression:

- `'0 20 * * *'` = Daily at 8 PM UTC
- `'0 14 * * *'` = Daily at 2 PM UTC
- `'0 20 * * 1-5'` = Weekdays only at 8 PM UTC

**Cron format**: `minute hour day-of-month month day-of-week`
- Minutes: 0-59
- Hours: 0-23 (UTC)
- Day of month: 1-31 or *
- Month: 1-12 or *
- Day of week: 0-7 (0 or 7 = Sunday) or *

## Step 6: Test the Setup

### Test the Edge Function Manually

```bash
# Using curl
curl -X POST \
  'https://YOUR_SUPABASE_URL/functions/v1/send-reminders' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Or use the Supabase Dashboard:
1. Go to **Edge Functions** > **send-reminders** > **Invoke**
2. Set Authorization header: `Bearer YOUR_SERVICE_ROLE_KEY`
3. Click **Invoke**

### Test the Cron Job Manually

```sql
-- Run the job immediately (for testing)
SELECT cron.run_job(jobid) 
FROM cron.job 
WHERE jobname = 'send-daily-reminders';
```

### Verify Job Status

```sql
-- Check if job is scheduled
SELECT jobid, jobname, schedule, command 
FROM cron.job 
WHERE jobname = 'send-daily-reminders';

-- Check job run history
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-daily-reminders')
ORDER BY start_time DESC 
LIMIT 10;
```

## Step 7: Monitor and Troubleshoot

### Check Edge Function Logs

1. Go to **Supabase Dashboard** > **Edge Functions** > **send-reminders** > **Logs**
2. Look for errors or successful execution

### Check Email Delivery

1. Check Resend dashboard: https://resend.com/emails
2. Verify emails are being sent and delivered

### Common Issues

**Issue**: Cron job not running
- **Solution**: Verify `pg_cron` extension is enabled in Database > Extensions
- Check job exists: `SELECT * FROM cron.job WHERE jobname = 'send-daily-reminders';`

**Issue**: "RESEND_API_KEY not set" error
- **Solution**: Ensure secret is set: `supabase secrets list` or check Dashboard > Edge Functions > Secrets

**Issue**: "Unauthorized" error when cron calls Edge Function
- **Solution**: Verify service role key in cron job SQL matches your actual service role key

**Issue**: No emails being sent
- **Solution**: 
  - Check Resend API key is valid
  - Verify domain is verified in Resend (if using custom domain)
  - Check Edge Function logs for errors
  - Ensure users exist and need reminders (check `daily_logs` table)

**Issue**: Duplicate emails
- **Solution**: Verify `reminder_sent_at` is being set correctly in `daily_logs`

## Email Template Customization

To customize the email template, edit `supabase/functions/send-reminders/index.ts`:

- **Subject line**: Modify the `subject` field
- **HTML content**: Modify the `html` field
- **From address**: Update `from` field (use verified domain for best deliverability)

## Unschedule the Job

To stop sending reminders:

```sql
SELECT cron.unschedule('send-daily-reminders');
```

## Security Notes

- **Service Role Key**: Keep secret! Never expose in frontend code
- **Resend API Key**: Store only in Supabase Edge Function secrets
- **Authorization**: The cron job uses service role key to authenticate with Edge Function
- **Rate Limiting**: Resend free tier is 100 emails/day - monitor usage

## Next Steps

After Phase 5 is set up:
- Monitor email delivery rates
- Adjust reminder time if needed
- Consider adding unsubscribe functionality if required by law
- Set up email analytics in Resend dashboard
