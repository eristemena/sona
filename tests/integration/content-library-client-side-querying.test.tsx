// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ContentLibraryScreen } from '../../apps/renderer/components/library/content-library-screen.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

const SAMPLE_ITEMS = [
  {
    id: 'subtitle-1',
    title: 'Drama Episode 1',
    sourceType: 'srt',
    difficulty: 1,
    difficultyBadge: '초급',
    provenanceLabel: 'Subtitle import',
    provenanceDetail: '/fixtures/drama-episode-1.srt',
    createdAt: 2,
    blockCount: 1,
  },
  {
    id: 'article-1',
    title: 'Seoul Food Column',
    sourceType: 'article',
    difficulty: 2,
    difficultyBadge: '중급',
    provenanceLabel: 'Article paste',
    provenanceDetail: 'Pasted from the learner clipboard.',
    createdAt: 3,
    blockCount: 2,
  },
  {
    id: 'generated-1',
    title: 'Coffee Shop Practice',
    sourceType: 'generated',
    difficulty: 3,
    difficultyBadge: '고급',
    provenanceLabel: 'Generation request',
    provenanceDetail: 'Topic: ordering coffee',
    createdAt: 1,
    blockCount: 2,
  },
] as const

function getVisibleTitles(results: HTMLElement) {
  return within(results)
    .getAllByRole('heading', { level: 3 })
    .map((element) => element.textContent)
}

describe('content library client-side querying', () => {
  const listLibraryItems = vi.fn(async () => [...SAMPLE_ITEMS])

  beforeEach(() => {
    listLibraryItems.mockClear()

    window.sona = {
      shell: { getBootstrapState: vi.fn() },
      settings: {
        getThemePreference: vi.fn(),
        setThemePreference: vi.fn(),
        subscribeThemeChanges: vi.fn(() => () => undefined),
      },
      content: {
        listLibraryItems,
        getContentBlocks: vi.fn(async () => []),
        browseSubtitleFile: vi.fn(),
        importSrt: vi.fn(),
        createArticleFromPaste: vi.fn(),
        createArticleFromUrl: vi.fn(),
        generatePracticeSentences: vi.fn(),
        deleteContent: vi.fn(),
      },
      reading: {
        getReadingSession: vi.fn(),
        ensureBlockAudio: vi.fn(),
        lookupWord: vi.fn(),
        explainGrammar: vi.fn(),
        addToDeck: vi.fn(),
        getWordStudyStatus: vi.fn(),
        saveReadingProgress: vi.fn(),
        flushExposureLog: vi.fn(),
      },
    } as unknown as WindowSona
  })

  afterEach(() => {
    cleanup()
  })

  it('loads the catalog once and applies filter, search, and sort locally', async () => {
    const user = userEvent.setup()

    render(<ContentLibraryScreen />)

    const results = await screen.findByRole('region', { name: 'Content Library results' })

    await waitFor(() => {
      expect(getVisibleTitles(results)).toEqual([
        'Seoul Food Column',
        'Drama Episode 1',
        'Coffee Shop Practice',
      ])
    })

    expect(listLibraryItems).toHaveBeenCalledTimes(1)
    expect(listLibraryItems).toHaveBeenCalledWith()

    await user.click(screen.getByRole('button', { name: 'Articles' }))

    await waitFor(() => {
      expect(getVisibleTitles(results)).toEqual(['Seoul Food Column'])
    })

    expect(listLibraryItems).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'All' }))
    await user.type(screen.getByRole('textbox', { name: 'Search library' }), 'coffee')

    await waitFor(() => {
      expect(getVisibleTitles(results)).toEqual(['Coffee Shop Practice'])
    })

    expect(listLibraryItems).toHaveBeenCalledTimes(1)

    await user.clear(screen.getByRole('textbox', { name: 'Search library' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort library' }), 'title-asc')

    await waitFor(() => {
      expect(getVisibleTitles(results)).toEqual([
        'Coffee Shop Practice',
        'Drama Episode 1',
        'Seoul Food Column',
      ])
    })

    expect(listLibraryItems).toHaveBeenCalledTimes(1)
  })
})