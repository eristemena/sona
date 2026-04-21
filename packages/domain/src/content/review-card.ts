import { State, createEmptyCard } from 'ts-fsrs'

export type AddToDeckDisposition = 'created' | 'duplicate-blocked' | 'deferred'
export type ReviewCardActivationState = 'active' | 'deferred' | 'duplicate-blocked'

export interface AddToDeckInput {
  blockId: string
  token: string
  canonicalForm: string
  sentenceContext: string
}

export interface AddToDeckResult {
  disposition: AddToDeckDisposition
  reviewCardId: string | null
  message: string
}

export interface ExposureLogEntry {
  blockId: string
  token: string
  seenAt: number
}

export interface ExposureLogInput {
  entries: ExposureLogEntry[]
}

export interface ExposureLogResult {
  written: number
}

export interface ReviewCardRecord {
  id: string
  canonicalForm: string
  surface: string
  sourceBlockId: string
  sourceContentItemId: string
  sentenceContextHash: string
  fsrsState: string
  dueAt: number
  stability: number
  difficulty: number
  elapsedDays: number
  scheduledDays: number
  reps: number
  lapses: number
  lastReviewAt: number | null
  activationState: ReviewCardActivationState
  createdAt: number
}

interface CreateReviewCardRecordInput {
  id: string
  canonicalForm: string
  surface: string
  sourceBlockId: string
  sourceContentItemId: string
  sentenceContextHash: string
  activationState: Exclude<ReviewCardActivationState, 'duplicate-blocked'>
  createdAt: number
}

export function normalizeReviewToken(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function createReviewCardRecord(input: CreateReviewCardRecordInput): ReviewCardRecord {
  const card = createEmptyCard(new Date(input.createdAt))

  return {
    id: input.id,
    canonicalForm: normalizeReviewToken(input.canonicalForm),
    surface: normalizeReviewToken(input.surface),
    sourceBlockId: input.sourceBlockId,
    sourceContentItemId: input.sourceContentItemId,
    sentenceContextHash: input.sentenceContextHash,
    fsrsState: State[card.state],
    dueAt: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    lastReviewAt: card.last_review ? card.last_review.getTime() : null,
    activationState: input.activationState,
    createdAt: input.createdAt,
  }
}

export function createReviewCardCreatedResult(card: ReviewCardRecord): AddToDeckResult {
  return {
    disposition: 'created',
    reviewCardId: card.id,
    message: `Added ${card.surface} to your review deck with source context preserved.`,
  }
}

export function createReviewCardDeferredResult(card: ReviewCardRecord): AddToDeckResult {
  return {
    disposition: 'deferred',
    reviewCardId: card.id,
    message: `Saved ${card.surface} with its reading provenance, but deferred activation because your new-card pacing limit is full.`,
  }
}

export function createReviewDuplicateBlockedResult(card: ReviewCardRecord): AddToDeckResult {
  return {
    disposition: 'duplicate-blocked',
    reviewCardId: card.id,
    message: `${card.surface} is already active in your review deck. No duplicate card was created.`,
  }
}

export function createReviewCaptureUnavailableResult(message = 'Add to deck is not available yet for synced reading.'): AddToDeckResult {
  return {
    disposition: 'deferred',
    reviewCardId: null,
    message,
  }
}