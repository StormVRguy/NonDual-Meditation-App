import { useState, useEffect } from 'react'
import { getUser, clearAuth, getToken } from '../utils/auth'
import { callEdgeFunction, callEdgeFunctionWithUser } from '../api/client'
import AudioPlayer from '../components/AudioPlayer'
import VideoPlayer from '../components/VideoPlayer'
import './Dashboard.css'

const APP_TIMEZONE = 'Europe/Rome'

function formatRomeDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('it-IT', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function Dashboard({ onLogout }) {
  const user = getUser()
  const [meditation, setMeditation] = useState(null)
  const [lecture, setLecture] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lectureLoading, setLectureLoading] = useState(true)
  const [error, setError] = useState('')
  const [lectureError, setLectureError] = useState('')
  const [meditationPlayed, setMeditationPlayed] = useState(false)
  const [meditationMostlyPlayed, setMeditationMostlyPlayed] = useState(false)
  /** True if Supabase already has meditation_finished for today (any earlier session) */
  const [serverMeditationFinished, setServerMeditationFinished] = useState(false)
  /** Active questionnaire window, if any (server-calculated). */
  const [activeWindow, setActiveWindow] = useState(null)
  const [hasOpenedInActiveWindow, setHasOpenedInActiveWindow] = useState(false)
  const [lectureWatched, setLectureWatched] = useState(false)

  const isMeditationEnough = meditationMostlyPlayed || serverMeditationFinished
  const isWithinWindow = Boolean(activeWindow?.id)
  const questionnaireUnlocked = isWithinWindow && !hasOpenedInActiveWindow && isMeditationEnough

  useEffect(() => {
    fetchTodayMeditation()
    fetchTodayLecture()
  }, [])

  const refreshDailyLog = async () => {
    const token = getToken()
    if (!token) return
    try {
      const res = await callEdgeFunctionWithUser('daily-log-today', token)
      setServerMeditationFinished(res?.meditation_finished === true)
      setActiveWindow(res?.active_window ?? null)
      setHasOpenedInActiveWindow(res?.has_opened_in_active_window === true)
    } catch (err) {
      console.error('Failed to fetch today daily log:', err)
    }
  }

  useEffect(() => {
    refreshDailyLog()
  }, [])

  const fetchTodayMeditation = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await callEdgeFunction('meditation-today')
      
      if (response.meditation) {
        setMeditation(response.meditation)
      } else {
        setMeditation(null)
      }
    } catch (err) {
      console.error('Failed to fetch meditation:', err)
      setError(err.message || 'Impossibile caricare la meditazione di oggi')
    } finally {
      setLoading(false)
    }
  }

  const handleMeditationPlayStart = () => {
    setMeditationPlayed(true)
  }

  const handleMeditationMostlyPlayed = () => {
    setMeditationMostlyPlayed(true)
  }

  const fetchTodayLecture = async () => {
    try {
      setLectureLoading(true)
      setLectureError('')
      const response = await callEdgeFunction('lecture-today')
      
      if (response.lecture) {
        setLecture(response.lecture)
      } else {
        setLecture(null)
      }
    } catch (err) {
      console.error('Failed to fetch lecture:', err)
      setLectureError(err.message || 'Impossibile caricare il video della lezione')
    } finally {
      setLectureLoading(false)
    }
  }

  const handleLectureWatched = () => {
    setLectureWatched(true)
  }

  const handleQuestionnaireClick = async () => {
    if (!questionnaireUnlocked) return
    let qualtricsUrl = import.meta.env.VITE_QUALTRICS_SURVEY_URL
    if (!qualtricsUrl) {
      alert('URL del questionario non configurata')
      return
    }
    // Append Q_PopulateResponse to pre-fill the Codice question (see PHASE4_QUALTRICS.md)
    // Qualtrics requires the Question ID (e.g. QID1, QID2), NOT the export code "Codice".
    const personalCode = user?.personal_code
    const codiceQid = import.meta.env.VITE_QUALTRICS_CODICE_QID
    if (personalCode && codiceQid) {
      const [base, hash] = qualtricsUrl.split('#')
      const separator = base.includes('?') ? '&' : '?'
      const populateJson = JSON.stringify({ [codiceQid]: personalCode })
      const withQuery = `${base}${separator}Q_PopulateResponse=${encodeURIComponent(populateJson)}`
      qualtricsUrl = hash != null ? `${withQuery}#${hash}` : withQuery
      if (import.meta.env.DEV) {
        console.log('[Questionnaire] Pre-fill URL param added. QID:', codiceQid, '| Full URL (check in new tab):', qualtricsUrl)
      }
    } else if (import.meta.env.DEV) {
      if (!personalCode) console.warn('[Questionnaire] No personal_code on user – re-login may be needed. Not adding Q_PopulateResponse.')
      if (!codiceQid) console.warn('[Questionnaire] VITE_QUALTRICS_CODICE_QID not set. Set it to the question’s QID (e.g. QID5), not the export code "Codice".')
    }
    try {
      const token = getToken()
      if (token) {
        await callEdgeFunctionWithUser('logs-questionnaire-start', token)
      }
    } catch (err) {
      console.error('Failed to log questionnaire start:', err)
      alert(err?.message || 'Impossibile aprire il questionario in questo momento')
      await refreshDailyLog()
      return
    }
    window.open(qualtricsUrl, '_blank')
    await refreshDailyLog()
  }

  const handleLogout = () => {
    clearAuth()
    if (onLogout) onLogout()
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard del Corso di Meditazione Non Duale</h1>
        <div className="user-info">
          <span>Codice: {user?.personal_code ?? '—'}</span>
          <button onClick={handleLogout} className="logout-button">
            Esci
          </button>
        </div>
      </div>
      
      <div className="dashboard-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Caricamento della meditazione di oggi...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button onClick={fetchTodayMeditation} className="retry-button">
              Riprova
            </button>
          </div>
        ) : (
          <>
            <div className="meditation-section">
              <h2>Meditazione di oggi</h2>
              {meditation ? (
                <>
                  <AudioPlayer 
                    audioUrl={meditation.file_url} 
                    onPlayStart={handleMeditationPlayStart}
                    onMostlyPlayed={handleMeditationMostlyPlayed}
                  />
                  {meditationPlayed && (
                    <p className="success-message">✓ Sessione di meditazione avviata</p>
                  )}
                </>
              ) : (
                <div className="no-meditation">
                  <p>Nessuna meditazione disponibile.</p>
                  <p className="subtext">Contatta il responsabile del sito.</p>
                </div>
              )}
            </div>

            <div className="lecture-section">
              <h2>Video dell'ultima lezione</h2>
              {lectureLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Caricamento del video...</p>
                </div>
              ) : lectureError ? (
                <div className="error-state">
                  <p className="error-message">{lectureError}</p>
                  <button onClick={fetchTodayLecture} className="retry-button">
                    Riprova
                  </button>
                </div>
              ) : lecture ? (
                <>
                  <VideoPlayer 
                    videoUrl={lecture.file_url} 
                    onWatched={handleLectureWatched}
                  />
                  {lectureWatched && (
                    <p className="success-message">✓ Lezione guardata (50%+)</p>
                  )}
                </>
              ) : (
                <div className="no-lecture">
                  <p>Nessun video disponibile.</p>
                  <p className="subtext">Contatta il responsabile del sito.</p>
                </div>
              )}
            </div>

            <div className="questionnaire-section">
              <h2>Questionario giornaliero</h2>
              <button 
                onClick={handleQuestionnaireClick}
                className="questionnaire-button"
                disabled={!questionnaireUnlocked}
                title={
                  questionnaireUnlocked
                    ? 'Apri questionario'
                    : !isWithinWindow
                      ? 'Questionario non disponibile in questo momento'
                      : hasOpenedInActiveWindow
                        ? 'Hai già compilato il questionario per questa finestra'
                        : 'Svolgi la meditazione di oggi per sbloccare il questionario'
                }
              >
                Compila questionario
              </button>
              {!questionnaireUnlocked ? (
                <p className="section-description questionnaire-locked">
                  {!isWithinWindow ? (
                    'Il questionario non è disponibile in questo momento.'
                  ) : hasOpenedInActiveWindow ? (
                    'Hai già compilato il questionario per questa finestra.'
                  ) : (
                    "Ascolta il più possibile la meditazione di oggi (circa 90%) per sbloccare il questionario."
                  )}
                </p>
              ) : (
                <p className="section-description">
                  {serverMeditationFinished && !meditationMostlyPlayed
                    ? 'Hai completato la meditazione di oggi! Puoi aprire il questionario.'
                    : 'Fai clic sul pulsante sopra per aprire il questionario di oggi in una nuova finestra.'}
                </p>
              )}
              {activeWindow?.starts_at && activeWindow?.ends_at ? (
                <p className="section-description questionnaire-window">
                  Finestra attiva (Roma): {formatRomeDateTime(activeWindow.starts_at)} → {formatRomeDateTime(activeWindow.ends_at)}
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Dashboard
