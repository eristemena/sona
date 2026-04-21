import type { ReviewCardActivationState } from './review-card.js'

export const DEFAULT_ACTIVE_NEW_CARD_LIMIT = 20

export interface ReviewPacingSnapshot {
  activeCardCount: number
  activeNewCardLimit: number
}

export function resolveReviewCardActivationState(snapshot: ReviewPacingSnapshot): Exclude<ReviewCardActivationState, 'duplicate-blocked'> {
  return snapshot.activeCardCount >= snapshot.activeNewCardLimit ? 'deferred' : 'active'
}