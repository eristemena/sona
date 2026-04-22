import {
  normalizeKnownWord,
} from '@sona/domain/content/known-word'
import type {
  ClearKnownWordInput,
  ClearKnownWordResult,
  KnownWordRecord,
  MarkKnownWordInput,
  MarkKnownWordResult,
  WordStudyStatus,
} from '@sona/domain/content/known-word'
import type { SqliteContentLibraryRepository } from '@sona/data/sqlite/content-library-repository'

interface KnownWordServiceOptions {
  repository: SqliteContentLibraryRepository
  now?: () => number
  activeReviewCardLimit?: number
}

const DEFAULT_ACTIVE_REVIEW_CARD_LIMIT = 20

export class KnownWordService {
  private readonly now: () => number
  private readonly activeReviewCardLimit: number

  constructor(private readonly options: KnownWordServiceOptions) {
    this.now = options.now ?? (() => Date.now())
    this.activeReviewCardLimit =
      options.activeReviewCardLimit ?? DEFAULT_ACTIVE_REVIEW_CARD_LIMIT
  }

  markKnownWord(input: MarkKnownWordInput): MarkKnownWordResult {
    const canonicalForm = normalizeKnownWord(input.canonicalForm)
    const updatedAt = this.now()
    const existing = this.options.repository.getKnownWord(canonicalForm)
    const record: KnownWordRecord = {
      canonicalForm,
      surface: normalizeKnownWord(input.surface),
      source: input.source,
      sourceDetail: input.sourceDetail ?? null,
      createdAt: existing?.createdAt ?? updatedAt,
      updatedAt,
    }

    this.options.repository.saveKnownWord(record)

    const reviewCard = input.reviewCardId
      ? this.options.repository.getReviewCard(input.reviewCardId)
      : this.options.repository.findReviewCardByCanonical(canonicalForm, [
          'active',
          'deferred',
          'known',
        ])

    if (reviewCard) {
      this.options.repository.setReviewCardActivationState(
        reviewCard.id,
        'known',
        updatedAt,
      )
    }

    return {
      canonicalForm,
      source: record.source,
      affectedReviewCardId: reviewCard?.id ?? null,
    }
  }

  clearKnownWord(input: ClearKnownWordInput): ClearKnownWordResult {
    const canonicalForm = normalizeKnownWord(input.canonicalForm)
    this.options.repository.deleteKnownWord(canonicalForm)

    const reviewCard = input.reviewCardId
      ? this.options.repository.getReviewCard(input.reviewCardId)
      : this.options.repository.findReviewCardByCanonical(canonicalForm, ['known'])

    if (!reviewCard) {
      return {
        canonicalForm,
        affectedReviewCardId: null,
        activationState: null,
      }
    }

    const activationState =
      this.options.repository.countReviewCards(['active']) >=
      this.activeReviewCardLimit
        ? 'deferred'
        : 'active'

    this.options.repository.setReviewCardActivationState(
      reviewCard.id,
      activationState,
      this.now(),
    )

    return {
      canonicalForm,
      affectedReviewCardId: reviewCard.id,
      activationState,
    }
  }

  getWordStudyStatus(input: {
    canonicalForm: string
    surface: string
  }): WordStudyStatus {
    const canonicalForm = normalizeKnownWord(input.canonicalForm || input.surface)
    const knownWord = this.options.repository.getKnownWord(canonicalForm)
    if (knownWord) {
      return {
        canonicalForm,
        eligibility: 'known-word',
        reviewCardId: null,
        knownWordSource: knownWord.source,
      }
    }

    const activeCard = this.options.repository.findReviewCardByCanonical(canonicalForm, ['active'])
    if (activeCard) {
      return {
        canonicalForm,
        eligibility: 'already-in-deck',
        reviewCardId: activeCard.id,
        knownWordSource: null,
      }
    }

    const deferredCard = this.options.repository.findReviewCardByCanonical(canonicalForm, ['deferred'])
    if (deferredCard) {
      return {
        canonicalForm,
        eligibility: 'deferred',
        reviewCardId: deferredCard.id,
        knownWordSource: null,
      }
    }

    return {
      canonicalForm,
      eligibility: 'eligible',
      reviewCardId: null,
      knownWordSource: null,
    }
  }
}