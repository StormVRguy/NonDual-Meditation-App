import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { isAuthenticated } from './utils/auth'
import './App.css'

function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = () => {
      const authStatus = isAuthenticated()
      setAuthenticated(authStatus)
      setLoading(false)
    }

    checkAuth()
  }, [])

  const handleLoginSuccess = () => {
    setAuthenticated(true)
  }

  const handleLogout = () => {
    setAuthenticated(false)
  }

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="App">
      {authenticated ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  )
}

export default App
