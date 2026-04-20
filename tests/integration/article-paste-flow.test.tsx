// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ContentLibraryScreen } from '../../apps/renderer/components/library/content-library-screen.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

function installWindowSona() {
  const state = {
    items: [] as Array<{
      id: string
      title: string
      sourceType: 'article'
      difficulty: 1 | 2 | 3
      difficultyBadge: '초급' | '중급' | '고급'
      provenanceLabel: string
      provenanceDetail: string
      createdAt: number
      blockCount: number
      duplicateKey: string
    }>,
    nextId: 1,
  }

  const listLibraryItems = vi.fn(async (input?: { filter?: string; search?: string }) => {
    const filter = input?.filter ?? 'all'
    const search = input?.search?.toLowerCase().trim() ?? ''

    return state.items
      .filter((item) => {
        const matchesFilter = filter === 'all' ? true : item.sourceType === filter
        const haystack = `${item.title} ${item.provenanceLabel} ${item.provenanceDetail}`.toLowerCase()
        const matchesSearch = search.length === 0 ? true : haystack.includes(search)
        return matchesFilter && matchesSearch
      })
      .map(({ duplicateKey: _duplicateKey, ...item }) => item)
  })

  const createArticleFromPaste = vi.fn(async (input: { text: string; title?: string; difficulty: 1 | 2 | 3; confirmDuplicate?: boolean }) => {
    const duplicateKey = input.text.trim().replace(/\s+/g, ' ')
    const existing = state.items.find((item) => item.duplicateKey === duplicateKey)
    if (existing && !input.confirmDuplicate) {
      return {
        ok: false as const,
        reason: 'duplicate-warning' as const,
        message: 'Similar content already exists in the library. Confirm save to continue.',
        matchingItemIds: [existing.id],
      }
    }

    const articleId = `article-${state.nextId++}`
    const title = input.title?.trim() || '서울 시장 산책'
    const difficultyBadge = input.difficulty === 1 ? '초급' : input.difficulty === 2 ? '중급' : '고급'
    state.items.unshift({
      id: articleId,
      title,
      sourceType: 'article',
      difficulty: input.difficulty,
      difficultyBadge,
      provenanceLabel: 'Article paste',
      provenanceDetail: 'Pasted from the learner clipboard.',
      createdAt: Date.now(),
      blockCount: 2,
      duplicateKey,
    })

    return {
      ok: true as const,
      item: {
        id: articleId,
        title,
        sourceType: 'article' as const,
        difficulty: input.difficulty,
        difficultyBadge,
        provenanceLabel: 'Article paste',
        provenanceDetail: 'Pasted from the learner clipboard.',
        createdAt: Date.now(),
        blockCount: 2,
      },
      blocks: [],
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
      listLibraryItems,
      getContentBlocks: vi.fn(async () => []),
      browseSubtitleFile: vi.fn(async () => null),
      importSrt: vi.fn(),
      createArticleFromPaste,
      createArticleFromUrl: vi.fn(),
      generatePracticeSentences: vi.fn(),
      deleteContent: vi.fn(),
    },
  } as unknown as WindowSona

  return { createArticleFromPaste, listLibraryItems }
}

describe('article paste flow', () => {
  beforeEach(() => {
    installWindowSona()
  })

  afterEach(() => {
    cleanup()
  })

  it('saves pasted article content, shows it under the Articles filter, and warns before saving a duplicate', async () => {
    const user = userEvent.setup()

    render(<ContentLibraryScreen />)

    await user.click(await screen.findByRole('button', { name: 'Add content' }))
    await user.click(screen.getByRole('button', { name: /Paste article/i }))
    await user.type(screen.getByRole('textbox', { name: 'Article text' }), '서울의 작은 시장은 아침마다 다른 냄새로 가득하다. 골목마다 계절 과일이 보인다.')
    await user.type(screen.getByRole('textbox', { name: 'Library title' }), '서울 시장 산책')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Difficulty' }), '2')
    await user.click(screen.getByRole('button', { name: 'Save pasted article' }))

    expect(await screen.findAllByText('서울 시장 산책')).not.toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Articles' }))

    const results = screen.getByRole('region', { name: 'Content Library results' })
    await waitFor(() => {
      expect(within(results).getByText('서울 시장 산책')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Add content' }))
    await user.click(screen.getByRole('button', { name: /Paste article/i }))
    await user.type(screen.getByRole('textbox', { name: 'Article text' }), '서울의 작은 시장은 아침마다 다른 냄새로 가득하다. 골목마다 계절 과일이 보인다.')
    await user.click(screen.getByRole('button', { name: 'Save pasted article' }))

    expect(await screen.findByText('Similar content already exists in the library. Confirm save to continue.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save duplicate anyway' })).toBeInTheDocument()
  })
})
