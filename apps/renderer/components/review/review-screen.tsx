'use client'

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
    cardsCompleted,
    sessionCardTotal,
    hasCompletedSession,
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
  } = useReviewSession();

  const progressValue =
    sessionCardTotal > 0
      ? Math.min(100, (cardsCompleted / sessionCardTotal) * 100)
      : 0;
  const dueCount = snapshot?.dueCount ?? 0;

  return (
    <section className="flex flex-1 flex-col gap-6">
      <div
        aria-label="Session progress"
        aria-valuemax={sessionCardTotal || 1}
        aria-valuemin={0}
        aria-valuenow={cardsCompleted}
        className="h-1 overflow-hidden rounded-full bg-(--border)"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-(--accent) transition-[width] duration-200 ease-out"
          style={{ width: `${progressValue}%` }}
        />
      </div>

      <header className="flex items-center justify-between gap-4">
        <h1 className="text-[28px] font-bold leading-tight text-(--text-primary)">
          Daily review
        </h1>
        <div className="rounded-full border border-(--border) bg-(--bg-elevated) px-3 py-1 text-sm font-medium text-(--text-primary)">
          {dueCount}
        </div>
      </header>

      {errorMessage ? (
        <div
          className="rounded-[1.25rem] border px-4 py-3 text-sm text-(--text-primary)"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--danger) 12%, transparent)",
            borderColor: "color-mix(in srgb, var(--danger) 50%, var(--border))",
          }}
        >
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
        <div className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-[color-mix(in_srgb,var(--success)_45%,var(--border))] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] px-4 py-3 text-sm text-(--text-primary)">
          <span>{submissionMessage}</span>
          {undoKnownWord ? (
            <Button
              disabled={isUpdatingKnownWord}
              onClick={() => void undoMarkKnownWord()}
              type="button"
              variant="ghost"
            >
              Undo known word
            </Button>
          ) : null}
        </div>
      ) : null}

      {onboardingMessage ? (
        <div className="rounded-[1.25rem] border border-[color-mix(in_srgb,var(--success)_45%,var(--border))] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] px-4 py-3 text-sm text-(--text-primary)">
          {onboardingMessage}
        </div>
      ) : null}

      {onboardingErrorMessage ? (
        <div
          className="rounded-[1.25rem] border px-4 py-3 text-sm text-(--text-primary)"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--danger) 12%, transparent)",
            borderColor: "color-mix(in srgb, var(--danger) 50%, var(--border))",
          }}
        >
          {onboardingErrorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid min-h-105 place-items-center rounded-[1.75rem] border border-(--border) bg-(--bg-surface)/70 p-8">
          <p className="text-sm text-(--text-secondary)">
            Loading the oldest due cards…
          </p>
        </div>
      ) : null}

      {!isLoading && !currentCard ? (
        <div className="grid min-h-105 place-items-center rounded-[1.75rem] border border-dashed border-(--border) bg-[linear-gradient(160deg,color-mix(in_srgb,var(--accent)_7%,transparent),transparent_58%)] p-8 text-center">
          <div className="max-w-md space-y-3">
            {hasCompletedSession ? (
              <>
                <p className="text-[22px] font-semibold text-(--text-primary)">
                  Session complete.
                </p>
                <p className="text-sm leading-7 text-(--text-secondary)">
                  You finished the cards in this review session. Return later to
                  pick up the remaining due cards.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-[0.32em] text-(--text-muted)">
                  Calm queue
                </p>
                <p className="text-[22px] font-semibold text-(--text-primary)">
                  Nothing is due right now.
                </p>
                <p className="text-sm leading-7 text-(--text-secondary)">
                  Your queue is clear for the moment. Come back after reading
                  capture or when the next scheduled cards return.
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}

      {!isLoading && currentCard ? (
        <div className="mx-auto flex w-full max-w-140 flex-col gap-4">
          <ReviewCard
            card={currentCard}
            isFlipped={isFlipped}
            isMarkingKnown={isUpdatingKnownWord}
            isSavingDetails={isSavingDetails}
            onFlip={revealAnswer}
            onMarkKnown={markCurrentCardKnown}
            onSaveDetails={saveCardDetails}
          />
          <ReviewRatingGrid
            disabled={!isFlipped || isSubmitting}
            onRate={(rating) => void submitRating(rating)}
          />
        </div>
      ) : null}
    </section>
  );
}