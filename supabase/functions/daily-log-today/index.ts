// Edge Function: daily-log-today
// Returns today's daily_logs row flags for the user (meditation_finished, etc.)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveUserGroup } from '../_shared/resolve-group.ts'

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

function getIsSunday(timezone: string = 'America/New_York'): boolean {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  })
  const parts = formatter.formatToParts(now)
  const weekday = parts.find((p) => p.type === 'weekday')?.value
  return typeof weekday === 'string' && weekday.toLowerCase() === 'sunday'
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
    const appTimezone = Deno.env.get('APP_TIMEZONE') || 'America/New_York'
    const today = getTodayDate(appTimezone)
    const isSunday = getIsSunday(appTimezone)
    const nowIso = new Date().toISOString()

    const userGroup = await resolveUserGroup(supabase, userId)

    const { data: activeWindow, error: activeWindowError } = await supabase
      .from('questionnaire_windows')
      .select('id, title, starts_at, ends_at')
      .eq('enabled', true)
      .eq('"group"', userGroup)
      .lte('starts_at', nowIso)
      .gt('ends_at', nowIso)
      .order('starts_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (activeWindowError) {
      console.error('Database query error (questionnaire_windows):', activeWindowError)
      return new Response(
        JSON.stringify({ error: activeWindowError.message || 'Database query failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    let hasOpenedInActiveWindow = false
    if (activeWindow?.id) {
      const { data: openRow, error: openError } = await supabase
        .from('questionnaire_window_opens')
        .select('id')
        .eq('user_id', userId)
        .eq('window_id', activeWindow.id)
        .maybeSingle()

      if (openError) {
        console.error('Database query error (questionnaire_window_opens):', openError)
        return new Response(
          JSON.stringify({ error: openError.message || 'Database query failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      hasOpenedInActiveWindow = Boolean(openRow?.id)
    }

    const { data: log, error } = await supabase
      .from('daily_logs')
      .select('meditation_finished')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    if (error) {
      console.error('Database query error:', error)
      return new Response(
        JSON.stringify({ error: error.message || 'Database query failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({
        date: today,
        meditation_finished: log?.meditation_finished === true,
        is_sunday: isSunday,
        active_window: activeWindow
          ? {
              id: activeWindow.id,
              title: activeWindow.title ?? null,
              starts_at: activeWindow.starts_at,
              ends_at: activeWindow.ends_at,
            }
          : null,
        has_opened_in_active_window: hasOpenedInActiveWindow,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('daily-log-today error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: errorMessage || 'Failed to fetch daily log' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
