// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ReadingView } from '../../apps/renderer/components/reading/reading-view.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

describe('reading view offline fallback integration', () => {
  afterEach(() => {
    cleanup()
  })

  it('keeps text-first reading available when block audio cannot be generated', async () => {
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
          itemTitle: 'Offline reading practice',
          provenanceLabel: 'Article paste',
          provenanceDetail: 'No-key fallback validation.',
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
          failureMessage: 'Hosted block audio is unavailable without an OpenRouter API key.',
        })),
        lookupWord: vi.fn(),
        explainGrammar: vi.fn(),
        addToDeck: vi.fn(),
        saveReadingProgress: vi.fn(async () => undefined),
        flushExposureLog: vi.fn(async () => ({ written: 0 })),
      },
    } as unknown as WindowSona

    render(<ReadingView contentItemId="item-1" onBack={vi.fn()} />)

    expect(await screen.findByText('오늘도')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Play audio' })).toBeDisabled()
    })
    expect(screen.getByText('Audio unavailable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry audio' })).toBeInTheDocument()
  })

  it('restores saved playback controls offline while keeping audio safely unavailable', async () => {
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
          itemTitle: 'Offline reading resume',
          provenanceLabel: 'Article paste',
          provenanceDetail: 'Saved playback state should remain visible offline.',
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
            playbackState: 'paused',
            playbackRate: 1.2,
            currentTimeMs: 900,
            highlightedTokenIndex: 1,
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
          failureMessage: 'Hosted block audio is unavailable without an OpenRouter API key.',
        })),
        lookupWord: vi.fn(),
        explainGrammar: vi.fn(),
        addToDeck: vi.fn(),
        saveReadingProgress: vi.fn(async () => undefined),
        flushExposureLog: vi.fn(async () => ({ written: 0 })),
      },
    } as unknown as WindowSona

    render(<ReadingView contentItemId="item-1" onBack={vi.fn()} />)

    expect(await screen.findByText('Offline reading resume')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Play audio' })).toBeDisabled()
    })
    expect(screen.getByRole('button', { name: '1.25x' })).toHaveClass('bg-(--accent)')
    expect(screen.getByRole('slider', { name: 'Audio progress' })).toHaveValue('900')
    expect(screen.getByText('Audio unavailable')).toBeInTheDocument()
  })
})