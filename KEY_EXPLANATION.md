# Supabase Keys Explanation

## Different Keys and Their Purposes

### 1. Anon/Public Key (`VITE_SUPABASE_ANON_KEY`)
- **Purpose**: Authenticates API requests to Supabase (database, storage, Edge Functions)
- **Format**: Can be either:
  - Old format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT format)
  - New format: `sb_publishable_...` (v2 format)
- **Where to find**: Settings → API → anon/public key
- **Used in**: Frontend code to authenticate requests

### 2. Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)
- **Purpose**: Bypasses Row Level Security (RLS) - for admin operations
- **Format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT format)
- **Where to find**: Settings → API → service_role key
- **Used in**: Edge Functions for database operations that bypass RLS
- **⚠️ Keep this secret!** Never expose in frontend

### 3. Supabase JWT Secret (in Settings)
- **Purpose**: Supabase uses this to sign its own authentication tokens
- **Where to find**: Settings → API → JWT Secret
- **Used by**: Supabase's built-in authentication system
- **⚠️ Do NOT use this** for our custom JWTs - we have our own secret

### 4. Our Custom JWT_SECRET
- **Purpose**: We use this to sign our own custom JWT tokens (for email+code auth)
- **Where**: Set via `supabase secrets set JWT_SECRET=...`
- **Used in**: Edge Function `auth-login` to create custom JWTs
- **Format**: Any random string (we generated: `MABoxdAPdE18VPsTmk6TKg72koANjbUAuBHq1yPUO3k=`)

## Current Issue: 401 Error

The 401 "Invalid JWT" error is likely because:
1. **Edge Functions might require the old-format anon key** (`eyJ...`) instead of `sb_publishable_...`
2. **Or** the function isn't properly deployed/accessible

## Solution

Check your Supabase Dashboard → Settings → API:
- Do you see **both** anon key formats?
- If yes, try using the `eyJ...` format key in your `.env` file
- Update `VITE_SUPABASE_ANON_KEY` with the `eyJ...` format key
- Restart your dev server

## Summary

- ✅ **Use**: Anon key (`eyJ...` or `sb_publishable_...`) for API requests
- ✅ **Use**: Our custom `JWT_SECRET` for signing our custom JWTs
- ❌ **Don't use**: Supabase's JWT Secret (that's for Supabase's auth system)
