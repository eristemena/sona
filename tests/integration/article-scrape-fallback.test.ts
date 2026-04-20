import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { SqliteContentLibraryRepository } from '../../packages/data/src/sqlite/content-library-repository.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'
import { CONTENT_CHANNELS } from '../../packages/domain/src/contracts/content-library.js'
import { ArticleContentService } from '../../apps/desktop/src/main/content/article-content-service.js'
import { registerContentHandlers } from '../../apps/desktop/src/main/ipc/content-handlers.js'
import { ArticleScraper } from '../../apps/desktop/src/main/providers/article-scraper.js'
import { electronMockState, resetElectronMock } from '../setup/electron-mock.js'

describe('article scrape fallback', () => {
  beforeEach(() => {
    resetElectronMock()
  })

  it('warns before saving a duplicate scraped article and preserves both items after confirmation', async () => {
    const database = createSqliteConnection({ databasePath: ':memory:' })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)
    const fetchMock = vi.fn(async () =>
      new Response(
        '<html><head><title>Seoul Walk</title></head><body><article><p>서울의 강변 길은 저녁마다 다른 빛을 보여 준다.</p><p>바람이 불면 자전거 소리가 가까워진다.</p></article></body></html>',
        { status: 200 },
      ),
    )

    registerContentHandlers(
      {
        articleContentService: new ArticleContentService(new ArticleScraper({ fetch: fetchMock }), { now: () => 1_713_610_000_000 }),
        contentRepository: repository,
      },
      {
        ipcMain: electronMockState.ipcMain,
        dialog: electronMockState.dialog,
        browserWindow: { getFocusedWindow: () => null },
      },
    )

    const scrapeHandler = electronMockState.ipcMainHandlers.get(CONTENT_CHANNELS.createArticleFromUrl)
    if (!scrapeHandler) {
      throw new Error('Expected the create-article-from-url IPC handler to be registered.')
    }

    const firstResult = await scrapeHandler(undefined, { url: 'https://example.com/seoul-walk', difficulty: 2 })
    expect(firstResult).toMatchObject({ ok: true })
    expect(repository.listLibraryItems()).toHaveLength(1)

    const duplicateWarning = await scrapeHandler(undefined, { url: 'https://example.com/seoul-walk', difficulty: 2 })
    expect(duplicateWarning).toEqual(
      expect.objectContaining({
        ok: false,
        reason: 'duplicate-warning',
      }),
    )

    const confirmedDuplicate = await scrapeHandler(undefined, {
      url: 'https://example.com/seoul-walk',
      difficulty: 2,
      confirmDuplicate: true,
    })

    expect(confirmedDuplicate).toMatchObject({ ok: true })
    expect(repository.listLibraryItems()).toHaveLength(2)
  })

  it('keeps the library unchanged when scraping fails and still allows paste fallback', async () => {
    const database = createSqliteConnection({ databasePath: ':memory:' })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)
    const fetchMock = vi.fn(async () => {
      throw new Error('offline')
    })

    registerContentHandlers(
      {
        articleContentService: new ArticleContentService(new ArticleScraper({ fetch: fetchMock }), { now: () => 1_713_620_000_000 }),
        contentRepository: repository,
      },
      {
        ipcMain: electronMockState.ipcMain,
        dialog: electronMockState.dialog,
        browserWindow: { getFocusedWindow: () => null },
      },
    )

    const scrapeHandler = electronMockState.ipcMainHandlers.get(CONTENT_CHANNELS.createArticleFromUrl)
    const pasteHandler = electronMockState.ipcMainHandlers.get(CONTENT_CHANNELS.createArticleFromPaste)
    if (!scrapeHandler || !pasteHandler) {
      throw new Error('Expected the article IPC handlers to be registered.')
    }

    const scrapeFailure = await scrapeHandler(undefined, { url: 'https://example.com/unreachable', difficulty: 2 })
    expect(scrapeFailure).toEqual(
      expect.objectContaining({
        ok: false,
        reason: 'scrape-failed',
      }),
    )
    expect(repository.listLibraryItems()).toEqual([])

    const pasteSuccess = await pasteHandler(undefined, {
      text: '서울의 밤 공기는 생각보다 차갑다. 하지만 강가를 걷는 사람들은 여전히 많다.',
      difficulty: 2,
    })

    expect(pasteSuccess).toMatchObject({ ok: true })
    expect(repository.listLibraryItems()).toHaveLength(1)
  })
})
