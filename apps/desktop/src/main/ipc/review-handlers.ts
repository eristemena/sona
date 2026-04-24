import { ipcMain } from 'electron'

import type { SubmitReviewRatingInput } from '@sona/domain/content/review-card'
import { REVIEW_CHANNELS } from '@sona/domain/contracts/content-review'

import { DailyReviewService } from '../content/daily-review-service.js'
import { KnownWordOnboardingService } from '../content/known-word-onboarding-service.js'
import { KnownWordService } from '../content/known-word-service.js'

interface ReviewElectronRuntime {
  ipcMain: {
    handle: (channel: string, listener: (...args: any[]) => unknown) => void
  }
}

interface RegisterReviewHandlersOptions {
  dailyReviewService: DailyReviewService
  knownWordService: KnownWordService
  knownWordOnboardingService: KnownWordOnboardingService
}

export function registerReviewHandlers(
  options: RegisterReviewHandlersOptions,
  runtime: ReviewElectronRuntime = { ipcMain },
) {
  runtime.ipcMain.handle(REVIEW_CHANNELS.getQueue, (_event, limit?: number) => {
    return options.dailyReviewService.getQueue(limit)
  })

  runtime.ipcMain.handle(REVIEW_CHANNELS.submitRating, (_event, input) => {
    return options.dailyReviewService.submitRating(normalizeSubmitRatingInput(input))
  })

  runtime.ipcMain.handle(REVIEW_CHANNELS.updateCardDetails, (_event, input) => {
    return options.dailyReviewService.updateCardDetails(input as never)
  })

  runtime.ipcMain.handle(REVIEW_CHANNELS.getKnownWordOnboardingStatus, () => {
    return options.knownWordOnboardingService.getStatus()
  })

  runtime.ipcMain.handle(REVIEW_CHANNELS.completeKnownWordOnboarding, (_event, input) => {
    return options.knownWordOnboardingService.complete(input as never)
  })

  runtime.ipcMain.handle(REVIEW_CHANNELS.markKnownWord, (_event, input) => {
    return options.knownWordService.markKnownWord(input as never)
  })

  runtime.ipcMain.handle(REVIEW_CHANNELS.clearKnownWord, (_event, input) => {
    return options.knownWordService.clearKnownWord(input as never)
  })

  runtime.ipcMain.handle(REVIEW_CHANNELS.getWordStudyStatus, (_event, input) => {
    return options.knownWordService.getWordStudyStatus(input as never)
  })
}

function normalizeSubmitRatingInput(value: unknown): SubmitReviewRatingInput {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid review rating payload.')
  }

  const input = value as Partial<SubmitReviewRatingInput>
  if (typeof input.reviewCardId !== 'string' || typeof input.rating !== 'string') {
    throw new Error('Invalid review rating payload.')
  }

  const sessionCompletion = input.sessionCompletion
  if (
    sessionCompletion &&
    (typeof sessionCompletion.startedAt !== 'number' ||
      typeof sessionCompletion.cardsReviewed !== 'number')
  ) {
    throw new Error('Invalid review session completion payload.')
  }

  return {
    reviewCardId: input.reviewCardId,
    rating: input.rating,
    ...(sessionCompletion
      ? {
          sessionCompletion: {
            startedAt: sessionCompletion.startedAt,
            cardsReviewed: sessionCompletion.cardsReviewed,
          },
        }
      : {}),
  }
}