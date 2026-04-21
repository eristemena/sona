'use client'

import { useEffect, useRef, useState } from 'react'

import type { ReadingPlaybackState } from '@sona/domain/content'

interface UseReadingPlaybackOptions {
  audioFilePath: string | null
  initialTimeMs: number
  playbackRate: number
  fallbackDurationMs: number | null
  onTimeChange: (currentTimeMs: number) => void
  onPlaybackStateChange: (state: ReadingPlaybackState) => void
}

export function useReadingPlayback(options: UseReadingPlaybackOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [durationMs, setDurationMs] = useState<number>(options.fallbackDurationMs ?? 0)
  const playableAudioSrc = normalizeAudioSource(options.audioFilePath)

  useEffect(() => {
    setDurationMs(options.fallbackDurationMs ?? 0)
  }, [options.fallbackDurationMs])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) {
      return
    }

    audio.pause()
    audio.load()
  }, [playableAudioSrc])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDurationMs(Math.round(audio.duration * 1000))
      }

      if (options.initialTimeMs > 0) {
        audio.currentTime = options.initialTimeMs / 1000
      }

      audio.playbackRate = options.playbackRate
    }

    const handleTimeUpdate = () => {
      options.onTimeChange(Math.round(audio.currentTime * 1000))
    }

    const handlePlay = () => {
      options.onPlaybackStateChange('playing')
    }

    const handlePause = () => {
      if (audio.ended) {
        return
      }

      options.onPlaybackStateChange('paused')
    }

    const handleEnded = () => {
      options.onTimeChange(0)
      options.onPlaybackStateChange('ended')
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [options])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = options.playbackRate
    }
  }, [options.playbackRate])

  async function play() {
    const audio = audioRef.current
    if (!audio || !playableAudioSrc) {
      return
    }

    options.onPlaybackStateChange('buffering')

    try {
      const result = audio.play()
      if (typeof result?.catch === 'function') {
        await result.catch(() => undefined)
      }
    } catch {
      options.onPlaybackStateChange('paused')
    }
  }

  function pause() {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.pause()
  }

  function replay() {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.currentTime = 0
    options.onTimeChange(0)
    void play()
  }

  function seek(nextTimeMs: number) {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.currentTime = Math.max(0, nextTimeMs) / 1000
    options.onTimeChange(Math.max(0, nextTimeMs))
  }

  return {
    audioRef,
    durationMs,
    playableAudioSrc,
    play,
    pause,
    replay,
    seek,
  }
}

function normalizeAudioSource(audioFilePath: string | null): string | null {
  if (!audioFilePath) {
    return null
  }

  if (/^(file|https?|blob|data):/i.test(audioFilePath)) {
    return audioFilePath
  }

  if (audioFilePath.startsWith('/')) {
    return `file://${encodeURI(audioFilePath)}`
  }

  if (/^[A-Za-z]:[\\/]/.test(audioFilePath)) {
    return `file:///${encodeURI(audioFilePath.replace(/\\/g, '/'))}`
  }

  return audioFilePath
}