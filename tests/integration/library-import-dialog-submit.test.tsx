// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ContentLibraryScreen } from '../../apps/renderer/components/library/content-library-screen.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

describe('library import dialog submit integration', () => {
  beforeEach(() => {
    const state = {
      items: [] as Array<{
        id: string
        title: string
        sourceType: 'article' | 'srt' | 'generated'
        difficulty: number
        difficultyBadge: '초급' | '중급' | '고급'
        provenanceLabel: string
        provenanceDetail: string
        createdAt: number
        blockCount: number
      }>,
    }

    const importSrt = vi.fn(async (input: { filePath?: string; title?: string; difficulty: number; confirmDuplicate?: boolean }) => {
      state.items = [
        {
          id: 'subtitle-1',
          title: input.title ?? 'Imported subtitle',
          sourceType: 'srt',
          difficulty: input.difficulty,
          difficultyBadge: input.difficulty === 1 ? '초급' : input.difficulty === 2 ? '중급' : '고급',
          provenanceLabel: 'Subtitle import',
          provenanceDetail: input.filePath ?? 'inline.srt',
          createdAt: 2,
          blockCount: 1,
        },
        ...state.items,
      ]

      return {
        ok: true as const,
        item: state.items[0],
        blocks: [
          {
            id: 'subtitle-block-1',
            korean: '지금 뭐 해?',
            romanization: null,
            tokens: null,
            annotations: {},
            difficulty: input.difficulty,
            sourceType: 'srt' as const,
            audioOffset: 0,
            sentenceOrdinal: 1,
            createdAt: 2,
          },
        ],
      }
    })

    const createArticleFromPaste = vi.fn(async (input: { text: string; title?: string; difficulty: number; confirmDuplicate?: boolean }) => {
      state.items = [
        {
          id: 'article-1',
          title: input.title ?? 'Pasted article',
          sourceType: 'article',
          difficulty: input.difficulty,
          difficultyBadge: input.difficulty === 1 ? '초급' : input.difficulty === 2 ? '중급' : '고급',
          provenanceLabel: 'Article paste',
          provenanceDetail: 'Pasted from the learner clipboard.',
          createdAt: 3,
          blockCount: 2,
        },
        ...state.items,
      ]

      return {
        ok: true as const,
        item: state.items[0],
        blocks: [
          {
            id: 'article-block-1',
            korean: input.text,
            romanization: null,
            tokens: null,
            annotations: {},
            difficulty: input.difficulty,
            sourceType: 'article' as const,
            audioOffset: null,
            sentenceOrdinal: 1,
            createdAt: 3,
          },
        ],
      }
    })

    window.sona = {
      shell: { getBootstrapState: vi.fn() },
      settings: {
        getThemePreference: vi.fn(),
        setThemePreference: vi.fn(),
        subscribeThemeChanges: vi.fn(() => () => undefined),
      },
      content: {
        listLibraryItems: vi.fn(async () => [...state.items]),
        getContentBlocks: vi.fn(async () => []),
        browseSubtitleFile: vi.fn(),
        importSrt,
        createArticleFromPaste,
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

  it('submits subtitle and pasted-article imports through the dialog flow', async () => {
    const user = userEvent.setup()
    const contentApi = window.sona.content

    render(<ContentLibraryScreen />)

    const results = await screen.findByRole('region', { name: 'Content Library results' })

    await user.click(within(results).getByRole('button', { name: 'Add content' }))
    await user.type(screen.getByPlaceholderText('Choose a local .srt file'), '/tmp/drama-episode-5.srt')
    await user.type(screen.getByPlaceholderText('Optional custom title'), 'Drama Episode 5')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Difficulty' }), '2')
    await user.click(screen.getByRole('button', { name: 'Import subtitles' }))

    expect(contentApi.importSrt).toHaveBeenCalledWith({
      filePath: '/tmp/drama-episode-5.srt',
      title: 'Drama Episode 5',
      difficulty: 2,
      confirmDuplicate: false,
    })

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Save new Korean study material' })).not.toBeInTheDocument()
      expect(screen.getAllByText('Drama Episode 5')).toHaveLength(2)
    })

    await user.click(screen.getByRole('button', { name: 'Add content' }))
    const dialog = screen.getByRole('dialog', { name: 'Save new Korean study material' })
    await user.click(within(dialog).getByRole('button', { name: /Paste article/i }))
    await user.type(screen.getByPlaceholderText('Paste Korean article text here'), '서울의 작은 식당들은 계절마다 다른 이야기를 들려준다.')
    await user.type(screen.getByPlaceholderText('Optional custom title'), 'Market Notes')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Difficulty' }), '3')
    await user.click(screen.getByRole('button', { name: 'Save pasted article' }))

    expect(contentApi.createArticleFromPaste).toHaveBeenCalledWith({
      text: '서울의 작은 식당들은 계절마다 다른 이야기를 들려준다.',
      title: 'Market Notes',
      difficulty: 3,
      confirmDuplicate: false,
    })

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Save new Korean study material' })).not.toBeInTheDocument()
      expect(screen.getAllByText('Market Notes')).toHaveLength(2)
    })
  })
})