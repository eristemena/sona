// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ReadingView } from '../../apps/renderer/components/reading/reading-view.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

function installReadingWindowSona() {
  const addToDeck = vi.fn(async () => ({
    disposition: 'created' as const,
    reviewCardId: 'card-1',
    message: 'Added 천천히 to your review deck with source context preserved.',
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
        itemTitle: 'Fallback and review continuity',
        provenanceLabel: 'Article paste',
        provenanceDetail: 'Used for combined fallback and review validation.',
        blocks: [
          {
            id: 'block-1',
            contentItemId: 'item-1',
            korean: '오늘도 천천히 읽어요',
            romanization: null,
            audioOffset: null,
            sentenceOrdinal: 1,
            tokens: [
              { index: 0, surface: '오늘도', normalized: '오늘도' },
              { index: 1, surface: '천천히', normalized: '천천히' },
              { index: 2, surface: '읽어요', normalized: '읽다' },
            ],
          },
        ],
        progress: {
          activeBlockId: 'block-1',
          playbackState: 'idle' as const,
          playbackRate: 1,
          currentTimeMs: 0,
          highlightedTokenIndex: null,
        },
      })),
      ensureBlockAudio: vi.fn(async () => ({
        blockId: 'block-1',
        state: 'ready' as const,
        audioFilePath: '/tmp/fallback-continuity.mp3',
        durationMs: 1800,
        modelId: 'gpt-4o-mini-tts',
        voice: 'alloy',
        fromCache: true,
        timings: [
          { tokenIndex: 0, surface: '오늘도', startMs: 0, endMs: 600 },
          { tokenIndex: 1, surface: '천천히', startMs: 600, endMs: 1200 },
          { tokenIndex: 2, surface: '읽어요', startMs: 1200, endMs: 1800 },
        ],
      })),
      lookupWord: vi.fn(async () => ({
        canonicalForm: '천천히',
        surface: '천천히',
        meaning: 'Unavailable offline',
        romanization: '',
        pattern: 'Lookup unavailable',
        register: 'Offline',
        sentenceTranslation: 'Lookup is not available yet for this reading session.',
        grammarExplanation: null,
        cacheState: 'miss' as const,
        modelId: null,
      })),
      explainGrammar: vi.fn(async () => ({
        canonicalForm: '천천히',
        surface: '천천히',
        meaning: 'Unavailable offline',
        romanization: '',
        pattern: 'Lookup unavailable',
        register: 'Offline',
        sentenceTranslation: 'Lookup is not available yet for this reading session.',
        grammarExplanation: 'A richer grammar explanation is unavailable right now. Continue reading and try again later.',
        cacheState: 'miss' as const,
        modelId: null,
      })),
      addToDeck,
      saveReadingProgress: vi.fn(async () => undefined),
      flushExposureLog: vi.fn(async () => ({ written: 0 })),
    },
  } as unknown as WindowSona

  return { addToDeck }
}

describe('reading fallback review continuity integration', () => {
  beforeEach(() => {
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(function play() {
      this.dispatchEvent(new Event('play'))
      return Promise.resolve()
    })
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(function pause() {
      this.dispatchEvent(new Event('pause'))
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    cleanup()
  })

  it('keeps playback moving while fallback lookup messaging and add-to-deck remain available together', async () => {
    const user = userEvent.setup()
    const { addToDeck } = installReadingWindowSona()
    const { container } = render(<ReadingView contentItemId="item-1" onBack={vi.fn()} />)

    expect(await screen.findByText('Fallback and review continuity')).toBeInTheDocument()
    const audio = container.querySelector('audio')
    if (!audio) {
      throw new Error('Expected the reading audio element to render.')
    }

    Object.defineProperty(audio, 'duration', { configurable: true, value: 1.8 })
    fireEvent(audio, new Event('loadedmetadata'))

    await user.click(await screen.findByRole('button', { name: 'Play audio' }))

    audio.currentTime = 0.2
    fireEvent(audio, new Event('timeupdate'))
    await waitFor(() => {
      expect(screen.getByText('오늘도')).toHaveAttribute('data-highlighted', 'true')
    })

    await user.click(screen.getByRole('button', { name: '천천히' }))
    expect(await screen.findByText('Unavailable offline')).toBeInTheDocument()
    expect(screen.getByText('Lookup is not available yet for this reading session.')).toBeInTheDocument()
    expect(screen.getByText('Lookup unavailable · Offline')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add to deck +' }))
    expect(addToDeck).toHaveBeenCalledWith({
      blockId: 'block-1',
      token: '천천히',
      canonicalForm: '천천히',
      sentenceContext: '오늘도 천천히 읽어요',
    })
    expect(await screen.findByText('Added 천천히 to your review deck with source context preserved.')).toBeInTheDocument()

    audio.currentTime = 0.95
    fireEvent(audio, new Event('timeupdate'))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '천천히' })).toHaveAttribute('data-highlighted', 'true')
    })
  })
})