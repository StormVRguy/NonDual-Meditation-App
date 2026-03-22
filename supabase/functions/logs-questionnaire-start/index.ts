// Edge Function: logs-questionnaire-start
// Logs when a user starts the questionnaire (sets questionnaire_started = TRUE and questionnaire_started_at timestamp)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolvePersonalCodeForDailyLog } from '../_shared/personal-code.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = base64.length % 4
  if (padding) base64 += '='.repeat(4 - padding)
  return atob(base64)
}

function decodeJWT(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    return JSON.parse(base64UrlDecode(parts[1]))
  } catch {
    return null
  }
}

function getTodayDate(timezone: string = 'America/New_York'): string {
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
    const appTimezone = Deno.env.get('APP_TIMEZONE') || 'America/New_York'
    const today = getTodayDate(appTimezone)

    const { data, error } = await supabase
      .from('daily_logs')
      .upsert({
        user_id: userId,
        date: today,
        ...(personalCode ? { personal_code: personalCode } : {}),
        questionnaire_started: true,
        questionnaire_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,date',
      })
      .select()
      .single()

    if (error) {
      console.error('Database upsert error:', error)
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to log questionnaire start' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, log: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Log questionnaire start error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: errorMessage || 'Failed to log questionnaire start' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
