"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";

import type { WordStudyStatus } from "@sona/domain/contracts/content-review";

import { Button } from "../ui/button";

interface WordLookupPopupProps {
  addToDeckResult: {
    disposition: "created" | "duplicate-blocked" | "deferred";
    message: string;
    reviewCardId: string | null;
  } | null;
  isAddingToDeck: boolean;
  isClearingKnown: boolean;
  isLoadingGrammar: boolean;
  isLoadingLookup: boolean;
  isOpen: boolean;
  lookupResult: {
    cacheState: string;
    canonicalForm: string;
    meaning: string;
    grammarExplanation: string | null;
    pattern: string;
    register: string;
    sentenceTranslation: string;
    modelId: string | null;
    romanization: string;
    surface: string;
  } | null;
  studyStatus: WordStudyStatus | null;
  onAddToDeck: () => void;
  onClearKnownStatus: () => void;
  onDismiss: () => void;
  onRequestGrammarExplanation: () => void;
  target: {
    anchorElement: HTMLElement;
    token: string;
  } | null;
}

export function WordLookupPopup({
  addToDeckResult,
  isAddingToDeck,
  isClearingKnown,
  isLoadingGrammar,
  isLoadingLookup,
  isOpen,
  lookupResult,
  studyStatus,
  onAddToDeck,
  onClearKnownStatus,
  onDismiss,
  onRequestGrammarExplanation,
  target,
}: WordLookupPopupProps) {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const POPUP_WIDTH = 328;
  const POPUP_VERTICAL_SPACE = 292;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const eventTarget = event.target as Node | null;
      if (!eventTarget) {
        return;
      }

      if (popupRef.current?.contains(eventTarget)) {
        return;
      }

      if (target?.anchorElement.contains(eventTarget)) {
        return;
      }

      onDismiss();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onDismiss();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onDismiss, target]);

  const popupStyle = useMemo(() => {
    if (!target) {
      return undefined;
    }

    const rect = target.anchorElement.getBoundingClientRect();
    const viewportWidth =
      typeof window === "undefined" ? 1280 : window.innerWidth;
    const viewportHeight =
      typeof window === "undefined" ? 720 : window.innerHeight;
    const width = Math.min(POPUP_WIDTH, viewportWidth - 32);
    const left = Math.min(
      Math.max(16, rect.left),
      Math.max(16, viewportWidth - width - 16),
    );
    const shouldFlipAbove = rect.bottom > viewportHeight - POPUP_VERTICAL_SPACE;

    return {
      left,
      top: shouldFlipAbove
        ? Math.max(16, rect.top - (POPUP_VERTICAL_SPACE - 52))
        : rect.bottom + 12,
      width,
    };
  }, [target]);

  const suppressionState = resolveSuppressionState(studyStatus);
  const addToDeckLabel =
    suppressionState?.label ??
    (addToDeckResult?.disposition === "created"
      ? "Added"
      : addToDeckResult?.disposition === "duplicate-blocked"
        ? "Already known"
        : addToDeckResult?.disposition === "deferred"
          ? "Deferred"
          : "Add to deck +");

  const popup = (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          aria-labelledby="word-lookup-title"
          aria-modal="false"
          className="fixed z-100 rounded-lg border border-(--border) bg-(--bg-elevated) p-4 text-left shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
          exit={{ opacity: 0, y: 8 }}
          initial={{ opacity: 0, y: 8 }}
          key="word-lookup-popup"
          ref={popupRef}
          role="dialog"
          {...(popupStyle ? { style: popupStyle } : {})}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0">
              <h3
                className="text-[18px] font-semibold text-(--text-primary)"
                id="word-lookup-title"
              >
                {target?.token ?? lookupResult?.surface ?? "Selected word"}
              </h3>
              {lookupResult?.romanization ? (
                <p className="mt-1 text-[13px] italic text-(--text-secondary)">
                  {lookupResult.romanization}
                </p>
              ) : null}
              {!lookupResult && isLoadingLookup ? (
                <p className="mt-1 text-[13px] italic text-(--text-secondary)">
                  Looking up...
                </p>
              ) : null}
            </div>
            <Button
              aria-label="Close word lookup"
              className="h-7 w-7 rounded-md px-0 text-(--text-secondary) hover:text-(--text-primary)"
              onClick={onDismiss}
              variant="ghost"
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          </div>

          {isLoadingLookup ? (
            <p
              aria-live="polite"
              className="mt-3 text-[15px] text-(--text-primary)"
            >
              Finding this word in context.
            </p>
          ) : null}

          {lookupResult ? (
            <div className="mt-3 space-y-3">
              <p className="text-[15px] text-(--text-primary)">
                {lookupResult.meaning}
              </p>

              <div className="border-t border-(--border) pt-3">
                <p className="text-[13px] text-(--text-muted)">
                  {lookupResult.pattern} · {lookupResult.register}
                </p>
              </div>

              <p className="text-[13px] italic leading-5 text-(--text-secondary)">
                {lookupResult.sentenceTranslation}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  className="h-10 w-full whitespace-nowrap rounded-md border-(--border) bg-[color-mix(in_srgb,var(--bg-surface)_88%,var(--bg-elevated))] px-4 text-[14px] text-(--text-primary) shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:bg-[color-mix(in_srgb,var(--accent-subtle)_85%,var(--bg-surface))] hover:text-(--text-primary)"
                  disabled={isLoadingGrammar}
                  onClick={onRequestGrammarExplanation}
                  variant="ghost"
                >
                  Explain grammar
                </Button>
                <Button
                  className={
                    addToDeckResult?.disposition === "created"
                      ? "h-10 w-full whitespace-nowrap rounded-md border-(--success) bg-[color-mix(in_srgb,var(--success)_12%,var(--bg-elevated))] px-4 text-[14px] text-(--success) shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                      : "h-10 w-full whitespace-nowrap rounded-md bg-[color-mix(in_srgb,var(--bg-base)_28%,var(--bg-elevated))] px-4 text-[14px] shadow-[0_10px_24px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.03)]"
                  }
                  disabled={
                    isAddingToDeck ||
                    Boolean(addToDeckResult) ||
                    Boolean(suppressionState)
                  }
                  onClick={onAddToDeck}
                  variant="secondary"
                >
                  {isAddingToDeck ? "Saving..." : addToDeckLabel}
                </Button>
              </div>

              {studyStatus?.eligibility === "known-word" ? (
                <div className="pt-1">
                  <Button
                    className="h-10 w-full rounded-md"
                    disabled={isClearingKnown}
                    onClick={onClearKnownStatus}
                    type="button"
                    variant="ghost"
                  >
                    {isClearingKnown ? "Clearing..." : "Clear known status"}
                  </Button>
                </div>
              ) : null}

              {isLoadingGrammar ? (
                <div
                  className="space-y-2 border-t border-(--border) pt-3"
                  aria-live="polite"
                >
                  <div className="h-3 w-20 rounded bg-[color-mix(in_srgb,var(--text-muted)_32%,transparent)]" />
                  <div className="h-3 w-full rounded bg-[color-mix(in_srgb,var(--text-muted)_18%,transparent)]" />
                  <div className="h-3 w-5/6 rounded bg-[color-mix(in_srgb,var(--text-muted)_18%,transparent)]" />
                </div>
              ) : lookupResult.grammarExplanation ? (
                <div className="space-y-3 border-t border-(--border) pt-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-(--text-muted)">
                    Grammar note
                  </p>
                  <p className="text-[14px] leading-[1.6] text-(--text-primary)">
                    {lookupResult.grammarExplanation}
                  </p>
                </div>
              ) : null}

              {addToDeckResult ? (
                <p
                  aria-live="polite"
                  className="text-[13px] text-(--text-secondary)"
                >
                  {addToDeckResult.message}
                </p>
              ) : suppressionState ? (
                <p
                  aria-live="polite"
                  className="text-[13px] text-(--text-secondary)"
                >
                  {suppressionState.message}
                </p>
              ) : null}
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  if (typeof document === "undefined") {
    return popup;
  }

  return createPortal(popup, document.body);
}

function resolveSuppressionState(
  studyStatus: WordStudyStatus | null,
): { label: string; message: string } | null {
  if (!studyStatus || studyStatus.eligibility === "eligible") {
    return null;
  }

  switch (studyStatus.eligibility) {
    case "known-word":
      return {
        label: "Known word",
        message:
          "This word is already covered in your known-word list, so it is not shown as a fresh deck candidate.",
      };
    case "already-in-deck":
      return {
        label: "Already in deck",
        message:
          "This word already has an active review card, so it is not offered again here.",
      };
    case "deferred":
      return {
        label: "Deferred",
        message:
          "This word is already saved with deferred activation and will return when your new-card pacing allows it.",
      };
    default:
      return null;
  }
}
