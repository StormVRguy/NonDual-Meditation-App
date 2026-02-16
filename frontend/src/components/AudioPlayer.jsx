import { useState, useRef, useEffect } from 'react'
import { callEdgeFunctionWithUser } from '../api/client'
import { getToken } from '../utils/auth'
import './AudioPlayer.css'

// Percentage of audio (by seconds played) required to unlock the questionnaire
const MOSTLY_PLAYED_THRESHOLD = 90

// Max delta we consider "natural" play (seconds). Larger = seek, don't count.
const MAX_NATURAL_DELTA = 1.5

function AudioPlayer({ audioUrl, onPlayStart, onMostlyPlayed }) {
  const audioRef = useRef(null)
  const mostlyPlayedFired = useRef(false)
  const totalSecondsPlayedRef = useRef(0)
  const lastCurrentTimeRef = useRef(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [hasLogged, setHasLogged] = useState(false)
  const [secondsPlayed, setSecondsPlayed] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateDuration = () => setDuration(audio.duration)
    audio.addEventListener('loadedmetadata', updateDuration)

    return () => {
      audio.removeEventListener('loadedmetadata', updateDuration)
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      const time = audio.currentTime
      const dur = audio.duration
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

    audio.addEventListener('timeupdate', updateTime)
    return () => audio.removeEventListener('timeupdate', updateTime)
  }, [isPlaying])

  // Sync lastCurrentTime when not playing (e.g. after seek)
  useEffect(() => {
    if (!isPlaying) {
      const audio = audioRef.current
      if (audio) lastCurrentTimeRef.current = audio.currentTime
    }
  }, [isPlaying, currentTime])

  // Check if 90% of duration has been played (by seconds) — same condition as questionnaire unlock
  useEffect(() => {
    const dur = duration
    if (dur <= 0) return
    const total = totalSecondsPlayedRef.current
    const required = (dur * MOSTLY_PLAYED_THRESHOLD) / 100
    if (total >= required && !mostlyPlayedFired.current) {
      mostlyPlayedFired.current = true
      const token = getToken()
      if (token) {
        callEdgeFunctionWithUser('logs-meditation-finished', token).catch((err) =>
          console.error('Failed to log meditation finished:', err)
        )
      }
      if (onMostlyPlayed) onMostlyPlayed()
    }
  }, [duration, secondsPlayed, onMostlyPlayed])

  const handlePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (!hasLogged) {
        const token = getToken()
        if (token) {
          try {
            await callEdgeFunctionWithUser('logs-meditation-start', token)
            setHasLogged(true)
            if (onPlayStart) onPlayStart()
          } catch (error) {
            console.error('Failed to log meditation start:', error)
          }
        }
      }
      lastCurrentTimeRef.current = audio.currentTime
      await audio.play()
      setIsPlaying(true)
    } catch (error) {
      console.error('Failed to play audio:', error)
    }
  }

  const handlePause = () => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      setIsPlaying(false)
    }
  }

  const handleSeek = (e) => {
    const audio = audioRef.current
    if (audio) {
      const newTime = (e.target.value / 100) * duration
      audio.currentTime = newTime
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

  if (!audioUrl) {
    return (
      <div className="audio-player-empty">
        <p>No meditation available</p>
      </div>
    )
  }

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => {
          setIsPlaying(false)
          const audio = audioRef.current
          if (audio && audio.duration > 0) {
            totalSecondsPlayedRef.current = audio.duration
            setSecondsPlayed(audio.duration)
          }
        }}
      />
      <div className="audio-controls">
        <button
          className="play-pause-button"
          onClick={isPlaying ? handlePause : handlePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div className="audio-progress">
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
    </div>
  )
}

export default AudioPlayer
