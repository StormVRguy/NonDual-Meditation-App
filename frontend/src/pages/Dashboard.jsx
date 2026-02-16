import { useState, useEffect } from 'react'
import { getUser, clearAuth, getToken } from '../utils/auth'
import { callEdgeFunction, callEdgeFunctionWithUser } from '../api/client'
import AudioPlayer from '../components/AudioPlayer'
import './Dashboard.css'

function Dashboard({ onLogout }) {
  const user = getUser()
  const [meditation, setMeditation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [meditationPlayed, setMeditationPlayed] = useState(false)
  const [meditationMostlyPlayed, setMeditationMostlyPlayed] = useState(false)

  useEffect(() => {
    fetchTodayMeditation()
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

  const handleQuestionnaireClick = async () => {
    if (!meditationMostlyPlayed) return
    const qualtricsUrl = import.meta.env.VITE_QUALTRICS_SURVEY_URL
    if (!qualtricsUrl) {
      alert('Questionnaire URL not configured')
      return
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
          <span>Welcome, {user?.email}</span>
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

            <div className="questionnaire-section">
              <h2>Daily Questionnaire</h2>
              <button 
                onClick={handleQuestionnaireClick}
                className="questionnaire-button"
                disabled={!meditationMostlyPlayed}
                title={meditationMostlyPlayed ? 'Open questionnaire' : 'Listen to most of the meditation first'}
              >
                Complete Questionnaire
              </button>
              {!meditationMostlyPlayed ? (
                <p className="section-description questionnaire-locked">
                  Listen to most of today's meditation (about 90%) to unlock the questionnaire.
                </p>
              ) : (
                <p className="section-description">
                  Click the button above to open today's questionnaire in a new window.
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
