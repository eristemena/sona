import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
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

describe('subtitle import error handling', () => {
  beforeEach(() => {
    resetElectronMock()
  })

  it('rejects malformed or non-Korean subtitle input without creating a partial item', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sona-subtitle-error-'))
    tempDirectories.push(directory)
    const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)
    const invalidSubtitlePath = path.join(directory, 'invalid.srt')
    writeFileSync(
      invalidSubtitlePath,
      ['1', '00:00:01,000 --> 00:00:02,000', 'Hello there', '', '2', '00:00:03,000 --> 00:00:04,000', 'Still no Korean'].join('\n'),
    )

    registerContentHandlers(
      {
        contentRepository: repository,
        srtImportService: new SrtImportService({ now: () => 1_713_600_000_000, readFile }),
      },
      { ipcMain: electronMockState.ipcMain },
    )

    const importHandler = electronMockState.ipcMainHandlers.get(CONTENT_CHANNELS.importSrt)
    if (!importHandler) {
      throw new Error('Expected the import-srt IPC handler to be registered.')
    }

    const result = await importHandler(undefined, { filePath: invalidSubtitlePath, difficulty: 2 })
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        reason: 'invalid-input',
      }),
    )
    expect(repository.listLibraryItems()).toEqual([])
  })
})