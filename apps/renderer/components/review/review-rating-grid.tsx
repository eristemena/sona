'use client'

import type { ReviewRating } from '@sona/domain/content'

import { Button } from '../ui/button'

const RATING_BUTTONS: Array<{
  rating: ReviewRating;
  labelKo: string;
  labelEn: string;
}> = [
  { rating: "again", labelKo: "다시", labelEn: "Again" },
  { rating: "hard", labelKo: "어려움", labelEn: "Hard" },
  { rating: "good", labelKo: "좋음", labelEn: "Good" },
  { rating: "easy", labelKo: "쉬움", labelEn: "Easy" },
];

interface ReviewRatingGridProps {
  disabled?: boolean
  onRate: (rating: ReviewRating) => void
}

export function ReviewRatingGrid({ disabled = false, onRate }: ReviewRatingGridProps) {
  return (
    <div
      aria-label="Recall rating"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      role="group"
    >
      {RATING_BUTTONS.map((option) => (
        <Button
          aria-label={`${option.labelEn} ${option.labelKo}`}
          className="h-14 rounded-[1.1rem] px-3 py-2 text-center"
          disabled={disabled}
          key={option.rating}
          onClick={() => onRate(option.rating)}
          type="button"
          variant="secondary"
        >
          <span className="flex flex-col items-center justify-center leading-none">
            <span className="block text-sm font-semibold text-(--text-primary)">
              {option.labelKo}
            </span>
            <span className="mt-1 block text-[11px] font-normal text-(--text-secondary)">
              {option.labelEn}
            </span>
          </span>
        </Button>
      ))}
    </div>
  );
}