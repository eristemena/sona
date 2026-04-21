// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ReadingView } from '../../apps/renderer/components/reading/reading-view.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

function installReadingWindowSona() {
  const ensureBlockAudio = vi.fn(async (blockId: string) => ({
    blockId,
    state: 'ready' as const,
    audioFilePath: '/tmp/restored-reading-audio.mp3',
    durationMs: 1400,
    modelId: 'gpt-4o-mini-tts',
    voice: 'alloy',
    fromCache: true,
    timings: [
      { tokenIndex: 0, surface: '두', startMs: 0, endMs: 250 },
      { tokenIndex: 1, surface: '번째', startMs: 250, endMs: 500 },
      { tokenIndex: 2, surface: '천천히', startMs: 500, endMs: 900 },
      { tokenIndex: 3, surface: '읽어요', startMs: 900, endMs: 1400 },
    ],
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
        itemTitle: 'Restored reading session',
        provenanceLabel: 'Article paste',
        provenanceDetail: 'Used for persisted progress validation.',
        blocks: [
          {
            id: 'block-1',
            contentItemId: 'item-1',
            korean: '첫 번째 문장입니다',
            romanization: null,
            audioOffset: null,
            sentenceOrdinal: 1,
            tokens: [
              { index: 0, surface: '첫' },
              { index: 1, surface: '번째' },
              { index: 2, surface: '문장입니다' },
            ],
          },
          {
            id: 'block-2',
            contentItemId: 'item-1',
            korean: '두 번째 천천히 읽어요',
            romanization: null,
            audioOffset: null,
            sentenceOrdinal: 2,
            tokens: [
              { index: 0, surface: '두' },
              { index: 1, surface: '번째' },
              { index: 2, surface: '천천히' },
              { index: 3, surface: '읽어요' },
            ],
          },
        ],
        progress: {
          activeBlockId: 'block-2',
          playbackState: 'paused' as const,
          playbackRate: 1.2,
          currentTimeMs: 650,
          highlightedTokenIndex: 2,
        },
      })),
      ensureBlockAudio,
      lookupWord: vi.fn(),
      explainGrammar: vi.fn(),
      addToDeck: vi.fn(),
      saveReadingProgress: vi.fn(async () => undefined),
      flushExposureLog: vi.fn(async () => ({ written: 0 })),
    },
  } as unknown as WindowSona

  return { ensureBlockAudio }
}

describe('reading progress persistence integration', () => {
  afterEach(() => {
    cleanup()
  })

  it('restores the saved block, playback controls, and highlighted token when reading is reopened', async () => {
    const { ensureBlockAudio } = installReadingWindowSona()

    render(<ReadingView contentItemId="item-1" onBack={vi.fn()} />)

    expect(await screen.findByText('Restored reading session')).toBeInTheDocument()
    await waitFor(() => {
      expect(ensureBlockAudio).toHaveBeenCalledWith('block-2')
    })
    await waitFor(() => {
      expect(screen.getByText('천천히')).toHaveAttribute('data-highlighted', 'true')
    })
    expect(screen.getByRole('button', { name: '1.25x' })).toHaveClass('bg-(--accent)')
    expect(screen.getByRole('slider', { name: 'Audio progress' })).toHaveValue('650')
  })
})