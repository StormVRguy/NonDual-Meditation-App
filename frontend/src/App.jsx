import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import QuestionnaireComplete from './pages/QuestionnaireComplete'
import SiteFooter from './components/SiteFooter'
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

  return (
    <BrowserRouter>
      <div className="App app-layout">
        {loading ? (
          <main className="app-main app-main--loading" aria-busy="true">
            <div className="app-loading">
              <div className="loading-spinner"></div>
              <p>Caricamento...</p>
            </div>
          </main>
        ) : (
          <main className="app-main">
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
          </main>
        )}
        <SiteFooter />
      </div>
    </BrowserRouter>
  )
}

export default App
