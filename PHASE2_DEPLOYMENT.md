# Phase 2 Deployment Guide

This guide will help you deploy the authentication Edge Function and test the login flow.

## Prerequisites

- Supabase project created and configured (from Phase 1)
- Supabase CLI installed: `npm install -g supabase`
- Node.js and npm installed

## Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

## Step 2: Login to Supabase CLI

```bash
supabase login
```

This will open your browser to authenticate with Supabase.

## Step 3: Link Your Project

1. Get your project reference ID:
   - Go to your Supabase project dashboard
   - Go to **Settings** → **General**
   - Copy the **Reference ID**

2. Link your project:
   ```bash
   cd "c:\Users\andre\projects\NonDual Meditation App"
   supabase link --project-ref YOUR_PROJECT_REF_ID
   ```

## Step 4: Set Edge Function Secrets

**Important**: Supabase automatically provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. You don't need to set these manually.

You only need to set custom secrets like `JWT_SECRET`. Since you're using a single `.env` file at the project root:

1. **Make sure your root `.env` file includes `JWT_SECRET`**:
   ```env
   # Frontend variables
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_QUALTRICS_SURVEY_URL=your_qualtrics_url
   
   # Edge Function secrets
   JWT_SECRET=your_random_secret_key_here
   ```

2. **Generate a random JWT secret** (if you haven't already):
   ```bash
   # Using OpenSSL (if installed)
   openssl rand -base64 32
   
   # Or use an online password generator
   # Or create a long random string manually
   ```

3. **Set secrets from the root .env file**:
   ```bash
   cd "c:\Users\andre\projects\NonDual Meditation App"
   supabase secrets set --env-file .env
   ```

   This will set `JWT_SECRET` (and any other non-`VITE_*` variables) as Edge Function secrets.

   **Or set individually**:
   ```bash
   supabase secrets set JWT_SECRET=your_random_secret_key_here
   ```

**Note**: 
- The `--env-file` command will skip `VITE_*` variables (those are for frontend)
- If you get an error about `SUPABASE_*` variables, that's normal - Supabase provides these automatically and you can't override them

## Step 5: Deploy the Edge Function

```bash
supabase functions deploy auth-login
```

Wait for the deployment to complete. You should see a success message with the function URL.

## Step 6: Test the Function

You can test the function using curl or Postman:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/auth-login \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","personal_code":"TEST123"}'
```

Replace:
- `YOUR_PROJECT_REF` with your project reference
- `YOUR_ANON_KEY` with your anon key from Supabase
- Use a test user email and code that exists in your database

## Step 7: Seed Test Users

Before testing, make sure you have test users in your database:

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL (modify emails and codes as needed):

```sql
INSERT INTO users (email, personal_code)
VALUES 
  ('test@example.com', 'TEST123'),
  ('user2@example.com', 'CODE456')
ON CONFLICT (email) DO NOTHING;
```

## Step 8: Configure Frontend Environment

1. Make sure your root `.env` file has the correct values:
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_QUALTRICS_SURVEY_URL=your_qualtrics_url
   JWT_SECRET=your_random_secret_key_here
   ```

   **Note**: The Vite config is set up to read from the root `.env` file automatically.

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

## Step 9: Test the Login Flow

1. Open your browser to `http://localhost:5173` (or the port Vite shows)
2. You should see the login page
3. Enter a test user's email and personal code
4. Click "Login"
5. You should be redirected to the dashboard
6. Click "Logout" to test logout functionality

## Troubleshooting

### Edge Function returns 401
- Verify the user exists in the database with matching email and personal_code
- Check that the email is stored in lowercase (the function converts to lowercase)
- Verify the personal_code matches exactly (case-sensitive)

### Edge Function returns 500
- Check Supabase function logs: Go to Dashboard → Edge Functions → auth-login → Logs
- Verify secrets are set correctly: `supabase secrets list`
- **Note**: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically provided by Supabase - you don't need to set them
- Ensure `JWT_SECRET` is set: `supabase secrets list` should show `JWT_SECRET`

### Frontend can't connect to Edge Function
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct in `.env`
- Check browser console for CORS errors
- Ensure the Edge Function is deployed: `supabase functions list`

### JWT validation fails
- Check that JWT_SECRET is set in Supabase secrets: `supabase secrets list`
- Verify the token is being stored in localStorage (check browser DevTools → Application → Local Storage)
- Check browser console (F12) for JWT parsing errors - look for "JWT validation error"
- Check Edge Function logs in Dashboard to see if JWT_SECRET is being read correctly
- **Important**: If JWT_SECRET appears encoded differently in Supabase dashboard, that's just how it's displayed - the actual value should match your `.env` file

## Next Steps

Once authentication is working:
- Proceed to **Phase 3**: Dashboard and meditation player
- The authentication system is now ready to protect routes and identify users
