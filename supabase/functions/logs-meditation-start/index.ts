// Edge Function: logs-meditation-start
// Logs when a user starts playing meditation audio

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolvePersonalCodeForDailyLog } from '../_shared/personal-code.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Base64URL decode helper
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = base64.length % 4
  if (padding) {
    base64 += '='.repeat(4 - padding)
  }
  return atob(base64)
}

// Verify and decode JWT (simple verification - in production, verify signature)
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    const payload = JSON.parse(base64UrlDecode(parts[1]))
    return payload
  } catch (e) {
    return null
  }
}

// Get today's date in the app timezone
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // User JWT is in body (Supabase validates Authorization as its own JWT, so we use body)
    let body: { user_token?: string }
    try {
      body = await req.json()
    } catch {
      body = {}
    }
    const token = body?.user_token
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing user_token in request body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }
    const payload = decodeJWT(token)

    if (!payload || !payload.user_id) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const userId = payload.user_id

    // Get Supabase service role client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const personalCode = await resolvePersonalCodeForDailyLog(supabase, userId, payload)

    // Get today's date in app timezone
    const appTimezone = Deno.env.get('APP_TIMEZONE') || 'Europe/Rome'
    const today = getTodayDate(appTimezone)

    // Upsert daily_logs entry
    const { data, error } = await supabase
      .from('daily_logs')
      .upsert({
        user_id: userId,
        date: today,
        ...(personalCode ? { personal_code: personalCode } : {}),
        logged_in_site: true,
        meditation_played: true,
        meditation_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,date',
      })
      .select()
      .single()

    if (error) {
      console.error('Database upsert error:', error)
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to log meditation start' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        log: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Log meditation start error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: errorMessage || 'Failed to log meditation start' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
