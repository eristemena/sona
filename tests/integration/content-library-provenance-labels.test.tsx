// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
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

describe('content library provenance labels', () => {
  beforeEach(() => {
    window.sona = {
      shell: { getBootstrapState: vi.fn() },
      settings: {
        getThemePreference: vi.fn(),
        setThemePreference: vi.fn(),
        subscribeThemeChanges: vi.fn(() => () => undefined),
      },
      content: {
        listLibraryItems: vi.fn(async () => [...SAMPLE_ITEMS]),
        getContentBlocks: vi.fn(async () => [
          {
            id: 'block-1',
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
        ]),
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

  it('shows source-type labels on cards and provenance details in the selected item pane', async () => {
    const user = userEvent.setup()

    render(<ContentLibraryScreen />)

    const results = await screen.findByRole('region', { name: 'Content Library results' })
    await within(results).findByText('Seoul Food Column')
    expect(within(results).getByText('Article')).toBeInTheDocument()
    expect(within(results).getByText('Subtitle')).toBeInTheDocument()
    expect(within(results).getByText('Generated')).toBeInTheDocument()

    const generatedCard = screen.getByText('Coffee Shop Practice').closest('article')
    if (!generatedCard) {
      throw new Error('Expected the generated card to render.')
    }

    await user.click(within(generatedCard).getByRole('button', { name: 'Open Coffee Shop Practice' }))

    const detailPane = await screen.findByRole('region', { name: 'Selected content detail' })
    expect(within(detailPane).getByText('Generated')).toBeInTheDocument()
    expect(within(detailPane).getByText('Generation request')).toBeInTheDocument()
    expect(within(detailPane).getByText(/requested difficulty: 중급/i)).toBeInTheDocument()
    expect(within(detailPane).getByText('따뜻한 라테 한 잔 부탁드려요.')).toBeInTheDocument()
  })
})