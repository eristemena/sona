import { Rating, State, createEmptyCard } from "ts-fsrs";

export type AddToDeckDisposition = "created" | "duplicate-blocked" | "deferred";
export type ReviewCardActivationState =
  | "active"
  | "deferred"
  | "duplicate-blocked"
  | "known";
export type ReviewRating = "again" | "hard" | "good" | "easy";

export interface ReviewCardProvenance {
  sourceBlockId: string;
  sourceContentItemId: string;
  sentenceContextHash: string;
}

export interface ReviewCardFront {
  id: string;
  surface: string;
  canonicalForm: string;
  dueAt: number;
  fsrsState: string;
}

export interface ReviewCardBack {
  meaning: string | null;
  grammarPattern: string | null;
  grammarDetails: string | null;
  romanization: string | null;
  sentenceContext: string | null;
  sentenceTranslation: string | null;
  provenance: ReviewCardProvenance;
}

export interface ReviewQueueCard {
  front: ReviewCardFront;
  back: ReviewCardBack;
  activationState: ReviewCardActivationState;
}

export interface ReviewQueueSnapshot {
  generatedAt: number;
  dueCount: number;
  sessionLimit: number;
  cards: ReviewQueueCard[];
}

export interface SubmitReviewRatingInput {
  reviewCardId: string;
  rating: ReviewRating;
}

export interface SubmitReviewRatingResult {
  reviewCardId: string;
  rating: ReviewRating;
  fsrsGrade: 1 | 2 | 3 | 4;
  reviewedAt: number;
  nextDueAt: number;
  fsrsState: string;
  scheduledDays: number;
}

export interface UpdateReviewCardDetailsInput {
  reviewCardId: string;
  meaning: string | null;
  grammarPattern: string | null;
  grammarDetails: string | null;
}

export interface UpdateReviewCardDetailsResult {
  reviewCardId: string;
  updatedAt: number;
}

export interface ReviewEventRecord {
  id: string;
  reviewCardId: string;
  rating: ReviewRating;
  fsrsGrade: 1 | 2 | 3 | 4;
  reviewedAt: number;
  previousState: string;
  nextState: string;
  previousDueAt: number;
  nextDueAt: number;
  scheduledDays: number;
}

export interface AddToDeckInput {
  blockId: string;
  token: string;
  canonicalForm: string;
  sentenceContext: string;
  meaning?: string | null;
  grammarPattern?: string | null;
  grammarDetails?: string | null;
  romanization?: string | null;
  sentenceTranslation?: string | null;
}

export interface AddToDeckResult {
  disposition: AddToDeckDisposition;
  reviewCardId: string | null;
  message: string;
}

export interface ExposureLogEntry {
  blockId: string;
  token: string;
  seenAt: number;
}

export interface ExposureLogInput {
  entries: ExposureLogEntry[];
}

export interface ExposureLogResult {
  written: number;
}

export interface ReviewCardRecord {
  id: string;
  canonicalForm: string;
  surface: string;
  meaning: string | null;
  grammarPattern: string | null;
  grammarDetails: string | null;
  romanization: string | null;
  sentenceContext: string | null;
  sentenceTranslation: string | null;
  sourceBlockId: string;
  sourceContentItemId: string;
  sentenceContextHash: string;
  fsrsState: string;
  dueAt: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReviewAt: number | null;
  activationState: ReviewCardActivationState;
  createdAt: number;
  updatedAt: number;
}

interface CreateReviewCardRecordInput {
  id: string;
  canonicalForm: string;
  surface: string;
  meaning?: string | null;
  grammarPattern?: string | null;
  grammarDetails?: string | null;
  romanization?: string | null;
  sentenceContext?: string | null;
  sentenceTranslation?: string | null;
  sourceBlockId: string;
  sourceContentItemId: string;
  sentenceContextHash: string;
  activationState: Exclude<ReviewCardActivationState, "duplicate-blocked">;
  createdAt: number;
}

export function normalizeReviewToken(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function createReviewCardRecord(
  input: CreateReviewCardRecordInput,
): ReviewCardRecord {
  const card = createEmptyCard(new Date(input.createdAt));

  return {
    id: input.id,
    canonicalForm: normalizeReviewToken(input.canonicalForm),
    surface: normalizeReviewToken(input.surface),
    meaning: input.meaning ?? null,
    grammarPattern: input.grammarPattern ?? null,
    grammarDetails: input.grammarDetails ?? null,
    romanization: input.romanization ?? null,
    sentenceContext: input.sentenceContext ?? null,
    sentenceTranslation: input.sentenceTranslation ?? null,
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
    updatedAt: input.createdAt,
  };
}

export function createReviewQueueCard(card: ReviewCardRecord): ReviewQueueCard {
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
  };
}

export function mapReviewRatingToFsrsGrade(
  rating: ReviewRating,
): 1 | 2 | 3 | 4 {
  switch (rating) {
    case "again":
      return 1;
    case "hard":
      return 2;
    case "good":
      return 3;
    case "easy":
      return 4;
  }
}

export function mapReviewRatingToFsrsRating(rating: ReviewRating): Rating {
  switch (rating) {
    case "again":
      return Rating.Again;
    case "hard":
      return Rating.Hard;
    case "good":
      return Rating.Good;
    case "easy":
      return Rating.Easy;
  }
}

export function createReviewCardCreatedResult(
  card: ReviewCardRecord,
): AddToDeckResult {
  return {
    disposition: "created",
    reviewCardId: card.id,
    message: `Added ${card.surface} to your review deck with source context preserved.`,
  };
}

export function createReviewCardDeferredResult(
  card: ReviewCardRecord,
): AddToDeckResult {
  return {
    disposition: "deferred",
    reviewCardId: card.id,
    message: `Saved ${card.surface} with its reading provenance, but deferred activation because your new-card pacing limit is full.`,
  };
}

export function createReviewDuplicateBlockedResult(
  card: ReviewCardRecord,
): AddToDeckResult {
  return {
    disposition: "duplicate-blocked",
    reviewCardId: card.id,
    message: `${card.surface} is already active in your review deck. No duplicate card was created.`,
  };
}

export function createReviewCaptureUnavailableResult(
  message = "Add to deck is not available yet for synced reading.",
): AddToDeckResult {
  return {
    disposition: "deferred",
    reviewCardId: null,
    message,
  };
}
