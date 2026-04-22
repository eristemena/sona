// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ReviewScreen } from '../../apps/renderer/components/review/review-screen.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

function installReviewWindowSona() {
  let queueVersion = 0
  const markKnownWord = vi.fn(async () => {
    queueVersion = 1
    return {
      canonicalForm: '천천히',
      source: 'manual' as const,
      affectedReviewCardId: 'card-1',
    }
  })
  const clearKnownWord = vi.fn(async () => {
    queueVersion = 2
    return {
      canonicalForm: '천천히',
      affectedReviewCardId: 'card-1',
      activationState: 'active' as const,
    }
  })

  const getQueue = vi.fn(async () => {
    if (queueVersion === 1) {
      return {
        generatedAt: 1_716_530_000_001,
        dueCount: 0,
        sessionLimit: 50,
        cards: [],
      }
    }

    return {
      generatedAt: 1_716_530_000_000 + queueVersion,
      dueCount: 1,
      sessionLimit: 50,
      cards: [
        {
          front: {
            id: 'card-1',
            surface: '천천히',
            canonicalForm: '천천히',
            dueAt: 1_716_520_000_000,
            fsrsState: 'Review',
          },
          back: {
            meaning: 'slowly',
            grammarPattern: 'Adverbial pacing',
            grammarDetails: 'Softens the tempo of the sentence.',
            romanization: 'cheoncheonhi',
            sentenceContext: '오늘도 천천히 읽어요',
            sentenceTranslation: 'Even today, I read slowly.',
            provenance: {
              sourceBlockId: 'block-1',
              sourceContentItemId: 'item-1',
              sentenceContextHash: 'ctx-1',
            },
          },
          activationState: 'active' as const,
        },
      ],
    }
  })

  window.sona = {
    shell: { getBootstrapState: vi.fn() },
    settings: {
      getThemePreference: vi.fn(),
      setThemePreference: vi.fn(),
      subscribeThemeChanges: vi.fn(() => () => undefined),
    },
    content: {
      listLibraryItems: vi.fn(),
      getContentBlocks: vi.fn(),
      browseSubtitleFile: vi.fn(),
      importSrt: vi.fn(),
      createArticleFromPaste: vi.fn(),
      createArticleFromUrl: vi.fn(),
      generatePracticeSentences: vi.fn(),
      deleteContent: vi.fn(),
    },
    reading: {
      getReadingSession: vi.fn(),
      ensureBlockAudio: vi.fn(),
      lookupWord: vi.fn(),
      explainGrammar: vi.fn(),
      addToDeck: vi.fn(),
      getWordStudyStatus: vi.fn(),
      saveReadingProgress: vi.fn(),
      flushExposureLog: vi.fn(),
    },
    review: {
      getQueue,
      submitRating: vi.fn(),
      updateCardDetails: vi.fn(),
      getKnownWordOnboardingStatus: vi.fn(),
      completeKnownWordOnboarding: vi.fn(),
      markKnownWord,
      clearKnownWord,
    },
  } as unknown as WindowSona

  return { markKnownWord, clearKnownWord, getQueue }
}

describe('review card known-word undo', () => {
  afterEach(() => {
    cleanup()
  })

  it('lets the learner mark the current review card as known and undo that action from the review shell', async () => {
    const user = userEvent.setup()
    const { markKnownWord, clearKnownWord, getQueue } = installReviewWindowSona()

    render(<ReviewScreen />)

    await screen.findByRole('heading', { name: '천천히' })
    await user.click(screen.getByRole('button', { name: 'Reveal answer' }))
    await user.click(screen.getByRole('button', { name: 'Mark known' }))

    expect(markKnownWord).toHaveBeenCalledWith({
      canonicalForm: '천천히',
      surface: '천천히',
      source: 'manual',
      sourceDetail: 'Marked from review.',
      reviewCardId: 'card-1',
    })

    expect(await screen.findByText('Marked 천천히 as known.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Undo known word' }))

    expect(clearKnownWord).toHaveBeenCalledWith({
      canonicalForm: '천천히',
      reviewCardId: 'card-1',
    })

    await waitFor(() => {
      expect(getQueue).toHaveBeenCalledTimes(3)
      expect(screen.getByRole('heading', { name: '천천히' })).toBeInTheDocument()
    })
  })
})