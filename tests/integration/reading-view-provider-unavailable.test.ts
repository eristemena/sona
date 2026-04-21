// @vitest-environment jsdom

import { createElement } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ReadingView } from '../../apps/renderer/components/reading/reading-view.js'
import { createLookupUnavailableResult } from '../../packages/domain/src/content/annotation-cache.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

describe('reading view provider unavailable integration', () => {
  afterEach(() => {
    cleanup()
  })

  it('keeps reading available and shows fallback lookup copy when the provider is unavailable', async () => {
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
          itemTitle: 'Provider fallback reading',
          provenanceLabel: 'Article paste',
          provenanceDetail: 'Lookup fallback validation.',
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
          failureMessage: 'Hosted block audio is unavailable right now.',
        })),
        lookupWord: vi.fn(async () => createLookupUnavailableResult('천천히')),
        explainGrammar: vi.fn(async () => ({
          ...createLookupUnavailableResult('천천히'),
          grammarExplanation: 'A richer grammar explanation is unavailable right now. Continue reading and try again later.',
        })),
        addToDeck: vi.fn(),
        saveReadingProgress: vi.fn(async () => undefined),
        flushExposureLog: vi.fn(async () => ({ written: 0 })),
      },
    } as unknown as WindowSona

    render(createElement(ReadingView, { contentItemId: 'item-1', onBack: vi.fn() }))

    await user.click(await screen.findByRole('button', { name: '천천히' }))

    expect(await screen.findByText('Unavailable offline')).toBeInTheDocument()
    expect(screen.getByText('Lookup unavailable · Offline')).toBeInTheDocument()
    expect(screen.getByText('Lookup is not available yet for this reading session.')).toBeInTheDocument()
    expect(screen.getByText('오늘도')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Explain grammar' }))
    expect(await screen.findByText(/richer grammar explanation is unavailable right now/i)).toBeInTheDocument()
  })
})