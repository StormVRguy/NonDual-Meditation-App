// Edge Function: auth-login
// Handles personal_code authentication and returns JWT
// On success, sets daily_logs.logged_in_site = TRUE for today (APP_TIMEZONE)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Base64URL encoding helper
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Simple JWT creation using Web Crypto API
async function createJWT(payload: Record<string, any>, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  // Encode header and payload as base64url
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))

  // Create the signature
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const dataToSign = `${encodedHeader}.${encodedPayload}`
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(dataToSign)
  )

  // Convert signature ArrayBuffer to base64url
  const signatureArray = new Uint8Array(signature)
  const signatureBase64 = btoa(String.fromCharCode(...signatureArray))
  const encodedSignature = signatureBase64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`
}

function getTodayDate(timezone: string = 'Europe/Rome'): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(now)
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  return `${year}-${month}-${day}`
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('Auth-login function called', {
    method: req.method,
    url: req.url,
    hasBody: !!req.body
  })

  try {
    // Supabase automatically provides these environment variables:
    // - SUPABASE_URL: Your project URL
    // - SUPABASE_ANON_KEY: Anonymous key
    // - SUPABASE_SERVICE_ROLE_KEY: Service role key (for admin operations)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseServiceKey,
        envKeys: Object.keys(Deno.env.toObject()).filter(k => k.startsWith('SUPABASE'))
      })
      return new Response(
        JSON.stringify({ error: 'Server configuration error - Supabase credentials not available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    let requestBody
    try {
      requestBody = await req.json()
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { personal_code } = requestBody

    if (!personal_code) {
      return new Response(
        JSON.stringify({ error: 'Personal code is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Query users table for matching personal_code (case-insensitive)
    const inputCode = typeof personal_code === 'string' ? personal_code.trim() : ''
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, personal_code, is_admin')
      // ilike is case-insensitive; we pass no wildcards so it's effectively an exact match.
      .ilike('personal_code', inputCode)
      .maybeSingle()

    // maybeSingle: no row = null data, no error; .single() would return PGRST116 for 0 rows
    if (error) {
      console.error('Database query error:', error)
      return new Response(
        JSON.stringify({ error: error.message || 'Database query failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!user) {
      return new Response(
        JSON.stringify({
          error:
            'Codice personale non ancora attivato; se pensi sia un errore, contatta il responsabile del sito web all\'indirizzo andrea.signorelli@unitn.it',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Create JWT token with user_id (personal_code included for daily_logs denormalization)
    const payload = {
      user_id: user.id,
      email: user.email,
      personal_code: user.personal_code,
      is_admin: user.is_admin === true,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days expiration
      iat: Math.floor(Date.now() / 1000),
    }

    // Get JWT secret from environment
    // Note: Supabase stores secrets as-is. If you see it encoded differently in the dashboard,
    // that's just how it's displayed - the actual value should match what you set.
    const jwtSecret = Deno.env.get('JWT_SECRET')
    
    if (!jwtSecret) {
      console.error('JWT_SECRET not found in environment variables')
      console.error('Available env keys:', Object.keys(Deno.env.toObject()).filter(k => k.includes('JWT') || k.includes('SECRET')))
      return new Response(
        JSON.stringify({ error: 'Server configuration error - JWT_SECRET not set' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    // Debug: Log secret info (first 4 chars only for security)
    console.log('JWT_SECRET found, length:', jwtSecret.length, 'starts with:', jwtSecret.substring(0, 4))
    
    let token
    try {
      token = await createJWT(payload, jwtSecret)
      console.log('JWT created successfully, length:', token.length)
    } catch (jwtError) {
      console.error('JWT creation failed:', jwtError)
      throw jwtError
    }

    // Mark daily log: user logged into the site today (same calendar day as other logs)
    const appTimezone = Deno.env.get('APP_TIMEZONE') || 'Europe/Rome'
    const today = getTodayDate(appTimezone)
    const { error: logError } = await supabase
      .from('daily_logs')
      .upsert(
        {
          user_id: user.id,
          date: today,
          personal_code: user.personal_code,
          logged_in_site: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,date' }
      )

    if (logError) {
      console.error('Failed to upsert logged_in_site for daily_logs:', logError)
      // Still return token — login succeeded; logging is secondary
    }

    const responseData = { 
      token,
      user: {
        id: user.id,
        email: user.email,
        personal_code: user.personal_code,
        is_admin: user.is_admin === true,
      }
    }
    
    console.log('Returning success response')
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Auth error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: errorMessage || 'Authentication failed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
