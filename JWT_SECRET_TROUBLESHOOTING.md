# JWT_SECRET Troubleshooting

If you're seeing "invalid JWT" errors, the issue might be with how Supabase stores/encodes secrets.

## The Problem

When you set `JWT_SECRET` via `supabase secrets set`, Supabase might:
1. Store it as-is (most common)
2. Display it encoded in the dashboard (but use the original value)
3. Apply URL encoding or other transformations

## Solution: Verify the Secret Value

1. **Check Edge Function logs via Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to **Edge Functions** → **auth-login** → **Logs**
   - Try logging in, then refresh the logs
   - Look for the log line that shows:
     ```
     JWT_SECRET found, length: XX, starts with: XXXX
     ```

   **OR check browser console:**
   - Open DevTools (F12) → Console tab
   - Try logging in
   - Look for any error messages or logs

2. **Compare with your .env file:**
   - Your `.env` has: `JWT_SECRET=MABoxdAPdE18VPsTmk6TKg72koANjbUAuBHq1yPUO3k=`
   - The log should show the same length and starting characters

3. **If they don't match:**
   - The secret might have been encoded when stored
   - Try setting it again with quotes (if it contains special characters):
     ```bash
     supabase secrets set JWT_SECRET="MABoxdAPdE18VPsTmk6TKg72koANjbUAuBHq1yPUO3k="
     ```

## Alternative: Use a Simple Secret

If encoding is causing issues, try a simpler secret without special characters:

```bash
# Generate a new simple secret
openssl rand -hex 32

# Set it
supabase secrets set JWT_SECRET=your_new_hex_secret_here
```

Then update your `.env` file to match.

## Debug Steps

1. **Check Edge Function logs:**
   - Go to Supabase Dashboard → Edge Functions → auth-login → Logs
   - Or check browser console (F12) for client-side errors

2. **Check browser console:**
   - Open DevTools (F12)
   - Look for "JWT validation error" messages
   - Check what the token looks like

3. **Verify the JWT format:**
   - A valid JWT has 3 parts separated by dots: `header.payload.signature`
   - Check if the token in localStorage has this format

4. **Test the secret directly:**
   - The secret should be the exact same value in both `.env` and Supabase secrets
   - No encoding/decoding should happen
