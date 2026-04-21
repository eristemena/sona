// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ReadingView } from '../../apps/renderer/components/reading/reading-view.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

describe('word highlight timing drift integration', () => {
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
          itemTitle: 'Repeated word timing',
          provenanceLabel: 'Article paste',
          provenanceDetail: 'Repeated word alignment validation.',
          blocks: [
            {
              id: 'block-1',
              contentItemId: 'item-1',
              korean: '학교 학교 갑니다',
              romanization: null,
              audioOffset: null,
              sentenceOrdinal: 1,
              tokens: [
                { index: 0, surface: '학교' },
                { index: 1, surface: '학교' },
                { index: 2, surface: '갑니다' },
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
          audioFilePath: '/tmp/repeated-word.mp3',
          durationMs: 1500,
          modelId: 'gpt-4o-mini-tts',
          voice: 'alloy',
          fromCache: true,
          timings: [
            { tokenIndex: 0, surface: '학교', startMs: 0, endMs: 500 },
            { tokenIndex: 1, surface: '학교', startMs: 500, endMs: 1000 },
            { tokenIndex: 2, surface: '갑니다', startMs: 1000, endMs: 1500 },
          ],
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

  it('keeps repeated words mapped to the correct occurrence instead of drifting to the first match', async () => {
    const { container } = render(<ReadingView contentItemId="item-1" onBack={vi.fn()} />)
    await waitFor(() => {
      expect(container.querySelector('[data-token-index="0"]')).not.toBeNull()
      expect(container.querySelector('[data-token-index="1"]')).not.toBeNull()
    })

    const audio = container.querySelector('audio')

    if (!audio) {
      throw new Error('Expected the reading audio element to render.')
    }

    Object.defineProperty(audio, 'duration', { configurable: true, value: 1.5 })
    fireEvent(audio, new Event('loadedmetadata'))
    audio.currentTime = 0.75
    fireEvent(audio, new Event('timeupdate'))

    const firstOccurrence = container.querySelector('[data-token-index="0"]')
    const secondOccurrence = container.querySelector('[data-token-index="1"]')

    if (!firstOccurrence || !secondOccurrence) {
      throw new Error('Expected both repeated token spans to render with token indices.')
    }

    await waitFor(() => {
      expect(firstOccurrence).not.toHaveAttribute('data-highlighted', 'true')
      expect(secondOccurrence).toHaveAttribute('data-highlighted', 'true')
    })
  })
})