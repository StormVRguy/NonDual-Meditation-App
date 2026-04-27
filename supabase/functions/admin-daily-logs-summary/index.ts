// Edge Function: admin-daily-logs-summary
// Returns aggregated daily_logs stats for all users (admin-only)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

function getTodayDate(timezone: string = 'Europe/Rome'): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(now)
  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value
  return `${year}-${month}-${day}`
}

type SummaryRow = {
  personal_code: string
  group: string
  meditation_days: number
  questionnaires: number
  lectures_watched: number
  logged_days: number
  meditation_today: boolean
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
      return new Response(JSON.stringify({ error: 'Missing user_token in request body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const payload = decodeJWT(token)
    if (!payload || !payload.user_id) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const requesterUserId = payload.user_id as string

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Prefer JWT claim if present, but also verify from DB for safety/back-compat
    let isAdmin = payload.is_admin === true
    if (!isAdmin) {
      const { data: requester, error: requesterError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', requesterUserId)
        .maybeSingle()

      if (requesterError) {
        console.error('Database query error (requester is_admin):', requesterError)
        return new Response(JSON.stringify({ error: requesterError.message || 'Database query failed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        })
      }
      isAdmin = requester?.is_admin === true
    }

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    const appTimezone = Deno.env.get('APP_TIMEZONE') || 'Europe/Rome'
    const today = getTodayDate(appTimezone)

    // Fetch all non-admin users to get their group (join in-memory with daily_logs)
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('personal_code, "group"')
      .eq('is_admin', false)

    if (usersError) {
      console.error('Database query error (users):', usersError)
      return new Response(JSON.stringify({ error: usersError.message || 'Database query failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // Build personal_code → group lookup
    const groupByCode = new Map<string, string>()
    for (const u of allUsers ?? []) {
      const code = (u as any)?.personal_code
      if (code) groupByCode.set(code, (u as any)?.group ?? '')
    }

    // Fetch raw daily logs and aggregate in-memory.
    // This keeps schema simple (no extra SQL functions/views) and is fine for modest dataset sizes.
    const { data: logs, error: logsError } = await supabase
      .from('daily_logs')
      .select('personal_code, date, meditation_finished, questionnaire_started, lecture_watched, logged_in_site')

    if (logsError) {
      console.error('Database query error (daily_logs):', logsError)
      return new Response(JSON.stringify({ error: logsError.message || 'Database query failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const byCode = new Map<string, SummaryRow>()
    const loggedDaysByCode = new Map<string, Set<string>>()

    for (const log of logs ?? []) {
      const code = (log as any)?.personal_code
      if (!code || typeof code !== 'string') continue

      let row = byCode.get(code)
      if (!row) {
        row = {
          personal_code: code,
          group: groupByCode.get(code) ?? '',
          meditation_days: 0,
          questionnaires: 0,
          lectures_watched: 0,
          logged_days: 0,
          meditation_today: false,
        }
        byCode.set(code, row)
      }

      if ((log as any)?.meditation_finished === true) {
        row.meditation_days += 1
        if ((log as any)?.date === today) row.meditation_today = true
      }

      if ((log as any)?.questionnaire_started === true) {
        row.questionnaires += 1
      }

      if ((log as any)?.lecture_watched === true) {
        row.lectures_watched += 1
      }

      if ((log as any)?.logged_in_site === true) {
        const date = (log as any)?.date
        if (typeof date === 'string' && date.length > 0) {
          let dates = loggedDaysByCode.get(code)
          if (!dates) {
            dates = new Set<string>()
            loggedDaysByCode.set(code, dates)
          }
          dates.add(date)
        }
      }
    }

    for (const [code, row] of byCode.entries()) {
      row.logged_days = loggedDaysByCode.get(code)?.size ?? 0
    }

    const rows = Array.from(byCode.values()).sort((a, b) =>
      a.personal_code.localeCompare(b.personal_code)
    )

    return new Response(JSON.stringify({ today, rows }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('admin-daily-logs-summary error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: errorMessage || 'Failed to fetch summary' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

