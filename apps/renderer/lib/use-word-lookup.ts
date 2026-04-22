"use client";

import { useRef, useState } from "react";

import {
  createLookupUnavailableResult,
  createReviewCaptureUnavailableResult,
  type AddToDeckResult,
  type WordLookupResult,
} from "@sona/domain/content";
import type { WordStudyStatus } from "@sona/domain/contracts/content-review";
import type { WindowSona } from "@sona/domain/contracts/window-sona";

const GRAMMAR_EXPLANATION_FALLBACK =
  "A richer grammar explanation is unavailable right now. Continue reading and try again later.";

interface LookupTarget {
  anchorElement: HTMLElement;
  blockId: string;
  sentenceContext: string;
  token: string;
  tokenIndex: number;
}

function getReadingApi(): WindowSona["reading"] | null {
  if (typeof window === "undefined" || typeof window.sona === "undefined") {
    return null;
  }

  return window.sona.reading;
}

function getReviewApi(): WindowSona["review"] | null {
  if (typeof window === "undefined" || typeof window.sona === "undefined") {
    return null;
  }

  return window.sona.review;
}

export function useWordLookup() {
  const [target, setTarget] = useState<LookupTarget | null>(null);
  const [result, setResult] = useState<WordLookupResult | null>(null);
  const [studyStatus, setStudyStatus] = useState<WordStudyStatus | null>(null);
  const [addToDeckResult, setAddToDeckResult] =
    useState<AddToDeckResult | null>(null);
  const [isLoadingLookup, setIsLoadingLookup] = useState(false);
  const [isLoadingGrammar, setIsLoadingGrammar] = useState(false);
  const [isAddingToDeck, setIsAddingToDeck] = useState(false);
  const [isClearingKnown, setIsClearingKnown] = useState(false);
  const requestIdRef = useRef(0);

  async function openLookup(input: LookupTarget) {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setTarget(input);
    setResult(null);
    setStudyStatus(null);
    setAddToDeckResult(null);
    setIsLoadingLookup(true);

    const readingApi = getReadingApi();
    if (!readingApi) {
      setResult(createLookupUnavailableResult(input.token));
      setIsLoadingLookup(false);
      return;
    }

    try {
      const lookupResult = await readingApi.lookupWord({
        blockId: input.blockId,
        token: input.token,
        tokenIndex: input.tokenIndex,
        sentenceContext: input.sentenceContext,
      });

      const nextStudyStatus = await readingApi.getWordStudyStatus({
        canonicalForm: lookupResult.canonicalForm || input.token,
        surface: lookupResult.surface || input.token,
      });

      if (requestIdRef.current === requestId) {
        setResult(lookupResult);
        setStudyStatus(nextStudyStatus);
      }
    } catch {
      if (requestIdRef.current === requestId) {
        setResult(createLookupUnavailableResult(input.token));
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoadingLookup(false);
      }
    }
  }

  async function requestGrammarExplanation() {
    if (!target || isLoadingGrammar) {
      return;
    }

    setIsLoadingGrammar(true);
    const readingApi = getReadingApi();
    if (!readingApi) {
      setResult((current) =>
        current
          ? {
              ...current,
              grammarExplanation:
                current.grammarExplanation ?? GRAMMAR_EXPLANATION_FALLBACK,
            }
          : {
              ...createLookupUnavailableResult(target.token),
              grammarExplanation: GRAMMAR_EXPLANATION_FALLBACK,
            },
      );
      setIsLoadingGrammar(false);
      return;
    }

    try {
      const grammarInput = {
        blockId: target.blockId,
        token: target.token,
        tokenIndex: target.tokenIndex,
        sentenceContext: target.sentenceContext,
        ...(result?.canonicalForm
          ? { canonicalForm: result.canonicalForm }
          : {}),
      };

      const grammarResult = await readingApi.explainGrammar(grammarInput);
      setResult(grammarResult);
    } catch {
      setResult((current) =>
        current
          ? {
              ...current,
              grammarExplanation:
                current.grammarExplanation ?? GRAMMAR_EXPLANATION_FALLBACK,
            }
          : {
              ...createLookupUnavailableResult(target.token),
              grammarExplanation: GRAMMAR_EXPLANATION_FALLBACK,
            },
      );
    } finally {
      setIsLoadingGrammar(false);
    }
  }

  async function addToDeck() {
    if (!target || isAddingToDeck || studyStatus?.eligibility !== "eligible") {
      return;
    }

    setIsAddingToDeck(true);
    const readingApi = getReadingApi();
    if (!readingApi) {
      setAddToDeckResult(
        createReviewCaptureUnavailableResult(
          "The desktop reading bridge is unavailable. No review card was created.",
        ),
      );
      setIsAddingToDeck(false);
      return;
    }

    try {
      const addResult = await readingApi.addToDeck({
        blockId: target.blockId,
        token: target.token,
        canonicalForm: result?.canonicalForm ?? target.token,
        sentenceContext: target.sentenceContext,
        meaning: result?.meaning ?? null,
        grammarPattern: result?.pattern ?? null,
        grammarDetails: buildGrammarDetails(result),
        romanization: result?.romanization ?? null,
        sentenceTranslation: result?.sentenceTranslation ?? null,
      });

      setAddToDeckResult(addResult);
    } catch {
      setAddToDeckResult(
        createReviewCaptureUnavailableResult(
          "The selected word could not be saved to your review deck.",
        ),
      );
    } finally {
      setIsAddingToDeck(false);
    }
  }

  async function clearKnownStatus() {
    if (
      !target ||
      !result ||
      !studyStatus ||
      studyStatus.eligibility !== "known-word" ||
      isClearingKnown
    ) {
      return;
    }

    const readingApi = getReadingApi();
    const reviewApi = getReviewApi();
    if (!readingApi || !reviewApi) {
      return;
    }

    setIsClearingKnown(true);

    try {
      await reviewApi.clearKnownWord({
        canonicalForm: result.canonicalForm || target.token,
        reviewCardId: studyStatus.reviewCardId,
      });

      const nextStudyStatus = await readingApi.getWordStudyStatus({
        canonicalForm: result.canonicalForm || target.token,
        surface: result.surface || target.token,
      });
      setStudyStatus(nextStudyStatus);
    } finally {
      setIsClearingKnown(false);
    }
  }

  function dismissLookup() {
    requestIdRef.current += 1;
    setTarget(null);
    setResult(null);
    setStudyStatus(null);
    setAddToDeckResult(null);
    setIsLoadingLookup(false);
    setIsLoadingGrammar(false);
    setIsAddingToDeck(false);
  }

  return {
    target,
    result,
    studyStatus,
    addToDeckResult,
    isOpen: Boolean(target),
    isLoadingLookup,
    isLoadingGrammar,
    isAddingToDeck,
    isClearingKnown,
    openLookup,
    addToDeck,
    clearKnownStatus,
    requestGrammarExplanation,
    dismissLookup,
  };
}

function buildGrammarDetails(result: WordLookupResult | null): string | null {
  if (!result) {
    return null;
  }

  const registerDetail =
    result.register.trim().length > 0 ? `${result.register} register.` : null;
  const explanationDetail = result.grammarExplanation?.trim() || null;

  return (
    [registerDetail, explanationDetail]
      .filter((value): value is string => Boolean(value))
      .join(" ") || null
  );
}
