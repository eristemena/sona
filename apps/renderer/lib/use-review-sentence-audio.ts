'use client'

import { useEffect, useRef, useState } from 'react'

import type { ReviewQueueCard, ReviewSentenceAudioAsset } from '@sona/domain/content/review-card'
import type { WindowSona } from '@sona/domain/contracts/window-sona'

function getReviewApi(): WindowSona['review'] | null {
  if (typeof window === 'undefined' || typeof window.sona === 'undefined') {
    return null
  }

  return window.sona.review
}

function getSettingsApi(): WindowSona['settings'] | null {
  if (typeof window === 'undefined' || typeof window.sona === 'undefined') {
    return null
  }

  return window.sona.settings
}

export function useReviewSentenceAudio(card: ReviewQueueCard | null, isFlipped: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)
  const [asset, setAsset] = useState<ReviewSentenceAudioAsset | null>(null)

  useEffect(() => {
    let active = true
    const settingsApi = getSettingsApi()

    if (!settingsApi) {
      return () => {
        active = false
      }
    }

    void settingsApi.getOpenAiApiKeyStatus().then((status) => {
      if (active) {
        setIsConfigured(status.configured)
      }
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    setAsset(null)
  }, [card?.front.id])

  useEffect(() => {
    if (!isConfigured || !isFlipped || !card?.back.sentenceContext) {
      return
    }

    const reviewApi = getReviewApi()
    if (!reviewApi) {
      return
    }

    let cancelled = false

    void reviewApi.ensureSentenceAudio({ reviewCardId: card.front.id }).then(async (nextAsset) => {
      if (cancelled) {
        return
      }

      setAsset(nextAsset)
      if (nextAsset.state === 'ready' && nextAsset.audioFilePath) {
        await playAudio(audioRef.current, nextAsset.audioFilePath)
      }
    })

    return () => {
      cancelled = true
    }
  }, [card?.back.sentenceContext, card?.front.id, isConfigured, isFlipped])

  const canReplay = asset?.state === 'ready' && Boolean(asset.audioFilePath)

  return {
    audioRef,
    isConfigured,
    canReplay,
    replay: async () => {
      if (!canReplay || !asset?.audioFilePath) {
        return
      }

      await playAudio(audioRef.current, asset.audioFilePath, true)
    },
  }
}

async function playAudio(audio: HTMLAudioElement | null, audioFilePath: string, restart = false) {
  if (!audio) {
    return
  }

  const normalizedSource = normalizeAudioSource(audioFilePath)
  if (!normalizedSource) {
    return
  }

  if (audio.src !== normalizedSource) {
    audio.src = normalizedSource
    audio.load()
  }

  if (restart) {
    audio.currentTime = 0
  }

  try {
    const result = audio.play()
    if (typeof result?.catch === 'function') {
      await result.catch(() => undefined)
    }
  } catch {
    return
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