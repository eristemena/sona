'use client'

import { startTransition, useEffect, useState } from 'react'

import type { ReviewQueueSnapshot } from '@sona/domain/content'
import type { WindowSona } from '@sona/domain/contracts/window-sona'

function getReviewApi(): WindowSona['review'] | null {
  if (typeof window === 'undefined' || typeof window.sona === 'undefined') {
    return null
  }

  return window.sona.review
}

export function useReviewQueue(limit = 50) {
  const [snapshot, setSnapshot] = useState<ReviewQueueSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadQueue() {
      const reviewApi = getReviewApi()
      if (!reviewApi) {
        if (active) {
          setSnapshot(null)
          setErrorMessage('The desktop review bridge is unavailable.')
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const nextSnapshot = await reviewApi.getQueue(limit)
        if (!active) {
          return
        }

        startTransition(() => {
          setSnapshot(nextSnapshot)
        })
      } catch {
        if (active) {
          setSnapshot(null)
          setErrorMessage('The daily review queue could not be loaded.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadQueue()

    return () => {
      active = false
    }
  }, [limit])

  async function refresh() {
    const reviewApi = getReviewApi()
    if (!reviewApi) {
      setSnapshot(null)
      setErrorMessage('The desktop review bridge is unavailable.')
      setIsLoading(false)
      return null
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const nextSnapshot = await reviewApi.getQueue(limit)
      startTransition(() => {
        setSnapshot(nextSnapshot)
      })
      return nextSnapshot
    } catch {
      setSnapshot(null)
      setErrorMessage('The daily review queue could not be loaded.')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    snapshot,
    isLoading,
    errorMessage,
    refresh,
  }
}