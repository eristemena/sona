'use client'

import { RefreshCcw } from 'lucide-react'

import { useReviewSession } from '../../lib/use-review-session'
import { useKnownWordOnboarding } from '../../lib/use-known-word-onboarding'
import { Button } from '../ui/button'
import { KnownWordOnboarding } from './known-word-onboarding'
import { ReviewCard } from './review-card'
import { ReviewRatingGrid } from './review-rating-grid'

export function ReviewScreen() {
  const {
    status: onboardingStatus,
    isLoading: isLoadingOnboarding,
    isCompleting: isCompletingOnboarding,
    message: onboardingMessage,
    errorMessage: onboardingErrorMessage,
    completeSeedPack,
  } = useKnownWordOnboarding()
  const {
    snapshot,
    currentCard,
    cardsRemaining,
    isLoading,
    errorMessage,
    isFlipped,
    isSubmitting,
    isSavingDetails,
    isUpdatingKnownWord,
    submissionMessage,
    undoKnownWord,
    revealAnswer,
    markCurrentCardKnown,
    saveCardDetails,
    submitRating,
    undoMarkKnownWord,
    refresh,
  } = useReviewSession()

  return (
    <section className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-(--border) pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.32em] text-(--text-muted)">Review</p>
          <h1 className="text-[28px] font-bold leading-tight text-(--text-primary)">Daily review</h1>
          <p className="max-w-2xl text-[15px] leading-7 text-(--text-secondary)">
            Work the oldest due cards first, reveal the answer only after a real recall attempt, and let the scheduler pace the next return.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-[1.1rem] border border-(--border) bg-(--bg-elevated) px-4 py-3 text-sm text-(--text-secondary)">
            {snapshot ? `${snapshot.dueCount} due, ${cardsRemaining} in session` : 'Queue not loaded yet'}
          </div>
          <Button className="gap-2" onClick={() => void refresh()} type="button" variant="secondary">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      {errorMessage ? (
        <div className="rounded-[1.25rem] border px-4 py-3 text-sm text-(--text-primary)" style={{
          backgroundColor: 'color-mix(in srgb, var(--danger) 12%, transparent)',
          borderColor: 'color-mix(in srgb, var(--danger) 50%, var(--border))',
        }}>
          {errorMessage}
        </div>
      ) : null}

      {!isLoadingOnboarding ? (
        <KnownWordOnboarding
          isCompleting={isCompletingOnboarding}
          onComplete={completeSeedPack}
          status={onboardingStatus}
        />
      ) : null}

      {submissionMessage ? (
        <div className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--success)_45%,var(--border))] bg-[color:color-mix(in_srgb,var(--success)_10%,transparent)] px-4 py-3 text-sm text-(--text-primary)">
          <span>{submissionMessage}</span>
          {undoKnownWord ? (
            <Button disabled={isUpdatingKnownWord} onClick={() => void undoMarkKnownWord()} type="button" variant="ghost">
              Undo known word
            </Button>
          ) : null}
        </div>
      ) : null}

      {onboardingMessage ? (
        <div className="rounded-[1.25rem] border border-[color:color-mix(in_srgb,var(--success)_45%,var(--border))] bg-[color:color-mix(in_srgb,var(--success)_10%,transparent)] px-4 py-3 text-sm text-(--text-primary)">
          {onboardingMessage}
        </div>
      ) : null}

      {onboardingErrorMessage ? (
        <div className="rounded-[1.25rem] border px-4 py-3 text-sm text-(--text-primary)" style={{
          backgroundColor: 'color-mix(in srgb, var(--danger) 12%, transparent)',
          borderColor: 'color-mix(in srgb, var(--danger) 50%, var(--border))',
        }}>
          {onboardingErrorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid min-h-[420px] place-items-center rounded-[1.75rem] border border-(--border) bg-(--bg-surface)/70 p-8">
          <p className="text-sm text-(--text-secondary)">Loading the oldest due cards…</p>
        </div>
      ) : null}

      {!isLoading && !currentCard ? (
        <div className="grid min-h-[420px] place-items-center rounded-[1.75rem] border border-dashed border-(--border) bg-[linear-gradient(160deg,color-mix(in_srgb,var(--accent)_7%,transparent),transparent_58%)] p-8 text-center">
          <div className="max-w-md space-y-3">
            <p className="text-xs uppercase tracking-[0.32em] text-(--text-muted)">Calm queue</p>
            <p className="text-[22px] font-semibold text-(--text-primary)">Nothing is due right now.</p>
            <p className="text-sm leading-7 text-(--text-secondary)">
              Your queue is clear for the moment. Come back after reading capture or when the next scheduled cards return.
            </p>
          </div>
        </div>
      ) : null}

      {!isLoading && currentCard ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,560px)_minmax(260px,320px)] xl:items-start">
          <ReviewCard card={currentCard} isFlipped={isFlipped} isMarkingKnown={isUpdatingKnownWord} isSavingDetails={isSavingDetails} onFlip={revealAnswer} onMarkKnown={markCurrentCardKnown} onSaveDetails={saveCardDetails} />

          <aside className="space-y-4 rounded-[1.5rem] border border-(--border) bg-(--bg-surface)/72 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-(--text-muted)">Session pace</p>
              <p className="mt-3 text-sm leading-7 text-(--text-secondary)">
                The answer buttons stay locked until you reveal the back, which keeps the session honest and consistent.
              </p>
            </div>
            <ReviewRatingGrid disabled={!isFlipped || isSubmitting} onRate={(rating) => void submitRating(rating)} />
          </aside>
        </div>
      ) : null}
    </section>
  )
}