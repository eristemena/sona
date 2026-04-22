'use client'

import type { ReviewQueueCard } from '@sona/domain/content'

import { Button } from '../ui/button'
import { ReviewCardBack } from './review-card-back'

interface ReviewCardProps {
  card: ReviewQueueCard
  isFlipped: boolean
  isMarkingKnown: boolean
  isSavingDetails: boolean
  onFlip: () => void
  onMarkKnown: () => Promise<void>
  onSaveDetails: (input: {
    meaning: string | null
    grammarPattern: string | null
    grammarDetails: string | null
  }) => Promise<void>
}

export function ReviewCard({ card, isFlipped, isMarkingKnown, isSavingDetails, onFlip, onMarkKnown, onSaveDetails }: ReviewCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-(--border) bg-[linear-gradient(180deg,color-mix(in_srgb,var(--bg-elevated)_92%,transparent),color-mix(in_srgb,var(--bg-surface)_92%,transparent))] p-5 shadow-(--shadow-soft)">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-(--text-muted)">Due now</p>
          <h2 className="mt-4 text-[32px] font-medium leading-[1.4] text-(--text-primary)">{card.front.surface}</h2>
          {card.back.romanization ? (
            <p className="mt-2 text-sm italic text-(--text-secondary)">{card.back.romanization}</p>
          ) : null}
        </div>
        <div className="rounded-full border border-(--border) bg-(--bg-surface) px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-(--text-secondary)">
          {card.front.fsrsState}
        </div>
      </div>

      {isFlipped ? (
        <div className="mt-6">
          <ReviewCardBack card={card} isMarkingKnown={isMarkingKnown} isSavingDetails={isSavingDetails} onMarkKnown={onMarkKnown} onSaveDetails={onSaveDetails} />
        </div>
      ) : (
        <div className="mt-6 rounded-[1.25rem] border border-dashed border-(--border) bg-[color-mix(in_srgb,var(--bg-surface)_72%,transparent)] p-5">
          <p className="text-sm leading-7 text-(--text-secondary)">
            Start from the front, recall the reading meaning and sentence feel, then flip only when you have committed to an answer.
          </p>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button onClick={onFlip} type="button" variant={isFlipped ? 'secondary' : 'primary'}>
          {isFlipped ? 'Answer revealed' : 'Reveal answer'}
        </Button>
      </div>
    </article>
  )
}