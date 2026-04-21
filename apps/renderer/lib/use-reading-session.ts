'use client'

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { createDefaultReadingProgress, type ExposureLogEntry, type ReadingAudioAsset, type ReadingSessionProgress, type ReadingSessionSnapshot } from '@sona/domain/content'
import type { WindowSona } from '@sona/domain/contracts/window-sona'

const DEFAULT_READING_TTS_MODEL_ID = 'gpt-4o-mini-tts'

function getReadingApi(): WindowSona['reading'] | null {
  if (typeof window === 'undefined' || typeof window.sona === 'undefined') {
    return null
  }

  return window.sona.reading
}

function createUnavailableAudioAsset(blockId: string, failureMessage: string): ReadingAudioAsset {
  return {
    blockId,
    state: 'unavailable',
    audioFilePath: null,
    durationMs: null,
    modelId: DEFAULT_READING_TTS_MODEL_ID,
    voice: 'alloy',
    timings: [],
    failureMessage,
    fromCache: false,
  }
}

export function useReadingSession(contentItemId: string | null) {
  const [session, setSession] = useState<ReadingSessionSnapshot | null>(null)
  const [progress, setProgress] = useState<ReadingSessionProgress>(createDefaultReadingProgress())
  const [audioAsset, setAudioAsset] = useState<ReadingAudioAsset | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const progressRef = useRef(progress)
  const pendingExposureEntriesRef = useRef(new Map<string, ExposureLogEntry>())

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  const activeBlock = useMemo(
    () => session?.blocks.find((block) => block.id === progress.activeBlockId) ?? null,
    [progress.activeBlockId, session?.blocks],
  )

  useEffect(() => {
    let active = true
    const readingApi = getReadingApi()

    if (!contentItemId || !readingApi) {
      setSession(null)
      setAudioAsset(null)
      setProgress(createDefaultReadingProgress())
      setErrorMessage(contentItemId ? 'The desktop reading bridge is unavailable.' : null)
      setIsLoadingSession(false)
      return
    }

    setIsLoadingSession(true)
    setErrorMessage(null)

    void readingApi
      .getReadingSession(contentItemId)
      .then((snapshot) => {
        if (!active) {
          return
        }

        const activeBlockId = snapshot.progress.activeBlockId ?? snapshot.blocks[0]?.id ?? null

        startTransition(() => {
          setSession(snapshot)
          setProgress({
            activeBlockId,
            playbackState: snapshot.progress.playbackState,
            playbackRate: snapshot.progress.playbackRate,
            currentTimeMs: snapshot.progress.currentTimeMs,
            highlightedTokenIndex: snapshot.progress.highlightedTokenIndex,
          })
        })
      })
      .catch(() => {
        if (!active) {
          return
        }

        setSession(null)
        setAudioAsset(null)
        setProgress(createDefaultReadingProgress())
        setErrorMessage('The selected reading session could not be loaded.')
      })
      .finally(() => {
        if (active) {
          setIsLoadingSession(false)
        }
      })

    return () => {
      active = false
    }
  }, [contentItemId])

  useEffect(() => {
    let active = true
    const readingApi = getReadingApi()

    if (!contentItemId || !progress.activeBlockId) {
      setAudioAsset(null)
      setIsLoadingAudio(false)
      return
    }

    if (!readingApi) {
      setAudioAsset(createUnavailableAudioAsset(progress.activeBlockId, 'The desktop reading bridge is unavailable.'))
      setIsLoadingAudio(false)
      return
    }

    setIsLoadingAudio(true)

    void readingApi
      .ensureBlockAudio(progress.activeBlockId)
      .then((asset) => {
        if (active) {
          setAudioAsset(asset)
        }
      })
      .catch(() => {
        if (active) {
          setAudioAsset(createUnavailableAudioAsset(progress.activeBlockId!, 'Block audio could not be loaded. Reading stays in text-first mode.'))
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingAudio(false)
        }
      })

    return () => {
      active = false
    }
  }, [contentItemId, progress.activeBlockId])

  const flushPendingExposures = useCallback(() => {
    const readingApi = getReadingApi()
    if (!readingApi) {
      pendingExposureEntriesRef.current.clear()
      return
    }

    const entries = [...pendingExposureEntriesRef.current.values()]
    if (entries.length === 0) {
      return
    }

    pendingExposureEntriesRef.current.clear()
    void readingApi.flushExposureLog({ entries })
  }, [])

  useEffect(() => {
    return () => {
      if (!contentItemId) {
        return
      }

      const readingApi = getReadingApi()
      if (readingApi) {
        void readingApi.saveReadingProgress({
          contentItemId,
          ...progressRef.current,
        })
      }

      flushPendingExposures()
    }
  }, [contentItemId, flushPendingExposures])

  useEffect(() => {
    if (!activeBlock || progress.highlightedTokenIndex === null) {
      return
    }

    const token = activeBlock.tokens.find((entry) => entry.index === progress.highlightedTokenIndex)
    const tokenValue = token?.normalized?.trim() || token?.surface?.trim()
    if (!tokenValue) {
      return
    }

    const exposureKey = `${activeBlock.id}::${tokenValue}`
    if (pendingExposureEntriesRef.current.has(exposureKey)) {
      return
    }

    pendingExposureEntriesRef.current.set(exposureKey, {
      blockId: activeBlock.id,
      token: tokenValue,
      seenAt: Date.now(),
    })
  }, [activeBlock, progress.highlightedTokenIndex])

  function updateProgress(patch: Partial<ReadingSessionProgress>, options?: { persist?: boolean }) {
    setProgress((current) => {
      const next = { ...current, ...patch }
      progressRef.current = next

      if (options?.persist && contentItemId) {
        const readingApi = getReadingApi()
        if (readingApi) {
          void readingApi.saveReadingProgress({
            contentItemId,
            ...next,
          })
        }
      }

      return next
    })
  }

  function selectBlock(blockId: string, options?: { persist?: boolean }) {
    if (progressRef.current.activeBlockId === blockId) {
      if (options?.persist) {
        persistProgress()
      }
      return
    }

    updateProgress(
      {
        activeBlockId: blockId,
        playbackState: 'idle',
        currentTimeMs: 0,
        highlightedTokenIndex: null,
      },
      { persist: options?.persist ?? true },
    )
  }

  function persistProgress(patch?: Partial<ReadingSessionProgress>) {
    if (!contentItemId) {
      return
    }

    const next = { ...progressRef.current, ...patch }
    progressRef.current = next
    setProgress(next)

    const readingApi = getReadingApi()
    if (readingApi) {
      void readingApi.saveReadingProgress({
        contentItemId,
        ...next,
      })
    }
  }

  function refreshActiveBlockAudio() {
    const readingApi = getReadingApi()
    if (!readingApi || !progress.activeBlockId) {
      return
    }

    setIsLoadingAudio(true)
    void readingApi
      .ensureBlockAudio(progress.activeBlockId)
      .then((asset) => {
        setAudioAsset(asset)
      })
      .catch(() => {
        setAudioAsset(createUnavailableAudioAsset(progress.activeBlockId!, 'Block audio could not be loaded. Reading stays in text-first mode.'))
      })
      .finally(() => {
        setIsLoadingAudio(false)
      })
  }

  function closeSession() {
    persistProgress()
    flushPendingExposures()
  }

  return {
    session,
    progress,
    audioAsset,
    activeBlock,
    isLoadingSession,
    isLoadingAudio,
    errorMessage,
    updateProgress,
    persistProgress,
    selectBlock,
    refreshActiveBlockAudio,
    closeSession,
  }
}