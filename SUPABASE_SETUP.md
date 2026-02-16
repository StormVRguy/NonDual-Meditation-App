# Supabase Setup Instructions

Follow these steps to configure your Supabase project for the Meditation Training Website.

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click **"New Project"**
4. Fill in the project details:
   - **Name**: Meditation Training Website (or your preferred name)
   - **Database Password**: Choose a strong password (save this securely)
   - **Region**: Select the region closest to your users
   - **Pricing Plan**: Start with **Free** tier (upgrade to Pro later if needed)
5. Click **"Create new project"**
6. Wait for the project to be provisioned (takes 1-2 minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

3. Update your `frontend/.env` file (create it from `.env.example`):
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...your_anon_key_here
   VITE_QUALTRICS_SURVEY_URL=your_qualtrics_url_here
   ```

## Step 3: Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Open the file `supabase/migrations/001_initial.sql` from this project
4. Copy the entire contents of the SQL file
5. Paste it into the SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. Verify the tables were created:
   - Go to **Table Editor** → You should see: `users`, `daily_logs`, `meditation_files`

## Step 4: Set Up Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **"Create a new bucket"**
3. Configure the bucket:
   - **Name**: `meditations` (or `audio`)
   - **Public bucket**: ✅ **Enable** (check this box so audio files can be accessed)
   - **File size limit**: Set appropriate limit (e.g., 50 MB for audio files)
   - **Allowed MIME types**: `audio/mpeg`, `audio/mp3`, `audio/wav` (optional)
4. Click **"Create bucket"**

### Set Storage Policies (RLS)

1. Go to **Storage** → **Policies** tab
2. Click on the `meditations` bucket
3. Click **"New Policy"**
4. Create a policy for public read access:
   - **Policy name**: `Public read access`
   - **Allowed operation**: `SELECT`
   - **Policy definition**: 
     ```sql
     (bucket_id = 'meditations')
     ```
   - **Check expression**: Leave empty (or use `true`)
5. Click **"Review"** then **"Save policy"**

## Step 5: Enable Required Extensions

1. Go to **Database** → **Extensions**
2. Enable the following extensions:
   - ✅ **pg_cron** (for scheduled jobs)
   - ✅ **pg_net** (for HTTP requests from pg_cron)

## Step 6: Configure Edge Functions Secrets

1. Sign up for a Resend account at [https://resend.com](https://resend.com)
2. Verify your sending domain (or use Resend's test domain for development)
3. Get your Resend API key from the dashboard
4. In Supabase dashboard, go to **Project Settings** → **Edge Functions**
5. Scroll to **"Secrets"** section
6. Click **"Add a new secret"**
7. Add the following secret:
   - **Name**: `RESEND_API_KEY`
   - **Value**: Your Resend API key (starts with `re_...`)
8. Click **"Save"**

## Step 7: Deploy Edge Functions (Optional for Phase 1)

Edge Functions will be implemented in later phases. For now, you can skip this step.

When ready to deploy (Phase 2+), you'll need:
1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref your-project-ref`
4. Deploy functions: `supabase functions deploy <function-name>`

## Step 8: Seed Test Users (Optional)

To test the application, you can add test users:

1. Go to **SQL Editor**
2. Run this SQL to insert a test user:
   ```sql
   INSERT INTO users (email, personal_code)
   VALUES 
     ('test@example.com', 'TEST123'),
     ('user2@example.com', 'CODE456');
   ```

**Note**: In production, you'll manage users through an admin script or Supabase dashboard.

## Step 9: Verify Setup

1. ✅ Database tables created (`users`, `daily_logs`, `meditation_files`)
2. ✅ Storage bucket `meditations` created and configured
3. ✅ Extensions enabled (`pg_cron`, `pg_net`)
4. ✅ Resend API key added to Edge Functions secrets
5. ✅ Environment variables configured in `frontend/.env`

## Next Steps

Once Supabase is configured:
1. Proceed to **Phase 2: Authentication** to implement the login flow
2. Test the connection by running `npm run dev` in the `frontend` directory

## Troubleshooting

### Can't see tables after migration
- Check SQL Editor for any error messages
- Ensure you're in the correct project
- Try refreshing the Table Editor

### Storage bucket not accessible
- Verify the bucket is set to **Public**
- Check RLS policies are correctly configured
- Ensure file URLs use the correct format

### Edge Functions secrets not working
- Verify the secret name matches exactly: `RESEND_API_KEY`
- Check that you're using the secret in Edge Functions correctly
- Ensure you've saved the secret after adding it

## Support

- Supabase Docs: [https://supabase.com/docs](https://supabase.com/docs)
- Supabase Discord: [https://discord.supabase.com](https://discord.supabase.com)
