"use client";

import type { ReviewQueueCard } from "@sona/domain/content";

import { Button } from "../ui/button";
import { ReviewCardBack } from "./review-card-back";

interface ReviewCardProps {
  card: ReviewQueueCard;
  isFlipped: boolean;
  isMarkingKnown: boolean;
  isSavingDetails: boolean;
  canReplaySentenceAudio: boolean;
  showSentenceAudioControl: boolean;
  onFlip: () => void;
  onMarkKnown: () => Promise<void>;
  onReplaySentenceAudio: () => Promise<void>;
  onSaveDetails: (input: {
    meaning: string | null;
    grammarPattern: string | null;
    grammarDetails: string | null;
  }) => Promise<void>;
}

export function ReviewCard({
  card,
  isFlipped,
  isMarkingKnown,
  isSavingDetails,
  canReplaySentenceAudio,
  showSentenceAudioControl,
  onFlip,
  onMarkKnown,
  onReplaySentenceAudio,
  onSaveDetails,
}: ReviewCardProps) {
  const isSentenceCard = /\s/.test(card.front.surface.trim());

  return (
    <article className="rounded-[1.75rem] border border-(--border) bg-[linear-gradient(180deg,color-mix(in_srgb,var(--bg-elevated)_92%,transparent),color-mix(in_srgb,var(--bg-surface)_92%,transparent))] p-6 shadow-(--shadow-soft)">
      <div
        className={
          isFlipped ? "space-y-6" : "flex min-h-74 flex-col justify-between"
        }
      >
        <div
          className={
            isFlipped
              ? undefined
              : "flex flex-1 items-center justify-center text-center"
          }
        >
          <h2
            className={
              isSentenceCard
                ? "text-[20px] font-normal leading-[1.8] tracking-[0.02em] text-(--text-primary)"
                : "text-[32px] font-medium leading-[1.4] text-(--text-primary)"
            }
          >
            {card.front.surface}
          </h2>
        </div>

        {isFlipped ? (
          <ReviewCardBack
            card={card}
            isMarkingKnown={isMarkingKnown}
            isSavingDetails={isSavingDetails}
            canReplaySentenceAudio={canReplaySentenceAudio}
            showSentenceAudioControl={showSentenceAudioControl}
            onMarkKnown={onMarkKnown}
            onReplaySentenceAudio={onReplaySentenceAudio}
            onSaveDetails={onSaveDetails}
          />
        ) : null}

        <div className={isFlipped ? "flex justify-end" : "flex justify-center"}>
          <Button
            onClick={onFlip}
            type="button"
            variant={isFlipped ? "secondary" : "primary"}
          >
            {isFlipped ? "Answer revealed" : "Reveal answer"}
          </Button>
        </div>
      </div>
    </article>
  );
}