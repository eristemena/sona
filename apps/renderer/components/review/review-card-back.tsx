'use client'

import { Volume2 } from "lucide-react";
import { useEffect, useState } from 'react'

import type { ReviewQueueCard } from '@sona/domain/content'

import { Button } from '../ui/button'

interface ReviewCardBackProps {
  card: ReviewQueueCard;
  isMarkingKnown: boolean;
  isSavingDetails: boolean;
  canReplaySentenceAudio: boolean;
  showSentenceAudioControl: boolean;
  onMarkKnown: () => Promise<void>;
  onReplaySentenceAudio: () => Promise<void>;
  onSaveDetails: (input: {
    meaning: string | null;
    grammarPattern: string | null;
    grammarDetails: string | null;
  }) => Promise<void>;
}

export function ReviewCardBack({
  card,
  isMarkingKnown,
  isSavingDetails,
  canReplaySentenceAudio,
  showSentenceAudioControl,
  onMarkKnown,
  onReplaySentenceAudio,
  onSaveDetails,
}: ReviewCardBackProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [meaning, setMeaning] = useState(card.back.meaning ?? "");
  const [grammarPattern, setGrammarPattern] = useState(
    card.back.grammarPattern ?? "",
  );
  const [grammarDetails, setGrammarDetails] = useState(
    card.back.grammarDetails ?? "",
  );

  useEffect(() => {
    setMeaning(card.back.meaning ?? "");
    setGrammarPattern(card.back.grammarPattern ?? "");
    setGrammarDetails(card.back.grammarDetails ?? "");
    setIsEditing(false);
  }, [card]);

  async function handleSave() {
    await onSaveDetails({
      meaning: normalizeField(meaning),
      grammarPattern: normalizeField(grammarPattern),
      grammarDetails: normalizeField(grammarDetails),
    });
  }

  if (isEditing) {
    return (
      <div className="space-y-4 rounded-[1.25rem] border border-(--border) bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] p-4 panel-enter">
        <div className="space-y-2">
          <label
            className="block text-xs font-medium uppercase tracking-[0.22em] text-(--text-muted)"
            htmlFor="review-card-meaning"
          >
            Meaning
          </label>
          <textarea
            className="min-h-24 w-full rounded-xl border border-(--border) bg-(--bg-surface) px-3 py-2 text-sm text-(--text-primary) outline-none focus:border-(--accent)"
            id="review-card-meaning"
            onChange={(event) => setMeaning(event.target.value)}
            value={meaning}
          />
        </div>

        <div className="space-y-2">
          <label
            className="block text-xs font-medium uppercase tracking-[0.22em] text-(--text-muted)"
            htmlFor="review-card-grammar-pattern"
          >
            Grammar pattern
          </label>
          <input
            className="w-full rounded-xl border border-(--border) bg-(--bg-surface) px-3 py-2 text-sm text-(--text-primary) outline-none focus:border-(--accent)"
            id="review-card-grammar-pattern"
            onChange={(event) => setGrammarPattern(event.target.value)}
            value={grammarPattern}
          />
        </div>

        <div className="space-y-2">
          <label
            className="block text-xs font-medium uppercase tracking-[0.22em] text-(--text-muted)"
            htmlFor="review-card-grammar-details"
          >
            Grammar details
          </label>
          <textarea
            className="min-h-24 w-full rounded-xl border border-(--border) bg-(--bg-surface) px-3 py-2 text-sm text-(--text-primary) outline-none focus:border-(--accent)"
            id="review-card-grammar-details"
            onChange={(event) => setGrammarDetails(event.target.value)}
            value={grammarDetails}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            disabled={isSavingDetails}
            onClick={() => setIsEditing(false)}
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            disabled={isSavingDetails}
            onClick={() => void handleSave()}
            type="button"
            variant="primary"
          >
            {isSavingDetails ? "Saving…" : "Save details"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[1.25rem] border border-(--border) bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] p-4 panel-enter">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">
          Meaning
        </p>
        <p className="mt-2 text-[17px] leading-7 text-(--text-primary)">
          {card.back.meaning ??
            "No saved meaning yet. Add one so this card stays useful offline."}
        </p>
        {card.back.romanization ? (
          <div className="mt-2 flex items-center gap-2">
            <p className="text-sm italic text-(--text-secondary)">
              {card.back.romanization}
            </p>
            {showSentenceAudioControl ? (
              <button
                aria-label="Replay sentence audio"
                className="inline-flex h-4 w-4 items-center justify-center text-(--text-muted) disabled:opacity-50"
                disabled={!canReplaySentenceAudio}
                onClick={() => void onReplaySentenceAudio()}
                type="button"
              >
                <Volume2 aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {card.back.grammarPattern ? (
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">
            Pattern
          </p>
          <p className="mt-2 text-sm text-(--text-secondary)">
            {card.back.grammarPattern}
          </p>
        </div>
      ) : null}

      {card.back.grammarDetails ? (
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">
            Grammar details
          </p>
          <p className="mt-2 text-sm leading-6 text-(--text-secondary)">
            {card.back.grammarDetails}
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[color-mix(in_srgb,var(--bg-surface)_86%,transparent)] p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">
          Captured from reading
        </p>
        <p className="mt-3 text-sm leading-7 text-(--text-primary)">
          {card.back.sentenceContext ?? "Source sentence is unavailable."}
        </p>
        {card.back.sentenceTranslation ? (
          <p className="mt-2 text-sm italic leading-6 text-(--text-secondary)">
            {card.back.sentenceTranslation}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end gap-3">
        <Button
          disabled={isMarkingKnown}
          onClick={() => void onMarkKnown()}
          type="button"
          variant="ghost"
        >
          {isMarkingKnown ? "Saving known word…" : "Mark known"}
        </Button>
        <Button
          onClick={() => setIsEditing(true)}
          type="button"
          variant="secondary"
        >
          Edit details
        </Button>
      </div>
    </div>
  );
}

function normalizeField(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}