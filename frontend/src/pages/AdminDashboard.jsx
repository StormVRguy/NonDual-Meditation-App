import { useEffect, useState } from 'react'
import { callEdgeFunctionWithUser } from '../api/client'
import { clearAuth, getToken, getUser } from '../utils/auth'
import './AdminDashboard.css'

const APP_TIMEZONE = 'Europe/Rome'

function formatRomeDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('it-IT', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function offsetMinutesForZoneAt(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
    minute: '2-digit',
  })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName')?.value

  // Examples: "GMT+2", "GMT+02:00", "GMT-05:00"
  const m = typeof parts === 'string' ? parts.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/) : null
  if (!m) return 0
  const sign = m[1] === '-' ? -1 : 1
  const hh = Number(m[2] || 0)
  const mm = Number(m[3] || 0)
  return sign * (hh * 60 + mm)
}

function romeLocalInputToUtcIso(localValue) {
  // localValue: "YYYY-MM-DDTHH:mm" from <input type="datetime-local">
  if (typeof localValue !== 'string' || !localValue.includes('T')) return null
  const [datePart, timePart] = localValue.split('T')
  const [y, mo, d] = datePart.split('-').map((n) => Number(n))
  const [h, mi] = timePart.split(':').map((n) => Number(n))
  if (![y, mo, d, h, mi].every((n) => Number.isFinite(n))) return null

  // Interpret y/mo/d h:mi as wall-clock time in Europe/Rome.
  // Convert to UTC by iterating offset (handles DST boundaries robustly enough for admin input).
  let utcMillis = Date.UTC(y, mo - 1, d, h, mi, 0, 0)
  for (let i = 0; i < 2; i++) {
    const guess = new Date(utcMillis)
    const offsetMin = offsetMinutesForZoneAt(guess, APP_TIMEZONE)
    const corrected = Date.UTC(y, mo - 1, d, h, mi, 0, 0) - offsetMin * 60 * 1000
    if (Math.abs(corrected - utcMillis) < 1000) break
    utcMillis = corrected
  }
  return new Date(utcMillis).toISOString()
}

function AdminDashboard({ onLogout }) {
  const user = getUser()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [today, setToday] = useState('')
  const [windowsLoading, setWindowsLoading] = useState(true)
  const [windowsError, setWindowsError] = useState('')
  const [windows, setWindows] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [newStartsAt, setNewStartsAt] = useState('')
  const [newEndsAt, setNewEndsAt] = useState('')
  const [newGroup, setNewGroup] = useState('Exp1')

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

  const fetchWindows = async () => {
    try {
      setWindowsLoading(true)
      setWindowsError('')
      const token = getToken()
      if (!token) {
        setWindowsError('Sessione non valida. Effettua di nuovo l’accesso.')
        return
      }

      const res = await callEdgeFunctionWithUser('admin-questionnaire-windows-list', token, {
        body: { limit: 100 },
      })
      setWindows(Array.isArray(res?.windows) ? res.windows : [])
    } catch (err) {
      console.error('Failed to fetch windows:', err)
      setWindowsError(err?.message || 'Impossibile caricare le finestre')
    } finally {
      setWindowsLoading(false)
    }
  }

  const handleCreateWindow = async (e) => {
    e.preventDefault()
    try {
      setWindowsError('')
      const token = getToken()
      if (!token) {
        setWindowsError('Sessione non valida. Effettua di nuovo l’accesso.')
        return
      }

      const startsAtIso = romeLocalInputToUtcIso(newStartsAt)
      const endsAtIso = romeLocalInputToUtcIso(newEndsAt)
      if (!startsAtIso || !endsAtIso) {
        setWindowsError('Intervallo non valido')
        return
      }

      await callEdgeFunctionWithUser('admin-questionnaire-windows-upsert', token, {
        body: {
          title: newTitle?.trim() ? newTitle.trim() : null,
          starts_at: startsAtIso,
          ends_at: endsAtIso,
          enabled: true,
          group: newGroup?.trim() ? newGroup.trim() : '',
        },
      })
      setNewTitle('')
      setNewStartsAt('')
      setNewEndsAt('')
      // keep group selection as-is for faster entry
      await fetchWindows()
    } catch (err) {
      console.error('Failed to create window:', err)
      setWindowsError(err?.message || 'Impossibile creare la finestra')
    }
  }

  const handleToggleEnabled = async (w) => {
    try {
      setWindowsError('')
      const token = getToken()
      if (!token) {
        setWindowsError('Sessione non valida. Effettua di nuovo l’accesso.')
        return
      }

      await callEdgeFunctionWithUser('admin-questionnaire-windows-upsert', token, {
        body: {
          id: w.id,
          title: w.title ?? null,
          starts_at: w.starts_at,
          ends_at: w.ends_at,
          enabled: !(w.enabled === true),
        },
      })
      await fetchWindows()
    } catch (err) {
      console.error('Failed to toggle window:', err)
      setWindowsError(err?.message || 'Impossibile aggiornare la finestra')
    }
  }

  const handleDeleteWindow = async (w) => {
    const ok = confirm('Eliminare questa finestra? (L’operazione è irreversibile)')
    if (!ok) return
    try {
      setWindowsError('')
      const token = getToken()
      if (!token) {
        setWindowsError('Sessione non valida. Effettua di nuovo l’accesso.')
        return
      }
      await callEdgeFunctionWithUser('admin-questionnaire-windows-delete', token, {
        body: { id: w.id },
      })
      await fetchWindows()
    } catch (err) {
      console.error('Failed to delete window:', err)
      setWindowsError(err?.message || 'Impossibile eliminare la finestra')
    }
  }

  useEffect(() => {
    fetchSummary()
    fetchWindows()
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
          <>
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
                    <th>Gruppo</th>
                    <th>Meditazioni completate</th>
                    <th>Questionari aperti</th>
                    <th>Meditazione oggi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.personal_code}>
                      <td className="admin-code-cell">{r.personal_code}</td>
                      <td className="admin-group-cell">{r.group || '—'}</td>
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
                      <td colSpan={5} className="admin-empty">
                        Nessun dato disponibile.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-table-wrapper admin-windows">
              <div className="admin-windows-header">
                <h2>Finestre questionario (timezone Roma)</h2>
                <button onClick={fetchWindows} className="retry-button" disabled={windowsLoading}>
                  Aggiorna
                </button>
              </div>

              {windowsError ? <p className="error-message">{windowsError}</p> : null}

              <form className="admin-window-form" onSubmit={handleCreateWindow}>
                <div className="admin-window-form-row">
                  <label className="admin-field">
                    <span className="admin-field-label">Titolo (opzionale)</span>
                    <input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Es. Finestra Maggio"
                      type="text"
                    />
                  </label>
                </div>
                <div className="admin-window-form-row">
                  <label className="admin-field">
                    <span className="admin-field-label">Gruppo</span>
                    <input
                      value={newGroup}
                      onChange={(e) => setNewGroup(e.target.value)}
                      placeholder="Es. Exp1"
                      type="text"
                    />
                  </label>
                </div>
                <div className="admin-window-form-row admin-window-form-row--grid">
                  <label className="admin-field">
                    <span className="admin-field-label">Inizio</span>
                    <input value={newStartsAt} onChange={(e) => setNewStartsAt(e.target.value)} type="datetime-local" required />
                  </label>
                  <label className="admin-field">
                    <span className="admin-field-label">Fine</span>
                    <input value={newEndsAt} onChange={(e) => setNewEndsAt(e.target.value)} type="datetime-local" required />
                  </label>
                  <button className="admin-primary" type="submit" disabled={windowsLoading}>
                    Aggiungi
                  </button>
                </div>
              </form>

              {windowsLoading ? (
                <p className="admin-muted">Caricamento finestre…</p>
              ) : (
                <div className="admin-windows-list">
                  {windows.map((w) => (
                    <div key={w.id} className="admin-window-item">
                      <div className="admin-window-main">
                        <div className="admin-window-title">
                          <strong>{w.title?.trim() ? w.title : 'Finestra'}</strong>
                          <span className={w.enabled ? 'admin-pill admin-pill--on' : 'admin-pill admin-pill--off'}>
                            {w.enabled ? 'Attiva' : 'Disattiva'}
                          </span>
                        </div>
                        <div className="admin-window-range">
                          {formatRomeDateTime(w.starts_at)} → {formatRomeDateTime(w.ends_at)}
                        </div>
                        <div className="admin-window-id">Gruppo: {w.group?.trim?.() ? w.group : '—'}</div>
                        <div className="admin-window-id">{w.id}</div>
                      </div>
                      <div className="admin-window-actions">
                        <button type="button" className="admin-secondary" onClick={() => handleToggleEnabled(w)}>
                          {w.enabled ? 'Disattiva' : 'Attiva'}
                        </button>
                        <button type="button" className="admin-danger" onClick={() => handleDeleteWindow(w)}>
                          Elimina
                        </button>
                      </div>
                    </div>
                  ))}
                  {windows.length === 0 ? <p className="admin-muted">Nessuna finestra configurata.</p> : null}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard

