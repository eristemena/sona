'use client'

import type { ReviewRating } from '@sona/domain/content'

import { Button } from '../ui/button'

const RATING_BUTTONS: Array<{
  rating: ReviewRating
  label: string
  hint: string
}> = [
  { rating: 'again', label: 'Again', hint: 'Still missed it' },
  { rating: 'hard', label: 'Hard', hint: 'Needed a long pause' },
  { rating: 'good', label: 'Good', hint: 'Recall was steady' },
  { rating: 'easy', label: 'Easy', hint: 'Instant recall' },
]

interface ReviewRatingGridProps {
  disabled?: boolean
  onRate: (rating: ReviewRating) => void
}

export function ReviewRatingGrid({ disabled = false, onRate }: ReviewRatingGridProps) {
  return (
    <div aria-label="Recall rating" className="grid grid-cols-2 gap-3" role="group">
      {RATING_BUTTONS.map((option) => (
        <Button
          className="h-auto min-h-19 items-start justify-start rounded-[1.1rem] px-4 py-3 text-left"
          disabled={disabled}
          key={option.rating}
          onClick={() => onRate(option.rating)}
          type="button"
          variant={option.rating === 'again' ? 'danger' : option.rating === 'good' ? 'primary' : 'secondary'}
        >
          <span className="space-y-1">
            <span className="block text-sm font-semibold">{option.label}</span>
            <span className="block text-xs text-(--text-secondary)">{option.hint}</span>
          </span>
        </Button>
      ))}
    </div>
  )
}