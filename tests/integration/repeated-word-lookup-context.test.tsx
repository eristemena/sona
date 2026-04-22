// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ReadingView } from '../../apps/renderer/components/reading/reading-view.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

describe('repeated word lookup context integration', () => {
  afterEach(() => {
    cleanup()
  })

  it('uses the tapped token occurrence when the same word appears multiple times in one sentence', async () => {
    const user = userEvent.setup()
    const lookupWord = vi.fn(async (input: { tokenIndex: number }) => ({
      canonicalForm: '오늘',
      surface: '오늘',
      meaning: input.tokenIndex === 2 ? 'the final today' : 'today',
      romanization: 'oneul',
      pattern: input.tokenIndex === 2 ? 'Emphatic repetition' : 'Time noun',
      register: 'Neutral',
      sentenceTranslation: 'Today, today, and then today again.',
      grammarExplanation: null,
      cacheState: 'fresh',
      modelId: 'openai/gpt-4o-mini',
    }))

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
          itemTitle: 'Repeated word context',
          provenanceLabel: 'Article paste',
          provenanceDetail: 'Repeated token validation.',
          blocks: [
            {
              id: 'block-1',
              contentItemId: 'item-1',
              korean: '오늘 오늘 또 오늘',
              romanization: null,
              audioOffset: null,
              sentenceOrdinal: 1,
              tokens: [
                { index: 0, surface: '오늘' },
                { index: 1, surface: '오늘' },
                { index: 2, surface: '오늘' },
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
        lookupWord,
        explainGrammar: vi.fn(async () => {
          throw new Error('not used')
        }),
        getWordStudyStatus: vi.fn(async () => ({
          eligibility: 'eligible' as const,
          reviewCardId: null,
        })),
        addToDeck: vi.fn(),
        saveReadingProgress: vi.fn(async () => undefined),
        flushExposureLog: vi.fn(async () => ({ written: 0 })),
      },
    } as unknown as WindowSona

    render(<ReadingView contentItemId="item-1" onBack={vi.fn()} />)

    const tokenButtons = await screen.findAllByRole('button', { name: '오늘' })
    await user.click(tokenButtons[2])

    expect(await screen.findByText('the final today')).toBeInTheDocument()
    expect(screen.getByText('Today, today, and then today again.')).toBeInTheDocument()
    expect(lookupWord).toHaveBeenCalledWith(
      expect.objectContaining({
        token: '오늘',
        tokenIndex: 2,
        sentenceContext: '오늘 오늘 또 오늘',
      }),
    )
  })
})