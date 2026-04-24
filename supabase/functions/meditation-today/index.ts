// Edge Function: meditation-today
// Returns the most recent meditation file for the requesting user's group.
// Accepts an optional user_token in the body to resolve the group from DB.

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

async function urlLooksPlayable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

async function latestFromStorage(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  bucket: string,
  userGroup: string,
): Promise<{ file_url: string; path: string } | null> {
  // Convention: group-specific files live under "<group>/" folder. Empty group uses bucket root.
  // Supabase Storage list() expects folder name without trailing slash.
  const folder = userGroup ? userGroup : ''

  // List and pick the newest file by updated_at/created_at.
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'updated_at', order: 'desc' },
  })

  if (error) {
    console.error('Storage list error:', error)
    return null
  }

  const files = Array.isArray(data) ? data : []
  const candidate = files.find((f: any) => typeof f?.name === 'string' && f.name.length > 0)
  if (!candidate) return null

  const path = folder ? `${folder}/${candidate.name}` : `${candidate.name}`
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path)
  const url = pub?.publicUrl
  if (!url || typeof url !== 'string') return null

  return { file_url: url, path }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Resolve user group from token (if provided)
    let userGroup = ''
    try {
      const body = await req.json().catch(() => ({}))
      const token = body?.user_token
      if (token) {
        const payload = decodeJWT(token)
        if (payload?.user_id) {
          userGroup = await resolveUserGroup(supabase, payload.user_id)
        }
      }
    } catch {
      // No body or invalid JSON — fall back to empty group
    }

    const { data: meditationFile, error } = await supabase
      .from('meditation_files')
      .select('id, date, file_url')
      .eq('"group"', userGroup)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        const fallback = await latestFromStorage(supabase, 'meditations', userGroup)
        return new Response(
          JSON.stringify({
            meditation: fallback
              ? { id: null, date: null, file_url: fallback.file_url }
              : null,
            message: fallback ? null : 'No meditation available',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
      console.error('Database query error:', error)
      return new Response(
        JSON.stringify({ error: error.message || 'Database query failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    let fileUrl = meditationFile?.file_url
    if (typeof fileUrl === 'string' && fileUrl.trim()) {
      const ok = await urlLooksPlayable(fileUrl)
      if (!ok) {
        console.warn('[meditation-today] DB file_url not reachable; falling back to storage', { fileUrl })
        fileUrl = null
      }
    } else {
      fileUrl = null
    }

    if (!fileUrl) {
      const fallback = await latestFromStorage(supabase, 'meditations', userGroup)
      fileUrl = fallback?.file_url ?? null
    }

    if (!fileUrl) {
      return new Response(
        JSON.stringify({ meditation: null, message: 'No meditation available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({
        meditation: {
          id: meditationFile?.id ?? null,
          date: meditationFile?.date ?? null,
          file_url: fileUrl,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Meditation today error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: errorMessage || 'Failed to fetch meditation' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
