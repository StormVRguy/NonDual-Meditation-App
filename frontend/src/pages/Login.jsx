import { useState } from 'react'
import { callEdgeFunction } from '../api/client'
import { setAuth } from '../utils/auth'
import './Login.css'

function Login({ onLoginSuccess }) {
  const [personalCode, setPersonalCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await callEdgeFunction('auth-login', {
        body: JSON.stringify({ personal_code: personalCode.trim() }),
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
        setError('Risposta non valida dal server')
      }
    } catch (err) {
      console.error('Login error:', err)
      // Extract error message, handling both Error objects and other types
      const errorMessage =
        err?.message ||
        err?.error ||
        "Codice personale non ancora attivato; se pensi sia un errore, contatta il responsabile del sito web all'indirizzo andrea.signorelli@unitn.it"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>NonDuality Training - UniTN</h1>
        <p className="subtitle">Per continuare, inserisci il tuo codice personale</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="personalCode">Codice personale</label>
            <input
              id="personalCode"
              type="text"
              value={personalCode}
              onChange={(e) => setPersonalCode(e.target.value)}
              placeholder="Inserisci il tuo codice personale"
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
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
