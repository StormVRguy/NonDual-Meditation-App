import { useEffect, useState } from 'react'
import { callEdgeFunctionWithUser } from '../api/client'
import { clearAuth, getToken, getUser } from '../utils/auth'
import './AdminDashboard.css'

function AdminDashboard({ onLogout }) {
  const user = getUser()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [today, setToday] = useState('')

  const fetchSummary = async () => {
    try {
      setLoading(true)
      setError('')
      const token = getToken()
      if (!token) {
        setError('Sessione non valida. Effettua di nuovo l’accesso.')
        return
      }

      const res = await callEdgeFunctionWithUser('admin-daily-logs-summary', token)
      setToday(res?.today || '')
      setRows(Array.isArray(res?.rows) ? res.rows : [])
    } catch (err) {
      console.error('Failed to fetch admin summary:', err)
      setError(err?.message || 'Impossibile caricare il riepilogo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  const handleLogout = () => {
    clearAuth()
    if (onLogout) onLogout()
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-user-info">
          <span>Codice: {user?.personal_code ?? '—'}</span>
          <button onClick={handleLogout} className="logout-button">
            Esci
          </button>
        </div>
      </div>

      <div className="admin-dashboard-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Caricamento riepilogo...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button onClick={fetchSummary} className="retry-button">
              Riprova
            </button>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <div className="admin-table-meta">
              <div className="admin-table-meta-item">
                <strong>Oggi</strong>: {today || '—'}
              </div>
              <div className="admin-table-meta-item">
                <strong>Persone</strong>: {rows.length}
              </div>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Codice personale</th>
                  <th>Meditazioni completate</th>
                  <th>Questionari completati</th>
                  <th>Meditazione oggi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.personal_code}>
                    <td className="admin-code-cell">{r.personal_code}</td>
                    <td>{Number.isFinite(r.meditation_days) ? r.meditation_days : 0}</td>
                    <td>{Number.isFinite(r.questionnaires) ? r.questionnaires : 0}</td>
                    <td>
                      <span
                        className={
                          r.meditation_today ? 'admin-bool admin-bool--yes' : 'admin-bool admin-bool--no'
                        }
                        aria-label={r.meditation_today ? 'Sì' : 'No'}
                        title={r.meditation_today ? 'Sì' : 'No'}
                      >
                        {r.meditation_today ? 'Sì' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="admin-empty">
                      Nessun dato disponibile.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard

