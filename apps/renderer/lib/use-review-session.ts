'use client'

import { useEffect, useRef, useState } from 'react'

import type { ReviewQueueCard, ReviewRating } from '@sona/domain/content'
import type { WindowSona } from '@sona/domain/contracts/window-sona'

import { useReviewQueue } from './use-review-queue'

function getReviewApi(): WindowSona['review'] | null {
  if (typeof window === 'undefined' || typeof window.sona === 'undefined') {
    return null
  }

  return window.sona.review
}

export function useReviewSession(limit = 50) {
  const { snapshot, isLoading, errorMessage, refresh } = useReviewQueue(limit)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [isUpdatingKnownWord, setIsUpdatingKnownWord] = useState(false)
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null)
  const [undoKnownWord, setUndoKnownWord] = useState<{
    canonicalForm: string
    reviewCardId: string
    surface: string
  } | null>(null)
  const preserveFlipAfterRefreshRef = useRef(false)

  useEffect(() => {
    setCurrentIndex(0)
    setIsFlipped(preserveFlipAfterRefreshRef.current)
    preserveFlipAfterRefreshRef.current = false
  }, [snapshot?.generatedAt])

  const cards = snapshot?.cards ?? []
  const currentCard: ReviewQueueCard | null = cards[currentIndex] ?? null

  async function submitRating(rating: ReviewRating) {
    if (!currentCard) {
      return
    }

    const reviewApi = getReviewApi()
    if (!reviewApi) {
      setSubmissionMessage('The desktop review bridge is unavailable.')
      return
    }

    setIsSubmitting(true)
    setSubmissionMessage(null)

    try {
      const result = await reviewApi.submitRating({
        reviewCardId: currentCard.front.id,
        rating,
      })
      await refresh()
      setSubmissionMessage(`Saved ${rating}. Next review in ${result.scheduledDays} day${result.scheduledDays === 1 ? '' : 's'}.`)
    } catch {
      setSubmissionMessage('The rating could not be saved right now.')
    } finally {
      setIsSubmitting(false)
      setIsFlipped(false)
    }
  }

  async function saveCardDetails(input: {
    meaning: string | null
    grammarPattern: string | null
    grammarDetails: string | null
  }) {
    if (!currentCard) {
      return
    }

    const reviewApi = getReviewApi()
    if (!reviewApi) {
      setSubmissionMessage('The desktop review bridge is unavailable.')
      return
    }

    setIsSavingDetails(true)
    setSubmissionMessage(null)

    try {
      preserveFlipAfterRefreshRef.current = true
      await reviewApi.updateCardDetails({
        reviewCardId: currentCard.front.id,
        meaning: input.meaning,
        grammarPattern: input.grammarPattern,
        grammarDetails: input.grammarDetails,
      })
      await refresh()
      setSubmissionMessage('Saved review details for this card.')
    } catch {
      setSubmissionMessage('The card details could not be saved right now.')
    } finally {
      setIsSavingDetails(false)
    }
  }

  async function markCurrentCardKnown() {
    if (!currentCard) {
      return
    }

    const reviewApi = getReviewApi()
    if (!reviewApi) {
      setSubmissionMessage('The desktop review bridge is unavailable.')
      return
    }

    setIsUpdatingKnownWord(true)
    setSubmissionMessage(null)

    try {
      await reviewApi.markKnownWord({
        canonicalForm: currentCard.front.canonicalForm,
        surface: currentCard.front.surface,
        source: 'manual',
        sourceDetail: 'Marked from review.',
        reviewCardId: currentCard.front.id,
      })
      setUndoKnownWord({
        canonicalForm: currentCard.front.canonicalForm,
        reviewCardId: currentCard.front.id,
        surface: currentCard.front.surface,
      })
      await refresh()
      setSubmissionMessage(`Marked ${currentCard.front.surface} as known.`)
    } catch {
      setSubmissionMessage('The known-word update could not be saved right now.')
    } finally {
      setIsUpdatingKnownWord(false)
      setIsFlipped(false)
    }
  }

  async function undoMarkKnownWord() {
    if (!undoKnownWord) {
      return
    }

    const reviewApi = getReviewApi()
    if (!reviewApi) {
      setSubmissionMessage('The desktop review bridge is unavailable.')
      return
    }

    setIsUpdatingKnownWord(true)
    setSubmissionMessage(null)

    try {
      await reviewApi.clearKnownWord({
        canonicalForm: undoKnownWord.canonicalForm,
        reviewCardId: undoKnownWord.reviewCardId,
      })
      await refresh()
      setSubmissionMessage(`Restored ${undoKnownWord.surface} to review.`)
      setUndoKnownWord(null)
    } catch {
      setSubmissionMessage('The known-word status could not be cleared right now.')
    } finally {
      setIsUpdatingKnownWord(false)
    }
  }

  return {
    snapshot,
    cards,
    currentCard,
    currentIndex,
    cardsRemaining: cards.length,
    isLoading,
    errorMessage,
    isFlipped,
    isSubmitting,
    isSavingDetails,
    isUpdatingKnownWord,
    submissionMessage,
    undoKnownWord,
    revealAnswer: () => setIsFlipped(true),
    markCurrentCardKnown,
    saveCardDetails,
    submitRating,
    undoMarkKnownWord,
    refresh,
  }
}