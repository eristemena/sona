// @vitest-environment jsdom

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SrtImportService } from '../../apps/desktop/src/main/content/srt-import-service.js'
import { AppShell } from '../../apps/renderer/components/shell/app-shell.js'
import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { SqliteContentLibraryRepository } from '../../packages/data/src/sqlite/content-library-repository.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'
import { createShellBootstrapState } from '../../packages/domain/src/contracts/shell-bootstrap.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

const tempDirectories: string[] = []

afterEach(() => {
  cleanup()

  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop()!, { force: true, recursive: true })
  }
})

describe('import-to-study-to-review boundary', () => {
  it('keeps imported content inspectable in the library while leaving the review destination unchanged', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sona-import-review-boundary-'))
    tempDirectories.push(directory)

    const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)
    const sourcePath = path.join(directory, 'sample-drama.srt')
    writeFileSync(sourcePath, readFileSync(path.join(process.cwd(), 'fixtures/corpus/sample-drama.srt'), 'utf8'))

    const importService = new SrtImportService({
      now: () => 1_713_700_000_000,
      readFile: (filePath, encoding) => Promise.resolve(readFileSync(filePath, encoding)),
    })
    const importResult = repository.saveContent(await importService.importFromFile({ filePath: sourcePath, difficulty: 1 }))

    expect(importResult).toMatchObject({
      ok: true,
      item: {
        sourceType: 'srt',
        provenanceLabel: 'Subtitle import',
      },
    })

    const reviewTables = database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND (name LIKE '%review%' OR name LIKE '%srs%')",
      )
      .all() as Array<{ name: string }>

    expect(reviewTables).toEqual([])

    window.sona = {
      shell: {
        getBootstrapState: vi.fn(async () =>
          createShellBootstrapState({
            themePreference: 'system',
            systemTheme: 'dark',
          }),
        ),
      },
      settings: {
        getThemePreference: vi.fn(),
        setThemePreference: vi.fn(),
        subscribeThemeChanges: vi.fn(() => () => undefined),
      },
      content: {
        listLibraryItems: vi.fn(async (input?: { filter?: string; search?: string }) => repository.listLibraryItems(input)),
        getContentBlocks: vi.fn(async (contentItemId: string) => repository.getContentBlocks(contentItemId)),
        browseSubtitleFile: vi.fn(async () => null),
        importSrt: vi.fn(),
        createArticleFromPaste: vi.fn(),
        createArticleFromUrl: vi.fn(),
        generatePracticeSentences: vi.fn(),
        deleteContent: vi.fn(),
      },
    } as unknown as WindowSona

    const user = userEvent.setup()
    render(<AppShell />)

    await user.click(await screen.findByRole('button', { name: /library/i }))
    const results = await screen.findByRole('region', { name: 'Content Library results' })
    expect(within(results).getByText('sample-drama')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open sample-drama' }))

    const detailPane = await screen.findByRole('region', { name: 'Selected content detail' })
    expect(within(detailPane).getByText('지금 뭐 해?')).toBeInTheDocument()

    await user.click(within(detailPane).getByRole('button', { name: 'Open' }))
    const readingView = await screen.findByRole('region', { name: 'Reading view' })
    expect(within(readingView).getByText('지금 뭐 해?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /review/i }))

    expect(await screen.findByRole('heading', { name: 'Spaced repetition will anchor here.' })).toBeInTheDocument()
    expect(screen.getByText(/focused space for review sessions/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /library/i }))
    const returnedResults = await screen.findByRole('region', { name: 'Content Library results' })

    await waitFor(() => {
      expect(within(returnedResults).getByText('sample-drama')).toBeInTheDocument()
      expect(screen.getByText('지금 뭐 해?')).toBeInTheDocument()
    })

    database.close()
  })
})