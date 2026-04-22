export type KnownWordSource = 'topik_seed' | 'manual' | 'review-promoted'
export type CaptureEligibility = 'eligible' | 'already-in-deck' | 'known-word' | 'deferred'

export interface KnownWordRecord {
  canonicalForm: string
  surface: string
  source: KnownWordSource
  sourceDetail: string | null
  createdAt: number
  updatedAt: number
}

export interface KnownWordSeedWord {
  canonicalForm: string
  surface: string
}

export interface KnownWordSeedPack {
  id: string
  label: string
  description: string
  wordCount: number
  words: KnownWordSeedWord[]
}

export interface KnownWordOnboardingStatus {
  shouldOnboard: boolean
  completedAt: number | null
  availableSeedPacks: Array<Pick<KnownWordSeedPack, 'id' | 'label' | 'description' | 'wordCount'>>
}

export interface CompleteKnownWordOnboardingInput {
  seedPackId: string
  selectedWords: KnownWordSeedWord[]
}

export interface CompleteKnownWordOnboardingResult {
  insertedCount: number
  onboardingCompletedAt: number
}

export interface MarkKnownWordInput {
  canonicalForm: string
  surface: string
  source: KnownWordSource
  sourceDetail?: string | null
  reviewCardId?: string | null
}

export interface MarkKnownWordResult {
  canonicalForm: string
  source: KnownWordSource
  affectedReviewCardId: string | null
}

export interface ClearKnownWordInput {
  canonicalForm: string
  reviewCardId?: string | null
}

export interface ClearKnownWordResult {
  canonicalForm: string
  affectedReviewCardId: string | null
  activationState: 'active' | 'deferred' | null
}

export interface WordStudyStatus {
  canonicalForm: string
  eligibility: CaptureEligibility
  reviewCardId: string | null
  knownWordSource: KnownWordSource | null
}

export function normalizeKnownWord(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}