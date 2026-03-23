import { useState, useRef, useEffect } from 'react'
import { callEdgeFunctionWithUser } from '../api/client'
import { getToken } from '../utils/auth'
import './VideoPlayer.css'

// Percentage of video (by seconds played) required to mark as watched
const WATCHED_THRESHOLD = 50

// Max delta we consider "natural" play (seconds). Larger = seek, don't count.
const MAX_NATURAL_DELTA = 1.5

function VideoPlayer({ videoUrl, onWatched }) {
  const videoRef = useRef(null)
  const watchedFired = useRef(false)
  const totalSecondsPlayedRef = useRef(0)
  const lastCurrentTimeRef = useRef(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [secondsPlayed, setSecondsPlayed] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateDuration = () => setDuration(video.duration)
    video.addEventListener('loadedmetadata', updateDuration)

    return () => {
      video.removeEventListener('loadedmetadata', updateDuration)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => {
      const time = video.currentTime
      const dur = video.duration
      setCurrentTime(time)

      // Only count seconds actually played (while playing), ignore seeks
      if (isPlaying && dur > 0) {
        const last = lastCurrentTimeRef.current
        const delta = time - last
        lastCurrentTimeRef.current = time

        if (delta > 0 && delta <= MAX_NATURAL_DELTA) {
          totalSecondsPlayedRef.current += delta
          setSecondsPlayed(totalSecondsPlayedRef.current)
        }
      } else {
        lastCurrentTimeRef.current = time
      }
    }

    video.addEventListener('timeupdate', updateTime)
    return () => video.removeEventListener('timeupdate', updateTime)
  }, [isPlaying])

  // Sync lastCurrentTime when not playing (e.g. after seek)
  useEffect(() => {
    if (!isPlaying) {
      const video = videoRef.current
      if (video) lastCurrentTimeRef.current = video.currentTime
    }
  }, [isPlaying, currentTime])

  // Check if 50% of duration has been played (by seconds)
  useEffect(() => {
    const dur = duration
    if (dur <= 0) return
    const total = totalSecondsPlayedRef.current
    const required = (dur * WATCHED_THRESHOLD) / 100
    if (total >= required && !watchedFired.current) {
      watchedFired.current = true
      const token = getToken()
      if (token) {
        callEdgeFunctionWithUser('logs-lecture-watched', token).catch((err) =>
          console.error('Failed to log lecture watched:', err)
        )
      }
      if (onWatched) onWatched()
    }
  }, [duration, secondsPlayed, onWatched])

  const handlePlay = async () => {
    const video = videoRef.current
    if (!video) return

    try {
      lastCurrentTimeRef.current = video.currentTime
      await video.play()
      setIsPlaying(true)
    } catch (error) {
      console.error('Failed to play video:', error)
    }
  }

  const handlePause = () => {
    const video = videoRef.current
    if (video) {
      video.pause()
      setIsPlaying(false)
    }
  }

  const handleSeek = (e) => {
    const video = videoRef.current
    if (video) {
      const newTime = (e.target.value / 100) * duration
      video.currentTime = newTime
      setCurrentTime(newTime)
      lastCurrentTimeRef.current = newTime
    }
  }

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!videoUrl) {
    return (
      <div className="video-player-empty">
        <p>Nessun video della lezione disponibile</p>
      </div>
    )
  }

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        src={videoUrl}
        className="video-element"
        onEnded={() => {
          setIsPlaying(false)
          const video = videoRef.current
          if (video && video.duration > 0) {
            totalSecondsPlayedRef.current = video.duration
            setSecondsPlayed(video.duration)
          }
        }}
      />
      <div className="video-controls">
        <button
          className="play-pause-button"
          onClick={isPlaying ? handlePause : handlePlay}
          aria-label={isPlaying ? 'Pausa' : 'Riproduci'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div className="video-progress">
          <input
            type="range"
            min="0"
            max="100"
            value={duration ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            className="progress-bar"
          />
          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
      {watchedFired.current && (
        <p className="success-message">✓ Lezione video guardata (50%+)</p>
      )}
    </div>
  )
}

export default VideoPlayer
