// Authentication utilities for JWT handling

const TOKEN_KEY = 'meditation_app_token'
const USER_KEY = 'meditation_app_user'

/**
 * Store authentication token and user info
 */
export function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/**
 * Get stored authentication token
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Get stored user info
 */
export function getUser() {
  const userStr = localStorage.getItem(USER_KEY)
  return userStr ? JSON.parse(userStr) : null
}

/**
 * Base64URL decode helper
 */
function base64UrlDecode(str) {
  // Add padding if needed
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = base64.length % 4
  if (padding) {
    base64 += '='.repeat(4 - padding)
  }
  return atob(base64)
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  const token = getToken()
  if (!token) return false

  try {
    // Decode JWT to check expiration (simple check, Edge Function validates)
    const parts = token.split('.')
    if (parts.length !== 3) {
      clearAuth()
      return false
    }
    
    const payload = JSON.parse(base64UrlDecode(parts[1]))
    const now = Math.floor(Date.now() / 1000)
    
    if (payload.exp && payload.exp < now) {
      // Token expired
      clearAuth()
      return false
    }
    
    return true
  } catch (error) {
    console.error('JWT validation error:', error)
    console.error('Token parts:', token ? token.split('.').map((p, i) => `Part ${i}: ${p.substring(0, 20)}...`) : 'No token')
    // Invalid token format
    clearAuth()
    return false
  }
}

/**
 * Clear authentication data
 */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/**
 * Get authorization header for API requests
 */
export function getAuthHeader() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
