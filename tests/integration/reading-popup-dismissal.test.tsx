// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ReadingView } from '../../apps/renderer/components/reading/reading-view.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

describe('reading popup dismissal integration', () => {
  afterEach(() => {
    cleanup()
  })

  it('dismisses the anchored lookup popup when the learner clicks outside it', async () => {
    const user = userEvent.setup()

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
          itemTitle: 'Dismiss popup',
          provenanceLabel: 'Article paste',
          provenanceDetail: 'Popup dismissal validation.',
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
        addToDeck: vi.fn(),
        saveReadingProgress: vi.fn(async () => undefined),
        flushExposureLog: vi.fn(async () => ({ written: 0 })),
      },
    } as unknown as WindowSona

    render(<ReadingView contentItemId="item-1" onBack={vi.fn()} />)

    await user.click(await screen.findByRole('button', { name: '천천히' }))
    expect(await screen.findByRole('dialog', { name: '천천히' })).toBeInTheDocument()

    await user.click(document.body)

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '천천히' })).not.toBeInTheDocument()
    })
  })
})