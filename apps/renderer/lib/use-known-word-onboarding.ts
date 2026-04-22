'use client'

import { useEffect, useState } from 'react'

import { KNOWN_WORD_SEED_PACKS_BY_ID } from '@sona/domain/content/known-word-seeds'
import type { KnownWordOnboardingStatus } from '@sona/domain/contracts/content-review'
import type { WindowSona } from '@sona/domain/contracts/window-sona'

function getReviewApi(): WindowSona['review'] | null {
  if (typeof window === 'undefined' || typeof window.sona === 'undefined') {
    return null
  }

  return window.sona.review
}

function createFallbackStatus(): KnownWordOnboardingStatus {
  return {
    shouldOnboard: false,
    completedAt: null,
    availableSeedPacks: [],
  }
}

function normalizeStatus(value: unknown): KnownWordOnboardingStatus {
  if (!value || typeof value !== 'object') {
    return createFallbackStatus()
  }

  const candidate = value as Partial<KnownWordOnboardingStatus>
  return {
    shouldOnboard: candidate.shouldOnboard === true,
    completedAt: typeof candidate.completedAt === 'number' ? candidate.completedAt : null,
    availableSeedPacks: Array.isArray(candidate.availableSeedPacks) ? candidate.availableSeedPacks : [],
  }
}

export function useKnownWordOnboarding() {
  const [status, setStatus] = useState<KnownWordOnboardingStatus>(createFallbackStatus())
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const reviewApi = getReviewApi()
    if (!reviewApi || typeof reviewApi.getKnownWordOnboardingStatus !== 'function') {
      setStatus(createFallbackStatus())
      setIsLoading(false)
      return () => {
        active = false
      }
    }

    void Promise.resolve(reviewApi.getKnownWordOnboardingStatus())
      .then((nextStatus) => {
        if (!active) {
          return
        }

        setStatus(normalizeStatus(nextStatus))
      })
      .catch(() => {
        if (!active) {
          return
        }

        setStatus(createFallbackStatus())
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  async function completeSeedPack(seedPackId: string) {
    const reviewApi = getReviewApi()
    const seedPack = KNOWN_WORD_SEED_PACKS_BY_ID.get(seedPackId)
    const seedPackSummary = status.availableSeedPacks.find((pack) => pack.id === seedPackId)

    if (!reviewApi || typeof reviewApi.completeKnownWordOnboarding !== 'function' || !seedPack || !seedPackSummary) {
      setErrorMessage('The known-word onboarding step is unavailable right now.')
      return
    }

    setIsCompleting(true)
    setMessage(null)
    setErrorMessage(null)

    try {
      const result = await reviewApi.completeKnownWordOnboarding({
        seedPackId,
        selectedWords: seedPack.words,
      })

      setStatus((current) => ({
        ...current,
        shouldOnboard: false,
        completedAt: result.onboardingCompletedAt,
      }))
      setMessage(`Added ${result.insertedCount} known words from ${seedPackSummary.label}.`)
    } catch {
      setErrorMessage('The known-word onboarding selection could not be saved right now.')
    } finally {
      setIsCompleting(false)
    }
  }

  return {
    status,
    isLoading,
    isCompleting,
    message,
    errorMessage,
    completeSeedPack,
  }
}