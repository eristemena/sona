import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { SqliteContentLibraryRepository } from '../../packages/data/src/sqlite/content-library-repository.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'
import { CONTENT_CHANNELS } from '../../packages/domain/src/contracts/content-library.js'
import { registerContentHandlers } from '../../apps/desktop/src/main/ipc/content-handlers.js'
import { SrtImportService } from '../../apps/desktop/src/main/content/srt-import-service.js'
import { electronMockState, resetElectronMock } from '../setup/electron-mock.js'

const tempDirectories: string[] = []

afterEach(() => {
  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop()!, { force: true, recursive: true })
  }
})

describe('subtitle import flow', () => {
  beforeEach(() => {
    resetElectronMock()
  })

  it('imports a supported SRT file and warns before saving a duplicate', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sona-subtitle-import-'))
    tempDirectories.push(directory)
    const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)
    const sourcePath = path.join(directory, 'sample-drama.srt')
    const fixturePath = path.join(process.cwd(), 'fixtures/corpus/sample-drama.srt')
    writeFileSync(sourcePath, readFileSync(fixturePath, 'utf8'))

    registerContentHandlers(
      {
        contentRepository: repository,
        srtImportService: new SrtImportService({ now: () => 1_713_600_000_000, readFile: (filePath, encoding) => Promise.resolve(readFileSync(filePath, encoding)) }),
      },
      { ipcMain: electronMockState.ipcMain },
    )

    const importHandler = electronMockState.ipcMainHandlers.get(CONTENT_CHANNELS.importSrt)
    if (!importHandler) {
      throw new Error('Expected the import-srt IPC handler to be registered.')
    }

    const firstResult = await importHandler(undefined, { filePath: sourcePath, difficulty: 1 })
    expect(firstResult).toMatchObject({ ok: true })
    expect(repository.listLibraryItems()).toHaveLength(1)

    const blocks = repository.getContentBlocks((firstResult as { item: { id: string } }).item.id)
    expect(blocks).toHaveLength(3)
    expect(blocks.map((block) => block.audioOffset)).toEqual([1.2, 4.5, 8.1])

    const duplicateWarning = await importHandler(undefined, { filePath: sourcePath, difficulty: 1 })
    expect(duplicateWarning).toEqual(
      expect.objectContaining({
        ok: false,
        reason: 'duplicate-warning',
      }),
    )

    const confirmedDuplicate = await importHandler(undefined, {
      filePath: sourcePath,
      difficulty: 1,
      confirmDuplicate: true,
    })

    expect(confirmedDuplicate).toMatchObject({ ok: true })
    expect(repository.listLibraryItems()).toHaveLength(2)
  })
})