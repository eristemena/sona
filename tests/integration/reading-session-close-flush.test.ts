// @vitest-environment jsdom

import { createElement } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ReadingView } from '../../apps/renderer/components/reading/reading-view.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

function installReadingWindowSona() {
  const flushExposureLog = vi.fn(async () => ({ written: 2 }))

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
        itemTitle: 'Exposure flush on close',
        provenanceLabel: 'Article paste',
        provenanceDetail: 'Used for session-close validation.',
        blocks: [
          {
            id: 'block-1',
            contentItemId: 'item-1',
            korean: '안녕하세요 여러분 오늘',
            romanization: null,
            audioOffset: null,
            sentenceOrdinal: 1,
            tokens: [
              { index: 0, surface: '안녕하세요', normalized: '안녕하세요' },
              { index: 1, surface: '여러분', normalized: '여러분' },
              { index: 2, surface: '오늘', normalized: '오늘' },
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
        audioFilePath: '/tmp/exposure-flush.mp3',
        durationMs: 1800,
        modelId: 'gpt-4o-mini-tts',
        voice: 'alloy',
        fromCache: false,
        timings: [
          { tokenIndex: 0, surface: '안녕하세요', startMs: 0, endMs: 600 },
          { tokenIndex: 1, surface: '여러분', startMs: 600, endMs: 1200 },
          { tokenIndex: 2, surface: '오늘', startMs: 1200, endMs: 1800 },
        ],
      })),
      lookupWord: vi.fn(),
      explainGrammar: vi.fn(),
      addToDeck: vi.fn(),
      saveReadingProgress: vi.fn(async () => undefined),
      flushExposureLog,
    },
  } as unknown as WindowSona

  return { flushExposureLog }
}

describe('reading session close flush integration', () => {
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

  it('buffers exposures during playback and flushes them once when the learner leaves the reading view', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    const { flushExposureLog } = installReadingWindowSona()
    const { container } = render(createElement(ReadingView, { contentItemId: 'item-1', onBack }))

    expect(await screen.findByText('안녕하세요')).toBeInTheDocument()
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
      expect(screen.getByText('안녕하세요')).toHaveAttribute('data-highlighted', 'true')
    })

    audio.currentTime = 0.9
    fireEvent(audio, new Event('timeupdate'))
    await waitFor(() => {
      expect(screen.getByText('여러분')).toHaveAttribute('data-highlighted', 'true')
    })

    audio.currentTime = 0.95
    fireEvent(audio, new Event('timeupdate'))

    expect(flushExposureLog).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Back to library' }))

    expect(onBack).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(flushExposureLog).toHaveBeenCalledTimes(1)
    })
    expect(flushExposureLog).toHaveBeenCalledWith({
      entries: expect.arrayContaining([
        expect.objectContaining({ blockId: 'block-1', token: '안녕하세요' }),
        expect.objectContaining({ blockId: 'block-1', token: '여러분' }),
      ]),
    })
  })
})