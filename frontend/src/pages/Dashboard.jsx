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

/** Full survey URL including Q_PopulateResponse when configured (same as opening from the dashboard). */
function buildQuestionnaireUrl(questionnaireSurveyUrl, user) {
  let qualtricsUrl = questionnaireSurveyUrl || import.meta.env.VITE_QUALTRICS_SURVEY_URL
  if (!qualtricsUrl) return null
  const personalCode = user?.personal_code
  const codiceQid = import.meta.env.VITE_QUALTRICS_CODICE_QID
  if (personalCode && codiceQid) {
    const [base, hash] = qualtricsUrl.split('#')
    const separator = base.includes('?') ? '&' : '?'
    const populateJson = JSON.stringify({ [codiceQid]: personalCode })
    const withQuery = `${base}${separator}Q_PopulateResponse=${encodeURIComponent(populateJson)}`
    qualtricsUrl = hash != null ? `${withQuery}#${hash}` : withQuery
  }
  return qualtricsUrl
}

function DefaultIntroContent() {
  return (
    <div className="daily-practices">
      <h3>I file delle meditazioni e delle lezioni sono disponibili il giorno dopo la sessione in presenza</h3>
      <h3 style={{ color: 'red' }}>In caso di mancata partecipazione in presenza, si è pregati di recuperare la lezione (guardandola interamente) entro il giorno successivo.</h3>
      <h2>PRATICHE QUOTIDIANE</h2>
      <ul className="daily-practices-list">
        <li>
          <strong>MEDITAZIONE FORMALE</strong>: Ogni giorno, praticare la meditazione seduta sul respiro, seguendo la traccia audio. Talvolta (massimo due volte) è possibile sostituirla con la meditazione distesa del body-scan, seguendo la traccia audio.
        </li>
        <li>
          <strong>MEDITAZIONE INFORMALE</strong>: Durante la giornata, concedersi qualche momento di consapevolezza - 2 o 3 minuti, anche piu volte - per lasciare andare ogni pensiero e attivita, e prendere consapevolezza di corpo, respiro, stato d’animo e ambiente circostante. E importante concentrarsi sull’atteggiamento di ascolto, cura e disponibilita verso la propria condizione (interna ed esterna). Si suggerisce anche di usare il respiro come asse attorno al quale «radunare la consapevolezza», dando cosi continuita alla pratica formale.
        </li>
        <li>
          <strong>TASK CONTEMPLATIVO</strong>: Prova a interrogarti sulla natura dei fenomeni dischiusi dalla percezione, come suoni e colori: dove hanno luogo veramente? Prova a porti seriamente questa domanda, esplorandone le possibili risposte e le relative implicazioni. Non limitarti a una riflessione intellettuale: scopri se questo genere di indagine ha un impatto sul modo in cui concepisci la realta che ti circonda.
        </li>
      </ul>
    </div>
  )
}

function Dashboard({
  onLogout,
  pageTitle = 'Dashboard del Corso di Meditazione Non Duale',
  introContent = null,
  additionalContent = null,
  showBodyScanMeditation = true,
  questionnaireSurveyUrl = null,
}) {
  const user = getUser()
  const [meditation, setMeditation] = useState(null)
  const [additionalMeditation, setAdditionalMeditation] = useState(null)
  const [lecture, setLecture] = useState(null)
  const [additionalLecture, setAdditionalLecture] = useState(null)
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
  // Button should stay clickable for the whole active window (as long as meditation is enough),
  // even if the user already opened it in this window.
  const questionnaireClickable = isWithinWindow && isMeditationEnough
  const questionnaireHref = buildQuestionnaireUrl(questionnaireSurveyUrl, user)

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
      const token = getToken()
      const response = token
        ? await callEdgeFunctionWithUser('meditation-today', token)
        : await callEdgeFunction('meditation-today')
      
      if (response.meditation) {
        setMeditation(response.meditation)
      } else {
        setMeditation(null)
      }
      setAdditionalMeditation(response.additional_meditation ?? null)
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
      const token = getToken()
      const response = token
        ? await callEdgeFunctionWithUser('lecture-today', token)
        : await callEdgeFunction('lecture-today')
      
      if (response.lecture) {
        setLecture(response.lecture)
      } else {
        setLecture(null)
      }
      setAdditionalLecture(response.additional_lecture ?? null)
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
    if (!questionnaireClickable) return
    const qualtricsUrl = buildQuestionnaireUrl(questionnaireSurveyUrl, user)
    if (!qualtricsUrl) {
      alert('URL del questionario non configurata')
      return
    }
    if (import.meta.env.DEV) {
      const personalCode = user?.personal_code
      const codiceQid = import.meta.env.VITE_QUALTRICS_CODICE_QID
      if (personalCode && codiceQid) {
        console.log('[Questionnaire] Pre-fill URL param added. QID:', codiceQid, '| Full URL (check in new tab):', qualtricsUrl)
      } else {
        if (!personalCode) console.warn('[Questionnaire] No personal_code on user – re-login may be needed. Not adding Q_PopulateResponse.')
        if (!codiceQid) console.warn('[Questionnaire] VITE_QUALTRICS_CODICE_QID not set. Set it to the question’s QID (e.g. QID5), not the export code "Codice".')
      }
    }
    // If already opened in this active window, allow reopening without logging again
    // (server enforces 1 open per window).
    if (!hasOpenedInActiveWindow) {
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
    }
    window.open(qualtricsUrl, '_blank')
    await refreshDailyLog()
  }

  const handleLogout = () => {
    clearAuth()
    if (onLogout) onLogout()
  }

  const hasMainMeditation = Boolean(meditation?.file_url)
  const hasAdditionalMeditation = Boolean(showBodyScanMeditation && additionalMeditation?.file_url)
  const hasAnyMeditationAudio = hasMainMeditation || hasAdditionalMeditation

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>{pageTitle}</h1>
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
            {introContent ?? <DefaultIntroContent />}
            {additionalContent}

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
                  {showBodyScanMeditation && additionalMeditation?.file_url ? (
                    <>
                      <h3>Body scan - da fare massimo due volte entro la prossima sessione in presenza</h3>
                      <AudioPlayer
                        audioUrl={additionalMeditation.file_url}
                        onPlayStart={handleMeditationPlayStart}
                        onMostlyPlayed={handleMeditationMostlyPlayed}
                      />
                    </>
                  ) : null}
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

            {additionalLecture?.file_url ? (
              <div className="lecture-section">
                <h2>Discussione finale e spiegazione del task contemplativo</h2>
                <VideoPlayer
                  videoUrl={additionalLecture.file_url}
                  logWatchEvent={false}
                  showWatchedMessage={false}
                />
              </div>
            ) : null}

            <div className="questionnaire-section">
              <h2>Questionario giornaliero</h2>
              <button 
                onClick={handleQuestionnaireClick}
                className="questionnaire-button"
                disabled={!questionnaireClickable}
                title={
                  questionnaireClickable
                    ? 'Apri questionario'
                    : !isWithinWindow
                      ? 'Questionario non disponibile in questo momento'
                      : 'Svolgi la meditazione di oggi per sbloccare il questionario'
                }
              >
                Compila questionario
              </button>
              {questionnaireHref && isWithinWindow ? (
                <p className="questionnaire-url-wrap">
                  <a
                    href={questionnaireHref}
                    className="questionnaire-url-link"
                    {...(questionnaireClickable
                      ? {
                          onClick: (e) => {
                            e.preventDefault()
                            void handleQuestionnaireClick()
                          },
                        }
                      : {
                          target: '_blank',
                          rel: 'noopener noreferrer',
                        })}
                  >
                    {questionnaireHref}
                  </a>
                </p>
              ) : null}
              {!questionnaireClickable ? (
                <p className="section-description questionnaire-locked">
                  {!isWithinWindow ? (
                    'Il questionario non è disponibile in questo momento.'
                  ) : (
                    "Svolgi la meditazione giornaliera per sbloccare il questionario."
                  )}
                </p>
              ) : (
                <p className="section-description">
                  {hasOpenedInActiveWindow
                    ? 'Hai già compilato il questionario per questa finestra. Puoi comunque riaprirlo finché la finestra è attiva.'
                    : serverMeditationFinished && !meditationMostlyPlayed
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
