// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ReadingView } from '../../apps/renderer/components/reading/reading-view.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

function installReadingWindowSona() {
  const saveReadingProgress = vi.fn(async () => undefined)

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
        itemTitle: 'Greeting practice',
        provenanceLabel: 'Article paste',
        provenanceDetail: 'Used for playback control validation.',
        blocks: [
          {
            id: 'block-1',
            contentItemId: 'item-1',
            korean: '안녕하세요 여러분 오늘',
            romanization: 'annyeonghaseyo yeoreobun oneul',
            audioOffset: null,
            sentenceOrdinal: 1,
            tokens: [
              { index: 0, surface: '안녕하세요' },
              { index: 1, surface: '여러분' },
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
        state: 'ready',
        audioFilePath: '/tmp/greeting-practice.mp3',
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
      saveReadingProgress,
      flushExposureLog: vi.fn(async () => ({ written: 0 })),
    },
  } as unknown as WindowSona

  return { saveReadingProgress }
}

describe('synced reading audio integration', () => {
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

  it('supports play, pause, replay, speed changes, and scrubbing while keeping word highlighting in sync', async () => {
    const user = userEvent.setup()
    const { saveReadingProgress } = installReadingWindowSona()
    const { container } = render(<ReadingView contentItemId="item-1" onBack={vi.fn()} />)

    expect(await screen.findByText('안녕하세요')).toBeInTheDocument()

    const playButton = await screen.findByRole('button', { name: 'Play audio' })
    await waitFor(() => expect(playButton).toBeEnabled())

    const audio = container.querySelector('audio')
    if (!audio) {
      throw new Error('Expected the reading audio element to render.')
    }

    Object.defineProperty(audio, 'duration', { configurable: true, value: 1.8 })
    fireEvent(audio, new Event('loadedmetadata'))

    await user.click(playButton)
    expect(await screen.findByRole('button', { name: 'Pause audio' })).toBeInTheDocument()

    audio.currentTime = 0.2
    fireEvent(audio, new Event('timeupdate'))
    await waitFor(() => {
      expect(screen.getByText('안녕하세요')).toHaveAttribute('data-highlighted', 'true')
    })

    await user.click(screen.getByRole('button', { name: '1.25x' }))
    expect(screen.getByRole('button', { name: '1.25x' })).toHaveClass('bg-(--accent)')

    fireEvent.change(screen.getByRole('slider', { name: 'Audio progress' }), { target: { value: '1300' } })
    await waitFor(() => {
      expect(screen.getByText('오늘')).toHaveAttribute('data-highlighted', 'true')
    })

    await user.click(screen.getByRole('button', { name: 'Pause audio' }))
    await user.click(screen.getByRole('button', { name: 'Replay sentence' }))

    await waitFor(() => {
      expect(saveReadingProgress).toHaveBeenCalled()
    })
  })
})