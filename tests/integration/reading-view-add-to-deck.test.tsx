// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ReadingView } from '../../apps/renderer/components/reading/reading-view.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

function installReadingWindowSona(addToDeckResult: { disposition: 'created' | 'duplicate-blocked' | 'deferred'; reviewCardId: string | null; message: string }) {
  const addToDeck = vi.fn(async () => addToDeckResult)

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
      getReadingSession: vi.fn(async () => ({
        contentItemId: 'item-1',
        itemTitle: 'Review capture',
        provenanceLabel: 'Article paste',
        provenanceDetail: 'Used for add-to-deck validation.',
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
      saveReadingProgress: vi.fn(async () => undefined),
      flushExposureLog: vi.fn(async () => ({ written: 0 })),
    },
  } as unknown as WindowSona

  return { addToDeck }
}

describe('reading view add-to-deck integration', () => {
  afterEach(() => {
    cleanup()
  })

  it('creates a review card from the lookup popup and shows the saved message', async () => {
    const user = userEvent.setup()
    const { addToDeck } = installReadingWindowSona({
      disposition: 'created',
      reviewCardId: 'card-1',
      message: 'Added 천천히 to your review deck with source context preserved.',
    })

    render(<ReadingView contentItemId="item-1" onBack={vi.fn()} />)

    await user.click(await screen.findByRole('button', { name: '천천히' }))
    await user.click(await screen.findByRole('button', { name: 'Add to deck +' }))

    expect(addToDeck).toHaveBeenCalledWith({
      blockId: 'block-1',
      token: '천천히',
      canonicalForm: '천천히',
      sentenceContext: '오늘도 천천히 읽어요',
    })
    expect(await screen.findByText('Added 천천히 to your review deck with source context preserved.')).toBeInTheDocument()
  })

  it('shows duplicate-blocked messaging without throwing when the selected word is already active', async () => {
    const user = userEvent.setup()
    installReadingWindowSona({
      disposition: 'duplicate-blocked',
      reviewCardId: 'card-existing',
      message: '천천히 is already active in your review deck. No duplicate card was created.',
    })

    render(<ReadingView contentItemId="item-1" onBack={vi.fn()} />)

    await user.click(await screen.findByRole('button', { name: '천천히' }))
    await user.click(await screen.findByRole('button', { name: 'Add to deck +' }))

    expect(await screen.findByText('천천히 is already active in your review deck. No duplicate card was created.')).toBeInTheDocument()
  })
})