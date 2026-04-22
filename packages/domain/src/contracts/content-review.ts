export type {
  ClearKnownWordInput,
  ClearKnownWordResult,
  CompleteKnownWordOnboardingInput,
  CompleteKnownWordOnboardingResult,
  KnownWordOnboardingStatus,
  KnownWordSeedPack,
  KnownWordSource,
  MarkKnownWordInput,
  MarkKnownWordResult,
  WordStudyStatus,
} from '../content/known-word.js'
export type {
  ReviewQueueSnapshot,
  ReviewRating,
  SubmitReviewRatingInput,
  SubmitReviewRatingResult,
  UpdateReviewCardDetailsInput,
  UpdateReviewCardDetailsResult,
} from '../content/review-card.js'

export const REVIEW_CHANNELS = {
  getQueue: 'sona:review:get-queue',
  submitRating: 'sona:review:submit-rating',
  updateCardDetails: 'sona:review:update-card-details',
  getKnownWordOnboardingStatus: 'sona:review:get-known-word-onboarding-status',
  completeKnownWordOnboarding: 'sona:review:complete-known-word-onboarding',
  markKnownWord: 'sona:review:mark-known-word',
  clearKnownWord: 'sona:review:clear-known-word',
  getWordStudyStatus: 'sona:reading:get-word-study-status',
} as const