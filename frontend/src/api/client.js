import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to call Edge Functions
// Uses Supabase client's invoke method which handles authentication correctly
export async function callEdgeFunction(functionName, options = {}) {
  console.log('Calling Edge Function:', functionName)
  console.log('Request body:', options.body)
  
  try {
    // Parse body if it's a string
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: body,
      ...options,
    })
    
    if (error) {
      console.error('Edge Function error:', error)
      console.error('Error details:', {
        message: error.message,
        context: error.context,
        status: error.context?.status,
        statusText: error.context?.statusText,
        response: error.context?.response,
      })
      
      // Try to extract error message from various places
      let errorMessage = 'An error occurred'
      
      // Check error.context.response (Supabase error structure)
      if (error.context?.response) {
        try {
          const response = error.context.response
          if (typeof response === 'string') {
            const parsed = JSON.parse(response)
            errorMessage = parsed?.error || parsed?.message || errorMessage
          } else if (response.error || response.message) {
            errorMessage = response.error || response.message
          }
        } catch (e) {
          // If it's not JSON, use the string directly
          if (typeof error.context.response === 'string') {
            errorMessage = error.context.response
          }
        }
      }
      
      // Fall back to error.message
      if (error.message && errorMessage === 'An error occurred') {
        errorMessage = error.message
      }
      
      throw new Error(errorMessage)
    }

    // Check if response contains an error field
    if (data && data.error) {
      throw new Error(data.error)
    }

    return data
  } catch (err) {
    // Re-throw if it's already an Error
    if (err instanceof Error) {
      throw err
    }
    // Otherwise wrap it
    throw new Error(err?.message || 'Failed to call Edge Function')
  }
}
