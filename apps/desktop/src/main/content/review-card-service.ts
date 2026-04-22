import { randomUUID } from 'node:crypto'

import { State, createEmptyCard } from 'ts-fsrs'

import type {
  AddToDeckInput,
  AddToDeckResult,
  ReviewCardRecord,
} from "@sona/domain/content/review-card";
import type { SqliteContentLibraryRepository } from '@sona/data/sqlite/content-library-repository'

import { hashSentenceContext } from './annotation-cache-service.js'

const DEFAULT_ACTIVE_NEW_CARD_LIMIT = 20

interface ReviewCardServiceOptions {
  repository: SqliteContentLibraryRepository
  now?: () => number
  activeNewCardLimit?: number
}

export class ReviewCardService {
  private readonly now: () => number;
  private readonly activeNewCardLimit: number;

  constructor(private readonly options: ReviewCardServiceOptions) {
    this.now = options.now ?? (() => Date.now());
    this.activeNewCardLimit =
      options.activeNewCardLimit ?? DEFAULT_ACTIVE_NEW_CARD_LIMIT;
  }

  addToDeck(input: AddToDeckInput): AddToDeckResult {
    const block = this.options.repository.getReadingBlock(input.blockId);
    if (!block) {
      return createUnavailableResult(
        "The selected reading block could not be found. No review card was created.",
      );
    }

    const canonicalForm = normalizeToken(input.canonicalForm || input.token);
    const surface = normalizeToken(input.token);

    if (!canonicalForm || !surface) {
      return createUnavailableResult(
        "The selected word could not be normalized for review. No review card was created.",
      );
    }

    const duplicate =
      this.options.repository.findActiveReviewCard(canonicalForm);
    if (duplicate) {
      return createDuplicateBlockedResult(duplicate);
    }

    const createdAt = this.now();
    const activationState =
      this.options.repository.countReviewCards(["active"]) >=
      this.activeNewCardLimit
        ? "deferred"
        : "active";
    const reviewCard: ReviewCardRecord = createPersistedReviewCard({
      id: randomUUID(),
      canonicalForm,
      surface,
      meaning: input.meaning ?? null,
      grammarPattern: input.grammarPattern ?? null,
      grammarDetails: input.grammarDetails ?? null,
      romanization: input.romanization ?? null,
      sourceBlockId: block.id,
      sourceContentItemId: block.contentItemId,
      sentenceContextHash: hashSentenceContext(input.sentenceContext),
      sentenceContext: input.sentenceContext,
      sentenceTranslation: input.sentenceTranslation ?? null,
      activationState,
      createdAt,
    });

    this.options.repository.saveReviewCard(reviewCard);

    return activationState === "active"
      ? createCreatedResult(reviewCard)
      : createDeferredResult(reviewCard);
  }
}

function normalizeToken(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function createUnavailableResult(message: string): AddToDeckResult {
  return {
    disposition: "deferred",
    reviewCardId: null,
    message,
  };
}

function createCreatedResult(card: ReviewCardRecord): AddToDeckResult {
  return {
    disposition: "created",
    reviewCardId: card.id,
    message: `Added ${card.surface} to your review deck with source context preserved.`,
  };
}

function createDeferredResult(card: ReviewCardRecord): AddToDeckResult {
  return {
    disposition: "deferred",
    reviewCardId: card.id,
    message: `Saved ${card.surface} with its reading provenance, but deferred activation because your new-card pacing limit is full.`,
  };
}

function createDuplicateBlockedResult(card: ReviewCardRecord): AddToDeckResult {
  return {
    disposition: "duplicate-blocked",
    reviewCardId: card.id,
    message: `${card.surface} is already active in your review deck. No duplicate card was created.`,
  };
}

function createPersistedReviewCard(input: {
  id: string;
  canonicalForm: string;
  surface: string;
  meaning: string | null;
  grammarPattern: string | null;
  grammarDetails: string | null;
  romanization: string | null;
  sourceBlockId: string;
  sourceContentItemId: string;
  sentenceContextHash: string;
  sentenceContext: string;
  sentenceTranslation: string | null;
  activationState: ReviewCardRecord["activationState"];
  createdAt: number;
}): ReviewCardRecord {
  const card = createEmptyCard(new Date(input.createdAt));

  return {
    id: input.id,
    canonicalForm: normalizeToken(input.canonicalForm),
    surface: normalizeToken(input.surface),
    meaning: input.meaning,
    grammarPattern: input.grammarPattern,
    grammarDetails: input.grammarDetails,
    romanization: input.romanization,
    sentenceContext: input.sentenceContext,
    sentenceTranslation: input.sentenceTranslation,
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