// Edge Function: admin-questionnaire-windows-delete
// Deletes a questionnaire window (admin-only)

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let body: { user_token?: string; id?: string }
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

    const id = typeof body?.id === 'string' ? body.id.trim() : ''
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const { error } = await supabase
      .from('questionnaire_windows')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database delete error (questionnaire_windows):', error)
      return new Response(JSON.stringify({ error: error.message || 'Database query failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('admin-questionnaire-windows-delete error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: errorMessage || 'Failed to delete window' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

