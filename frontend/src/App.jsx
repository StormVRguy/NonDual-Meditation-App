import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import QuestionnaireComplete from './pages/QuestionnaireComplete'
import { isAuthenticated } from './utils/auth'
import './App.css'

function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      setAuthenticated(isAuthenticated())
      setLoading(false)
    }
    checkAuth()
  }, [])

  const handleLoginSuccess = () => setAuthenticated(true)
  const handleLogout = () => setAuthenticated(false)

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/questionnaire-complete" element={<QuestionnaireComplete />} />
          <Route
            path="/"
            element={
              authenticated ? (
                <Dashboard onLogout={handleLogout} />
              ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
