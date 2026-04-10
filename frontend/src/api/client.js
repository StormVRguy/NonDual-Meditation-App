import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Variabili d'ambiente Supabase mancanti")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Edge Functions: non-2xx responses set error.message to a generic string.
 * The real message is usually JSON `{ error: "..." }` on the Response body in error.context.
 */
function translateServerErrorMessage(message) {
  if (!message || typeof message !== 'string') return message

  const exactMap = {
    'Server configuration error': 'Errore di configurazione del server',
    'Server configuration error - Supabase credentials not available':
      'Errore di configurazione del server - credenziali Supabase non disponibili',
    'Server configuration error - JWT_SECRET not set':
      'Errore di configurazione del server - JWT_SECRET non impostato',
    'Invalid JSON in request body': 'JSON non valido nel corpo della richiesta',
    'Personal code is required': 'Il codice personale è richiesto',
    'Database query failed': 'Richiesta al database non riuscita',
    'Authentication failed': 'Autenticazione non riuscita',
    'Failed to fetch meditation': 'Impossibile recuperare la meditazione',
    'Failed to fetch lecture': 'Impossibile recuperare la lezione',

    // Questionnaire windows
    'Questionnaire not available right now': 'Il questionario non è disponibile in questo momento',
    'Questionnaire already opened for this window':
      'Hai già compilato il questionario per questa finestra',
    'Invalid window time range': 'Intervallo della finestra non valido',
    Forbidden: 'Accesso negato',
    'Missing id': 'Parametro mancante: id',
  }

  return exactMap[message] ?? message
}

async function messageFromFunctionsInvokeError(error) {
  const fallback = error?.message || 'Si è verificato un errore'
  const ctx = error?.context
  if (!ctx) return fallback

  // Supabase functions-js: error.context is the fetch Response (body not read yet)
  const isFetchResponse =
    (typeof Response !== 'undefined' && ctx instanceof Response) ||
    (typeof ctx?.json === 'function' && typeof ctx?.clone === 'function')

  if (isFetchResponse) {
    try {
      const json = await ctx.clone().json()
      if (json && typeof json.error === 'string') return translateServerErrorMessage(json.error)
      if (json && typeof json.message === 'string') return translateServerErrorMessage(json.message)
    } catch {
      try {
        const text = await ctx.clone().text()
        if (text) {
          const parsed = JSON.parse(text)
          if (parsed?.error) return translateServerErrorMessage(parsed.error)
        }
      } catch {
        /* ignore */
      }
    }
    return fallback
  }

  if (typeof ctx.response === 'string') {
    try {
      const parsed = JSON.parse(ctx.response)
      if (parsed?.error) return translateServerErrorMessage(parsed.error)
    } catch {
      /* ignore */
    }
  }

  return fallback
}

// Helper function to call Edge Functions
// Uses Supabase client's invoke method which handles authentication correctly
export async function callEdgeFunction(functionName, options = {}) {
  console.log('Calling Edge Function:', functionName)
  console.log('Request body:', options.body)
  
  try {
    // Parse body if it's a string (do not spread ...options after body — it would
    // re-apply options.body and overwrite with a string, breaking invoke)
    const { body: bodyInput, ...invokeOptions } = options
    const body =
      bodyInput === undefined
        ? undefined
        : typeof bodyInput === 'string'
          ? JSON.parse(bodyInput)
          : bodyInput

    const { data, error } = await supabase.functions.invoke(functionName, {
      ...invokeOptions,
      body,
    })
    
    if (error) {
      console.error('Edge Function error:', error)
      console.error('Error details:', {
        message: error.message,
        context: error.context,
        status: error.context?.status,
        statusText: error.context?.statusText,
      })

      const errorMessage = await messageFromFunctionsInvokeError(error)
      throw new Error(errorMessage)
    }

    // Check if response contains an error field
    if (data && data.error) {
      throw new Error(translateServerErrorMessage(data.error))
    }

    return data
  } catch (err) {
    // Re-throw if it's already an Error
    if (err instanceof Error) {
      throw err
    }
    // Otherwise wrap it
    throw new Error(err?.message || 'Impossibile chiamare la funzione Edge')
  }
}

/**
 * Call an Edge Function that requires the current user (logging endpoints).
 * Passes the user's JWT in the request body as user_token so Supabase still
 * accepts the request (anon key in Authorization) and the function can read user_id.
 */
export async function callEdgeFunctionWithUser(functionName, userToken, options = {}) {
  const body = {
    ...(typeof options.body === 'object' && options.body !== null ? options.body : {}),
    user_token: userToken,
  }
  return callEdgeFunction(functionName, { ...options, body })
}
