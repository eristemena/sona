import { randomUUID } from 'node:crypto'

import { Card, State, fsrs } from 'ts-fsrs'

import type {
  ReviewQueueCard,
  ReviewCardRecord,
  ReviewRating,
  ReviewQueueSnapshot,
  SubmitReviewRatingInput,
  SubmitReviewRatingResult,
  UpdateReviewCardDetailsInput,
  UpdateReviewCardDetailsResult,
} from '@sona/domain/content/review-card'
import type { HomeDashboardSnapshot } from '@sona/domain/content/home-dashboard'
import type { SqliteContentLibraryRepository } from '@sona/data/sqlite/content-library-repository'
import type { SqliteSettingsRepository } from '@sona/data/sqlite/settings-repository'

interface DailyReviewServiceOptions {
  repository: SqliteContentLibraryRepository
  settingsRepository: SqliteSettingsRepository
  now?: () => number
}

const DEFAULT_QUEUE_LIMIT = 50

export class DailyReviewService {
  private readonly now: () => number
  private readonly scheduler = fsrs()

  constructor(private readonly options: DailyReviewServiceOptions) {
    this.now = options.now ?? (() => Date.now())
  }

  getQueue(limit?: number): ReviewQueueSnapshot {
    const generatedAt = this.now()
    const sessionLimit = clampReviewQueueLimit(limit)
    const dueCount = this.options.repository.countDueReviewCards(generatedAt)
    const cards = this.options.repository
      .listDueReviewCards(generatedAt, sessionLimit)
      .map(toReviewQueueCard)

    return {
      generatedAt,
      dueCount,
      sessionLimit,
      cards,
    }
  }

  getHomeDashboard(): HomeDashboardSnapshot {
    return this.options.repository.getHomeDashboardSnapshot({
      now: this.now(),
      dailyGoal: this.options.settingsRepository.getDailyStudyGoal(),
    })
  }

  submitRating(input: SubmitReviewRatingInput): SubmitReviewRatingResult {
    const currentCard = this.options.repository.getReviewCard(input.reviewCardId)
    if (!currentCard) {
      throw new Error(`Review card ${input.reviewCardId} was not found.`)
    }

    const reviewedAt = this.now()
    const result = this.scheduler.next(
      toFsrsCard(currentCard),
      new Date(reviewedAt),
      toFsrsGrade(input.rating),
    )
    const updatedCard: ReviewCardRecord = {
      ...currentCard,
      fsrsState: State[result.card.state],
      dueAt: result.card.due.getTime(),
      stability: result.card.stability,
      difficulty: result.card.difficulty,
      elapsedDays: result.card.elapsed_days,
      scheduledDays: result.card.scheduled_days,
      reps: result.card.reps,
      lapses: result.card.lapses,
      lastReviewAt: result.card.last_review?.getTime() ?? null,
      updatedAt: reviewedAt,
    }

    this.options.repository.applyReviewUpdate(updatedCard, {
      id: randomUUID(),
      reviewCardId: currentCard.id,
      rating: input.rating,
      fsrsGrade: toFsrsGrade(input.rating),
      reviewedAt,
      previousState: currentCard.fsrsState,
      nextState: updatedCard.fsrsState,
      previousDueAt: currentCard.dueAt,
      nextDueAt: updatedCard.dueAt,
      scheduledDays: updatedCard.scheduledDays,
    })

    if (input.sessionCompletion && input.sessionCompletion.cardsReviewed > 0) {
      this.options.repository.recordStudySession({
        id: randomUUID(),
        startedAt: input.sessionCompletion.startedAt,
        endedAt: reviewedAt,
        cardsReviewed: input.sessionCompletion.cardsReviewed,
        minutesStudied: Math.max(
          1,
          Math.round((reviewedAt - input.sessionCompletion.startedAt) / 60000),
        ),
        source: 'review-session',
      })
    }

    return {
      reviewCardId: currentCard.id,
      rating: input.rating,
      fsrsGrade: toFsrsGrade(input.rating),
      reviewedAt,
      nextDueAt: updatedCard.dueAt,
      fsrsState: updatedCard.fsrsState,
      scheduledDays: updatedCard.scheduledDays,
    }
  }

  updateCardDetails(
    input: UpdateReviewCardDetailsInput,
  ): UpdateReviewCardDetailsResult {
    const updatedAt = this.now()
    this.options.repository.updateReviewCardDetails(input, updatedAt)

    return {
      reviewCardId: input.reviewCardId,
      updatedAt,
    }
  }
}

function clampReviewQueueLimit(limit?: number): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) {
    return DEFAULT_QUEUE_LIMIT
  }

  return Math.max(1, Math.min(DEFAULT_QUEUE_LIMIT, Math.trunc(limit)))
}

function toReviewQueueCard(card: ReviewCardRecord): ReviewQueueCard {
  return {
    front: {
      id: card.id,
      surface: card.surface,
      canonicalForm: card.canonicalForm,
      dueAt: card.dueAt,
      fsrsState: card.fsrsState,
    },
    back: {
      meaning: card.meaning,
      grammarPattern: card.grammarPattern,
      grammarDetails: card.grammarDetails,
      romanization: card.romanization,
      sentenceContext: card.sentenceContext,
      sentenceTranslation: card.sentenceTranslation,
      provenance: {
        sourceBlockId: card.sourceBlockId,
        sourceContentItemId: card.sourceContentItemId,
        sentenceContextHash: card.sentenceContextHash,
      },
    },
    activationState: card.activationState,
  }
}

function toFsrsGrade(rating: ReviewRating): 1 | 2 | 3 | 4 {
  switch (rating) {
    case 'again':
      return 1
    case 'hard':
      return 2
    case 'good':
      return 3
    case 'easy':
      return 4
  }
}

function toFsrsCard(card: ReviewCardRecord): Card {
  const fsrsCard = {
    due: new Date(card.dueAt),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsedDays,
    scheduled_days: card.scheduledDays,
    learning_steps: 0,
    reps: card.reps,
    lapses: card.lapses,
    state: mapFsrsState(card.fsrsState),
  }

  return card.lastReviewAt
    ? { ...fsrsCard, last_review: new Date(card.lastReviewAt) }
    : fsrsCard
}

function mapFsrsState(value: string): State {
  switch (value) {
    case 'New':
      return State.New
    case 'Learning':
      return State.Learning
    case 'Review':
      return State.Review
    case 'Relearning':
      return State.Relearning
    default:
      return State.New
  }
}