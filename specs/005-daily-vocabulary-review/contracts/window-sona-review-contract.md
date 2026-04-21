# Contract: `window.sona` Review API Surface

## Purpose

Defines the typed preload bridge required for daily review sessions, review-rating persistence, known-word onboarding, and known-word suppression visible from reading flows.

## Type Definitions

```ts
type ReviewRating = 'again' | 'hard' | 'good' | 'easy'
type ReviewActivationState = 'active' | 'deferred' | 'duplicate-blocked' | 'known'
type KnownWordSource = 'topik_seed' | 'manual' | 'review-promoted'
type CaptureEligibility = 'eligible' | 'already-in-deck' | 'known-word' | 'deferred'

interface ReviewCardFront {
  id: string
  surface: string
  dueAt: number
  fsrsState: string
}

interface ReviewCardBack {
  meaning: string | null
  grammarPattern: string | null
  grammarDetails: string | null
  romanization: string | null
  sentenceContext: string | null
  sentenceTranslation: string | null
  provenance: {
    sourceBlockId: string
    sourceContentItemId: string
    sentenceContextHash: string
  }
}

interface ReviewQueueCard {
  front: ReviewCardFront
  back: ReviewCardBack
  activationState: ReviewActivationState
}

interface ReviewQueueSnapshot {
  generatedAt: number
  dueCount: number
  sessionLimit: number
  cards: ReviewQueueCard[]
}

interface SubmitReviewRatingInput {
  reviewCardId: string
  rating: ReviewRating
}

interface SubmitReviewRatingResult {
  reviewCardId: string
  rating: ReviewRating
  fsrsGrade: 1 | 2 | 3 | 4
  reviewedAt: number
  nextDueAt: number
  fsrsState: string
  scheduledDays: number
}

interface KnownWordSeedPack {
  id: string
  label: string
  description: string
  wordCount: number
}

interface KnownWordOnboardingStatus {
  shouldOnboard: boolean
  completedAt: number | null
  availableSeedPacks: KnownWordSeedPack[]
}

interface CompleteKnownWordOnboardingInput {
  seedPackId: string
  selectedWords: Array<{
    canonicalForm: string
    surface: string
  }>
}

interface CompleteKnownWordOnboardingResult {
  insertedCount: number
  onboardingCompletedAt: number
}

interface MarkKnownWordInput {
  canonicalForm: string
  surface: string
  source: KnownWordSource
  sourceDetail?: string | null
  reviewCardId?: string | null
}

interface MarkKnownWordResult {
  canonicalForm: string
  source: KnownWordSource
  affectedReviewCardId: string | null
}

interface WordStudyStatus {
  canonicalForm: string
  eligibility: CaptureEligibility
  reviewCardId: string | null
  knownWordSource: KnownWordSource | null
}
```

## Surface

```ts
interface WindowSona {
  review: {
    getQueue(limit?: number): Promise<ReviewQueueSnapshot>
    submitRating(input: SubmitReviewRatingInput): Promise<SubmitReviewRatingResult>
    getKnownWordOnboardingStatus(): Promise<KnownWordOnboardingStatus>
    completeKnownWordOnboarding(input: CompleteKnownWordOnboardingInput): Promise<CompleteKnownWordOnboardingResult>
    markKnownWord(input: MarkKnownWordInput): Promise<MarkKnownWordResult>
  }

  reading: {
    getWordStudyStatus(input: {
      canonicalForm: string
      surface: string
    }): Promise<WordStudyStatus>
  }
}
```

## Behavior Rules

- `getQueue()` returns active cards where `due_at <= now`, ordered by ascending `due_at`, limited to 50 by default.
- `submitRating()` maps `again`, `hard`, `good`, `easy` to FSRS grades `1`, `2`, `3`, `4` and applies `ts-fsrs` `next()` using the current persisted card state.
- `submitRating()` writes the updated scheduler state back to the same card row and appends an immutable review-history row.
- `getKnownWordOnboardingStatus()` returns `shouldOnboard = true` only when no known words exist and the onboarding-complete setting is absent.
- `completeKnownWordOnboarding()` bulk inserts selected seed words with `source = 'topik_seed'` and persists the onboarding-complete setting in one transaction.
- `markKnownWord()` is idempotent for the same canonical form and may also move an existing review card into the `known` activation state.
- `reading.getWordStudyStatus()` must report whether a word is eligible for capture, already represented by an active review card, already covered by known-word status, or currently deferred.

## Error Model

- Queue and rating failures return learner-safe errors without losing prior card state.
- Known-word onboarding remains fully local and must not depend on network access.
- Bulk seed insertions are safe to retry without creating duplicate known-word rows.

## Security Rules

- The renderer never receives raw database access or unrestricted filesystem reads.
- Seed-list JSON is bundled locally and consumed through typed preload handlers.
- The review surface exposes only learner-safe content fields, not raw provider payloads or credentials.
