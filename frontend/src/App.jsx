import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import QuestionnaireComplete from './pages/QuestionnaireComplete'
import SiteFooter from './components/SiteFooter'
import { getToken, isAuthenticated } from './utils/auth'
import { callEdgeFunctionWithUser } from './api/client'
import './App.css'

function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState(false)
  const [roleLoading, setRoleLoading] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      setAuthenticated(isAuthenticated())
      setLoading(false)
    }
    checkAuth()
  }, [])

  const handleLoginSuccess = () => setAuthenticated(true)
  const handleLogout = () => setAuthenticated(false)

  useEffect(() => {
    let cancelled = false

    async function fetchRole() {
      if (!authenticated) {
        setAdmin(false)
        setRoleLoading(false)
        return
      }

      const token = getToken()
      if (!token) {
        setAdmin(false)
        setRoleLoading(false)
        return
      }

      try {
        setRoleLoading(true)
        const res = await callEdgeFunctionWithUser('user-me', token)
        const isAdminFromDb = res?.user?.is_admin === true
        if (!cancelled) setAdmin(isAdminFromDb)
      } catch (e) {
        console.error('Failed to fetch user role:', e)
        if (!cancelled) setAdmin(false)
      } finally {
        if (!cancelled) setRoleLoading(false)
      }
    }

    fetchRole()
    return () => {
      cancelled = true
    }
  }, [authenticated])

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
                    roleLoading ? (
                      <div className="app-loading">
                        <div className="loading-spinner"></div>
                        <p>Caricamento...</p>
                      </div>
                    ) : admin ? (
                      <AdminDashboard onLogout={handleLogout} />
                    ) : (
                      <Dashboard onLogout={handleLogout} />
                    )
                  ) : (
                    <Login onLoginSuccess={handleLoginSuccess} />
                  )
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        )}
        <SiteFooter showMeditationContact={!admin} />
      </div>
    </BrowserRouter>
  )
}

export default App
