// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ContentLibraryScreen } from '../../apps/renderer/components/library/content-library-screen.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

const SAMPLE_ITEMS = [
  {
    id: 'article-1',
    title: 'Seoul Food Column',
    sourceType: 'article',
    difficulty: 2,
    difficultyBadge: '중급',
    provenanceLabel: 'Article paste',
    provenanceDetail: 'Pasted from the learner clipboard on April 20.',
    createdAt: 3,
    blockCount: 2,
  },
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
    id: 'generated-1',
    title: 'Coffee Shop Practice',
    sourceType: 'generated',
    difficulty: 3,
    difficultyBadge: '고급',
    provenanceLabel: 'Generation request',
    provenanceDetail: 'Topic: ordering coffee · requested difficulty: 중급 · validated difficulty: 고급',
    createdAt: 1,
    blockCount: 2,
  },
] as const

const BLOCKS_BY_ID = {
  'article-1': [
    {
      id: 'block-a1',
      korean: '서울의 작은 식당들은 계절마다 다른 이야기를 들려준다.',
      romanization: 'seourui jageun sikdangdeureun gyejeolmada dareun iyagireul deullyeojunda.',
      tokens: null,
      annotations: {},
      difficulty: 2,
      sourceType: 'article',
      audioOffset: null,
      sentenceOrdinal: 1,
      createdAt: 1,
    },
  ],
  'subtitle-1': [
    {
      id: 'block-s1',
      korean: '지금 가면 늦지 않을까?',
      romanization: 'jigeum gamyeon neutji aneulkka?',
      tokens: null,
      annotations: {},
      difficulty: 1,
      sourceType: 'srt',
      audioOffset: 1.25,
      sentenceOrdinal: 1,
      createdAt: 1,
    },
  ],
  'generated-1': [
    {
      id: 'block-g1',
      korean: '따뜻한 라테 한 잔 부탁드려요.',
      romanization: 'ttatteuthan rate han jan butakdeuryeoyo.',
      tokens: null,
      annotations: {},
      difficulty: 3,
      sourceType: 'generated',
      audioOffset: null,
      sentenceOrdinal: 1,
      createdAt: 1,
    },
    {
      id: 'block-g2',
      korean: '창가 자리가 비어 있으면 거기에 앉고 싶어요.',
      romanization: 'changgwa jariga bieo isseumyeon geogie ango sipeoyo.',
      tokens: null,
      annotations: {},
      difficulty: 3,
      sourceType: 'generated',
      audioOffset: null,
      sentenceOrdinal: 2,
      createdAt: 1,
    },
  ],
} satisfies Record<string, Awaited<ReturnType<WindowSona['content']['getContentBlocks']>>>

function installWindowSona() {
  const listLibraryItems = vi.fn(async (input?: { filter?: string; search?: string }) => {
    const filter = input?.filter ?? 'all'
    const search = input?.search?.toLowerCase().trim() ?? ''

    return SAMPLE_ITEMS.filter((item) => {
      const matchesFilter = filter === 'all' ? true : item.sourceType === filter
      const haystack = `${item.title} ${item.provenanceLabel} ${item.provenanceDetail}`.toLowerCase()
      const matchesSearch = search.length === 0 ? true : haystack.includes(search)
      return matchesFilter && matchesSearch
    })
  })

  const getContentBlocks = vi.fn(async (contentItemId: string) => BLOCKS_BY_ID[contentItemId] ?? [])
  const getReadingSession = vi.fn(async (contentItemId: string) => {
    const item = SAMPLE_ITEMS.find((entry) => entry.id === contentItemId);

    return {
      contentItemId,
      itemTitle: item?.title ?? "Reading session",
      provenanceLabel: item?.provenanceLabel ?? "Article paste",
      provenanceDetail: item?.provenanceDetail ?? "Reading session",
      blocks: (BLOCKS_BY_ID[contentItemId] ?? []).map((block) => ({
        id: block.id,
        contentItemId,
        korean: block.korean,
        romanization: block.romanization,
        audioOffset: block.audioOffset,
        sentenceOrdinal: block.sentenceOrdinal,
        tokens: (block.tokens ?? []).map((token, index) => ({
          index,
          surface: token.surface,
          ...(token.normalized ? { normalized: token.normalized } : {}),
        })),
      })),
      progress: {
        activeBlockId: BLOCKS_BY_ID[contentItemId]?.[0]?.id ?? null,
        playbackState: "idle" as const,
        playbackRate: 1,
        currentTimeMs: 0,
        highlightedTokenIndex: null,
      },
    };
  });

  window.sona = {
    shell: { getBootstrapState: vi.fn() },
    settings: {
      getThemePreference: vi.fn(),
      setThemePreference: vi.fn(),
      subscribeThemeChanges: vi.fn(() => () => undefined),
    },
    content: {
      listLibraryItems,
      getContentBlocks,
      importSrt: vi.fn(),
      createArticleFromPaste: vi.fn(),
      createArticleFromUrl: vi.fn(),
      generatePracticeSentences: vi.fn(),
      deleteContent: vi.fn(),
    },
    reading: {
      getReadingSession,
      ensureBlockAudio: vi.fn(async (blockId: string) => ({
        blockId,
        state: "unavailable" as const,
        audioFilePath: null,
        durationMs: null,
        modelId: "gpt-4o-mini-tts",
        voice: "alloy",
        timings: [],
        fromCache: false,
        failureMessage:
          "Hosted block audio is unavailable without an OpenRouter API key.",
      })),
      lookupWord: vi.fn(),
      explainGrammar: vi.fn(),
      addToDeck: vi.fn(),
      saveReadingProgress: vi.fn(async () => undefined),
      flushExposureLog: vi.fn(async () => ({ written: 0 })),
    },
  } as unknown as WindowSona;

  return { getContentBlocks, getReadingSession, listLibraryItems };
}

describe('content library browse integration', () => {
  beforeEach(() => {
    installWindowSona()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows saved items and narrows results with filters and search', async () => {
    const user = userEvent.setup()

    render(<ContentLibraryScreen />)
    const results = await screen.findByRole('region', { name: 'Content Library results' })

    expect(await screen.findAllByText('Seoul Food Column')).not.toHaveLength(0)
    expect(screen.getAllByText('Drama Episode 1')).not.toHaveLength(0)
    expect(screen.getAllByText('Coffee Shop Practice')).not.toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Articles' }))

    await waitFor(() => {
      expect(within(results).getByText('Seoul Food Column')).toBeInTheDocument()
      expect(within(results).queryByText('Drama Episode 1')).not.toBeInTheDocument()
      expect(within(results).queryByText('Coffee Shop Practice')).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'All' }))
    await user.type(screen.getByRole('textbox', { name: 'Search library' }), 'coffee')

    await waitFor(() => {
      expect(within(results).getByText('Coffee Shop Practice')).toBeInTheDocument()
      expect(within(results).queryByText('Seoul Food Column')).not.toBeInTheDocument()
    })
  })

  it('shows provenance details and sentence blocks for the selected item', async () => {
    const user = userEvent.setup()

    render(<ContentLibraryScreen />)

    const card = await screen.findByText('Coffee Shop Practice')
    const cardContainer = card.closest('article')

    if (!cardContainer) {
      throw new Error('Expected the generated item card to render.')
    }

    await user.click(within(cardContainer).getByRole('button', { name: 'Open Coffee Shop Practice' }))

    const detailPane = await screen.findByRole('region', { name: 'Selected content detail' })

    expect(within(detailPane).getByRole('heading', { name: 'Coffee Shop Practice' })).toBeInTheDocument()
    expect(within(detailPane).getByText('따뜻한 라테 한 잔 부탁드려요.')).toBeInTheDocument()

    expect(within(detailPane).getByText(/requested difficulty: 중급/i)).toBeInTheDocument()
  })

  it('opens a dedicated reading view from the detail pane and returns to the library', async () => {
    const user = userEvent.setup()

    render(<ContentLibraryScreen />)

    const card = await screen.findByText('Drama Episode 1')
    const cardContainer = card.closest('article')

    if (!cardContainer) {
      throw new Error('Expected the subtitle item card to render.')
    }

    await user.click(within(cardContainer).getByRole('button', { name: 'Open Drama Episode 1' }))

    const detailPane = await screen.findByRole('region', { name: 'Selected content detail' })
    await user.click(within(detailPane).getByRole('button', { name: 'Open' }))

    const readingView = await screen.findByRole('region', { name: 'Reading view' })
    expect(within(readingView).getByText('지금 가면 늦지 않을까?')).toBeInTheDocument()
    expect(within(readingView).getByRole('button', { name: 'Back to library' })).toBeInTheDocument()

    await user.click(within(readingView).getByRole('button', { name: 'Back to library' }))

    expect(await screen.findByRole('region', { name: 'Content Library results' })).toBeInTheDocument()
  })
})