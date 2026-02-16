import { useState } from 'react'
import { callEdgeFunction } from '../api/client'
import { setAuth } from '../utils/auth'
import './Login.css'

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [personalCode, setPersonalCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await callEdgeFunction('auth-login', {
        body: JSON.stringify({ email, personal_code: personalCode }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.token && response.user) {
        const user = {
          ...response.user,
          personal_code: response.user.personal_code ?? personalCode.trim()
        }
        setAuth(response.token, user)
        onLoginSuccess()
      } else {
        setError('Invalid response from server')
      }
    } catch (err) {
      console.error('Login error:', err)
      // Extract error message, handling both Error objects and other types
      const errorMessage = err?.message || err?.error || 'Invalid email or personal code. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Meditation Training</h1>
        <p className="subtitle">Please enter your credentials to continue</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="personalCode">Personal Code</label>
            <input
              id="personalCode"
              type="text"
              value={personalCode}
              onChange={(e) => setPersonalCode(e.target.value)}
              placeholder="Enter your personal code"
              required
              disabled={loading}
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
