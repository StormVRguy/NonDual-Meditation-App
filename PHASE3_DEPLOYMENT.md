# Phase 3 Deployment Guide

This guide will help you deploy the meditation player Edge Functions and test the dashboard.

## Step 1: Deploy Edge Functions

Deploy both new Edge Functions:

```bash
cd "c:\Users\andre\projects\NonDual Meditation App"
supabase functions deploy meditation-today
supabase functions deploy logs-meditation-start
```

## Step 2: Set Optional Timezone Secret (Optional)

By default, the app uses `America/New_York` timezone. To change it:

```bash
supabase secrets set APP_TIMEZONE=Europe/Rome
```

Or any other timezone from the [IANA Time Zone Database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).

## Step 3: Upload a Test Meditation File

Before testing, you need to upload a meditation audio file:

1. **Go to Supabase Dashboard** → **Storage** → **meditations** bucket
2. **Click "Upload file"**
3. **Upload an audio file** (e.g., `2025-02-16.mp3` for today's date)
4. **Copy the file URL** from the Storage interface

## Step 4: Add Meditation File to Database

Add a record in the `meditation_files` table:

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Run this SQL** (replace with today's date and your file URL):

```sql
INSERT INTO meditation_files (date, file_url)
VALUES ('2025-02-16', 'https://gbmgmqhlhgjsztwasumi.supabase.co/storage/v1/object/public/meditations/2025-02-16.mp3')
ON CONFLICT (date) DO NOTHING;
```

**Note**: Replace:
- `2025-02-16` with today's date in `YYYY-MM-DD` format
- The URL with your actual Storage file URL

## Step 5: Test the Dashboard

1. **Start your frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Login** with your test user credentials

3. **Test the meditation player**:
   - You should see "Today's Meditation" section
   - Click the play button (▶)
   - The audio should start playing
   - Check that "✓ Meditation session started" appears

4. **Test the questionnaire button**:
   - Click "Complete Questionnaire"
   - It should open the Qualtrics survey in a new tab
   - (Logging will be implemented in Phase 4)

## Step 6: Verify Logging

Check that meditation playback is being logged:

1. **Go to Supabase Dashboard** → **Table Editor** → **daily_logs**
2. **Look for a new entry** with:
   - Your user_id
   - Today's date
   - `meditation_played: true`
   - `meditation_started_at` timestamp

## Troubleshooting

### No meditation available
- Verify the meditation file exists in Storage
- Check that the date in `meditation_files` matches today's date (in your timezone)
- Check Edge Function logs for errors

### Audio won't play
- Verify the Storage bucket is public
- Check the file URL is correct and accessible
- Check browser console for CORS or loading errors

### Logging not working
- Check browser console for errors when clicking play
- Verify JWT token is being sent in Authorization header
- Check Edge Function logs for `logs-meditation-start`

### Timezone issues
- The app uses `America/New_York` by default
- Set `APP_TIMEZONE` secret if you need a different timezone
- Make sure dates in `meditation_files` match the timezone you're using

## Next Steps

Once Phase 3 is working:
- Proceed to **Phase 4**: Qualtrics integration (questionnaire logging)
- The meditation player and logging are now functional
