import { useState, useEffect } from 'react'
import { getUser, clearAuth, getToken } from '../utils/auth'
import { callEdgeFunction, callEdgeFunctionWithUser } from '../api/client'
import AudioPlayer from '../components/AudioPlayer'
import VideoPlayer from '../components/VideoPlayer'
import './Dashboard.css'

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
  const [lectureWatched, setLectureWatched] = useState(false)

  const questionnaireUnlocked = meditationMostlyPlayed || serverMeditationFinished

  useEffect(() => {
    fetchTodayMeditation()
    fetchTodayLecture()
  }, [])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    callEdgeFunctionWithUser('daily-log-today', token)
      .then((res) => {
        if (res?.meditation_finished === true) {
          setServerMeditationFinished(true)
        }
      })
      .catch((err) => console.error('Failed to fetch today daily log:', err))
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
      setError(err.message || 'Failed to load today\'s meditation')
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
      setLectureError(err.message || 'Failed to load lecture video')
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
      alert('Questionnaire URL not configured')
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
    }
    window.open(qualtricsUrl, '_blank')
  }

  const handleLogout = () => {
    clearAuth()
    if (onLogout) onLogout()
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Meditation Training Dashboard</h1>
        <div className="user-info">
          <span>Codice: {user?.personal_code ?? '—'}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
      
      <div className="dashboard-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading today's meditation...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button onClick={fetchTodayMeditation} className="retry-button">
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="meditation-section">
              <h2>Today's Meditation</h2>
              {meditation ? (
                <>
                  <AudioPlayer 
                    audioUrl={meditation.file_url} 
                    onPlayStart={handleMeditationPlayStart}
                    onMostlyPlayed={handleMeditationMostlyPlayed}
                  />
                  {meditationPlayed && (
                    <p className="success-message">✓ Meditation session started</p>
                  )}
                </>
              ) : (
                <div className="no-meditation">
                  <p>No meditation is available.</p>
                  <p className="subtext">Please contact your administrator.</p>
                </div>
              )}
            </div>

            <div className="lecture-section">
              <h2>Latest Video Lecture</h2>
              {lectureLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading lecture video...</p>
                </div>
              ) : lectureError ? (
                <div className="error-state">
                  <p className="error-message">{lectureError}</p>
                  <button onClick={fetchTodayLecture} className="retry-button">
                    Retry
                  </button>
                </div>
              ) : lecture ? (
                <>
                  <VideoPlayer 
                    videoUrl={lecture.file_url} 
                    onWatched={handleLectureWatched}
                  />
                  {lectureWatched && (
                    <p className="success-message">✓ Lecture watched (50%+)</p>
                  )}
                </>
              ) : (
                <div className="no-lecture">
                  <p>No lecture video is available.</p>
                  <p className="subtext">Please contact your administrator.</p>
                </div>
              )}
            </div>

            <div className="questionnaire-section">
              <h2>Daily Questionnaire</h2>
              <button 
                onClick={handleQuestionnaireClick}
                className="questionnaire-button"
                disabled={!questionnaireUnlocked}
                title={questionnaireUnlocked ? 'Open questionnaire' : 'Listen to most of the meditation first'}
              >
                Complete Questionnaire
              </button>
              {!questionnaireUnlocked ? (
                <p className="section-description questionnaire-locked">
                  Listen to most of today's meditation (about 90%) to unlock the questionnaire.
                </p>
              ) : (
                <p className="section-description">
                  {serverMeditationFinished && !meditationMostlyPlayed
                    ? "Today's meditation is already recorded. You can open the questionnaire."
                    : 'Click the button above to open today\'s questionnaire in a new window.'}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Dashboard
