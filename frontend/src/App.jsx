import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import QuestionnaireComplete from './pages/QuestionnaireComplete'
import SiteFooter from './components/SiteFooter'
import { getToken, isAuthenticated } from './utils/auth'
import { callEdgeFunctionWithUser } from './api/client'
import { resolveDashboardVariant } from './config/dashboardGroups'
import { getDashboardComponent } from './config/dashboardRegistry'
import './App.css'

function normalizeGroup(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState(false)
  const [userGroup, setUserGroup] = useState('')
  const [groupResolutionError, setGroupResolutionError] = useState('')
  const [roleLoading, setRoleLoading] = useState(false)
  const dashboardVariant = resolveDashboardVariant(userGroup)
  const UserDashboard = getDashboardComponent(dashboardVariant)

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
        setUserGroup('')
        setGroupResolutionError('')
        setRoleLoading(false)
        return
      }

      const token = getToken()
      if (!token) {
        setAdmin(false)
        setUserGroup('')
        setGroupResolutionError('')
        setRoleLoading(false)
        return
      }

      try {
        setRoleLoading(true)
        const res = await callEdgeFunctionWithUser('user-me', token)
        const isAdminFromDb = res?.user?.is_admin === true
        const groupFromDb = normalizeGroup(res?.user?.group)
        const mappedVariant = resolveDashboardVariant(groupFromDb)
        if (!cancelled) {
          setAdmin(isAdminFromDb)
          setUserGroup(groupFromDb)
          if (!isAdminFromDb && !groupFromDb) {
            setGroupResolutionError('Impossibile determinare il gruppo utente dal profilo. Contatta il responsabile del sito.')
          } else if (!isAdminFromDb && !mappedVariant) {
            setGroupResolutionError('Gruppo utente non configurato per una dashboard dedicata. Contatta il responsabile del sito.')
          } else {
            setGroupResolutionError('')
          }
        }
      } catch (e) {
        console.error('Failed to fetch user role:', e)
        if (!cancelled) {
          setAdmin(false)
          setUserGroup('')
          setGroupResolutionError('Impossibile caricare il profilo utente. Effettua di nuovo l’accesso o contatta il responsabile del sito.')
        }
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
                    ) : groupResolutionError ? (
                      <div className="app-loading" role="alert">
                        <p>{groupResolutionError}</p>
                      </div>
                    ) : !UserDashboard ? (
                      <div className="app-loading" role="alert">
                        <p>Gruppo utente non configurato per una dashboard dedicata. Contatta il responsabile del sito.</p>
                      </div>
                    ) : (
                      <UserDashboard onLogout={handleLogout} />
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
