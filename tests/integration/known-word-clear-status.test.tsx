// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ReadingView } from '../../apps/renderer/components/reading/reading-view.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

function installReadingWindowSona() {
  let studyStatusVersion = 0
  const addToDeck = vi.fn(async () => ({
    disposition: 'created' as const,
    reviewCardId: 'card-1',
    message: 'Added 천천히 to your review deck with source context preserved.',
  }))
  const clearKnownWord = vi.fn(async () => {
    studyStatusVersion = 1
    return {
      canonicalForm: '천천히',
      affectedReviewCardId: null,
      activationState: null,
    }
  })
  const getWordStudyStatus = vi.fn(async () =>
    studyStatusVersion === 0
      ? {
          canonicalForm: '천천히',
          eligibility: 'known-word' as const,
          reviewCardId: null,
          knownWordSource: 'topik_seed' as const,
        }
      : {
          canonicalForm: '천천히',
          eligibility: 'eligible' as const,
          reviewCardId: null,
          knownWordSource: null,
        },
  )

  window.sona = {
    shell: { getBootstrapState: vi.fn() },
    settings: {
      getThemePreference: vi.fn(),
      setThemePreference: vi.fn(),
      subscribeThemeChanges: vi.fn(() => () => undefined),
      getOpenAiApiKeyStatus: vi.fn(async () => ({ configured: false })),
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
      getReadingSession: vi.fn(async () => ({
        contentItemId: 'item-1',
        itemTitle: 'Known word reset',
        provenanceLabel: 'Article paste',
        provenanceDetail: 'Used for clear-known validation.',
        blocks: [
          {
            id: 'block-1',
            contentItemId: 'item-1',
            korean: '오늘도 천천히 읽어요',
            romanization: null,
            audioOffset: null,
            sentenceOrdinal: 1,
            tokens: [
              { index: 0, surface: '오늘도' },
              { index: 1, surface: '천천히' },
              { index: 2, surface: '읽어요' },
            ],
          },
        ],
        progress: {
          activeBlockId: 'block-1',
          playbackState: 'idle',
          playbackRate: 1,
          currentTimeMs: 0,
          highlightedTokenIndex: null,
        },
      })),
      ensureBlockAudio: vi.fn(async () => ({
        blockId: 'block-1',
        state: 'unavailable',
        audioFilePath: null,
        durationMs: null,
        modelId: 'gpt-4o-mini-tts',
        voice: 'alloy',
        fromCache: false,
        timings: [],
        failureMessage: 'Audio is optional for this test.',
      })),
      lookupWord: vi.fn(async () => ({
        canonicalForm: '천천히',
        surface: '천천히',
        meaning: 'slowly in this sentence',
        romanization: 'cheoncheonhi',
        pattern: 'Adverbial pacing',
        register: 'Neutral',
        sentenceTranslation: 'Even today, I read slowly.',
        grammarExplanation: null,
        cacheState: 'fresh',
        modelId: 'openai/gpt-4o-mini',
      })),
      explainGrammar: vi.fn(async () => ({
        canonicalForm: '천천히',
        surface: '천천히',
        meaning: 'slowly in this sentence',
        romanization: 'cheoncheonhi',
        pattern: 'Adverbial pacing',
        register: 'Neutral',
        sentenceTranslation: 'Even today, I read slowly.',
        grammarExplanation: 'It describes how the learner reads.',
        cacheState: 'fresh',
        modelId: 'openai/gpt-4o-mini',
      })),
      addToDeck,
      getWordStudyStatus,
      saveReadingProgress: vi.fn(async () => undefined),
      flushExposureLog: vi.fn(async () => ({ written: 0 })),
    },
    review: {
      getQueue: vi.fn(),
      submitRating: vi.fn(),
      updateCardDetails: vi.fn(),
      getKnownWordOnboardingStatus: vi.fn(),
      completeKnownWordOnboarding: vi.fn(),
      markKnownWord: vi.fn(),
      clearKnownWord,
    },
  } as unknown as WindowSona

  return { addToDeck, clearKnownWord, getWordStudyStatus }
}

describe('known word clear status', () => {
  afterEach(() => {
    cleanup()
  })

  it('restores a known word to normal capture eligibility from the reading popup', async () => {
    const user = userEvent.setup()
    const { addToDeck, clearKnownWord, getWordStudyStatus } = installReadingWindowSona()

    render(<ReadingView contentItemId="item-1" onBack={vi.fn()} />)

    await user.click(await screen.findByRole('button', { name: '천천히' }))
    expect(await screen.findByRole('button', { name: 'Known word' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Clear known status' }))

    expect(clearKnownWord).toHaveBeenCalledWith({
      canonicalForm: '천천히',
      reviewCardId: null,
    })

    await waitFor(() => {
      expect(getWordStudyStatus).toHaveBeenCalledTimes(2)
      expect(screen.getByRole('button', { name: 'Add to deck +' })).toBeEnabled()
    })

    await user.click(screen.getByRole('button', { name: 'Add to deck +' }))
    expect(addToDeck).toHaveBeenCalledTimes(1)
  })
})