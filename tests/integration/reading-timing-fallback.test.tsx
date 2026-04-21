// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ReadingView } from '../../apps/renderer/components/reading/reading-view.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

describe('reading timing fallback integration', () => {
  beforeEach(() => {
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(function play() {
      this.dispatchEvent(new Event('play'))
      return Promise.resolve()
    })
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(function pause() {
      this.dispatchEvent(new Event('pause'))
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
        getReadingSession: vi.fn(async () => ({
          contentItemId: 'item-1',
          itemTitle: 'Estimated timing practice',
          provenanceLabel: 'Article paste',
          provenanceDetail: 'Fallback timing validation.',
          blocks: [
            {
              id: 'block-1',
              contentItemId: 'item-1',
              korean: '오늘 날씨 좋아요',
              romanization: null,
              audioOffset: null,
              sentenceOrdinal: 1,
              tokens: [
                { index: 0, surface: '오늘' },
                { index: 1, surface: '날씨' },
                { index: 2, surface: '좋아요' },
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
          state: 'ready',
          audioFilePath: '/tmp/estimated-timing.mp3',
          durationMs: 1800,
          modelId: 'gpt-4o-mini-tts',
          voice: 'alloy',
          fromCache: false,
          timings: [],
        })),
        lookupWord: vi.fn(),
        explainGrammar: vi.fn(),
        addToDeck: vi.fn(),
        saveReadingProgress: vi.fn(async () => undefined),
        flushExposureLog: vi.fn(async () => ({ written: 0 })),
      },
    } as unknown as WindowSona
  })

  afterEach(() => {
    vi.restoreAllMocks()
    cleanup()
  })

  it('falls back to estimated word timing when provider timing metadata is unavailable', async () => {
    const { container } = render(<ReadingView contentItemId="item-1" onBack={vi.fn()} />)

    expect(await screen.findByText(/estimated timing/i)).toBeInTheDocument()

    const audio = container.querySelector('audio')
    if (!audio) {
      throw new Error('Expected the reading audio element to render.')
    }

    Object.defineProperty(audio, 'duration', { configurable: true, value: 1.8 })
    fireEvent(audio, new Event('loadedmetadata'))
    audio.currentTime = 0.75
    fireEvent(audio, new Event('timeupdate'))

    await waitFor(() => {
      expect(screen.getByText('날씨')).toHaveAttribute('data-highlighted', 'true')
    })
  })
})