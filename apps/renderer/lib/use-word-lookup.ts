'use client'

import { useRef, useState } from 'react'

import { createLookupUnavailableResult, createReviewCaptureUnavailableResult, type AddToDeckResult, type WordLookupResult } from '@sona/domain/content'
import type { WindowSona } from '@sona/domain/contracts/window-sona'

const GRAMMAR_EXPLANATION_FALLBACK = 'A richer grammar explanation is unavailable right now. Continue reading and try again later.'

interface LookupTarget {
  anchorElement: HTMLElement
  blockId: string
  sentenceContext: string
  token: string
  tokenIndex: number
}

function getReadingApi(): WindowSona['reading'] | null {
  if (typeof window === 'undefined' || typeof window.sona === 'undefined') {
    return null
  }

  return window.sona.reading
}

export function useWordLookup() {
  const [target, setTarget] = useState<LookupTarget | null>(null)
  const [result, setResult] = useState<WordLookupResult | null>(null)
  const [addToDeckResult, setAddToDeckResult] = useState<AddToDeckResult | null>(null)
  const [isLoadingLookup, setIsLoadingLookup] = useState(false)
  const [isLoadingGrammar, setIsLoadingGrammar] = useState(false)
  const [isAddingToDeck, setIsAddingToDeck] = useState(false)
  const requestIdRef = useRef(0)

  async function openLookup(input: LookupTarget) {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    setTarget(input)
    setResult(null)
    setAddToDeckResult(null)
    setIsLoadingLookup(true)

    const readingApi = getReadingApi()
    if (!readingApi) {
      setResult(createLookupUnavailableResult(input.token))
      setIsLoadingLookup(false)
      return
    }

    try {
      const lookupResult = await readingApi.lookupWord({
        blockId: input.blockId,
        token: input.token,
        tokenIndex: input.tokenIndex,
        sentenceContext: input.sentenceContext,
      })

      if (requestIdRef.current === requestId) {
        setResult(lookupResult)
      }
    } catch {
      if (requestIdRef.current === requestId) {
        setResult(createLookupUnavailableResult(input.token))
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoadingLookup(false)
      }
    }
  }

  async function requestGrammarExplanation() {
    if (!target || isLoadingGrammar) {
      return
    }

    setIsLoadingGrammar(true)
    const readingApi = getReadingApi()
    if (!readingApi) {
      setResult((current) =>
        current
          ? {
              ...current,
              grammarExplanation: current.grammarExplanation ?? GRAMMAR_EXPLANATION_FALLBACK,
            }
          : {
              ...createLookupUnavailableResult(target.token),
              grammarExplanation: GRAMMAR_EXPLANATION_FALLBACK,
            },
      )
      setIsLoadingGrammar(false)
      return
    }

    try {
      const grammarInput = {
        blockId: target.blockId,
        token: target.token,
        tokenIndex: target.tokenIndex,
        sentenceContext: target.sentenceContext,
        ...(result?.canonicalForm ? { canonicalForm: result.canonicalForm } : {}),
      }

      const grammarResult = await readingApi.explainGrammar(grammarInput)
      setResult(grammarResult)
    } catch {
      setResult((current) =>
        current
          ? {
              ...current,
              grammarExplanation: current.grammarExplanation ?? GRAMMAR_EXPLANATION_FALLBACK,
            }
          : {
              ...createLookupUnavailableResult(target.token),
              grammarExplanation: GRAMMAR_EXPLANATION_FALLBACK,
            },
      )
    } finally {
      setIsLoadingGrammar(false)
    }
  }

  async function addToDeck() {
    if (!target || isAddingToDeck) {
      return
    }

    setIsAddingToDeck(true)
    const readingApi = getReadingApi()
    if (!readingApi) {
      setAddToDeckResult(createReviewCaptureUnavailableResult('The desktop reading bridge is unavailable. No review card was created.'))
      setIsAddingToDeck(false)
      return
    }

    try {
      const addResult = await readingApi.addToDeck({
        blockId: target.blockId,
        token: target.token,
        canonicalForm: result?.canonicalForm ?? target.token,
        sentenceContext: target.sentenceContext,
      })

      setAddToDeckResult(addResult)
    } catch {
      setAddToDeckResult(createReviewCaptureUnavailableResult('The selected word could not be saved to your review deck.'))
    } finally {
      setIsAddingToDeck(false)
    }
  }

  function dismissLookup() {
    requestIdRef.current += 1
    setTarget(null)
    setResult(null)
    setAddToDeckResult(null)
    setIsLoadingLookup(false)
    setIsLoadingGrammar(false)
    setIsAddingToDeck(false)
  }

  return {
    target,
    result,
    addToDeckResult,
    isOpen: Boolean(target),
    isLoadingLookup,
    isLoadingGrammar,
    isAddingToDeck,
    openLookup,
    addToDeck,
    requestGrammarExplanation,
    dismissLookup,
  }
}