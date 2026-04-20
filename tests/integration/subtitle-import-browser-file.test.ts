import { readFileSync } from 'node:fs'
import path from 'node:path'

import { beforeEach, describe, expect, it } from 'vitest'

import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { SqliteContentLibraryRepository } from '../../packages/data/src/sqlite/content-library-repository.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'
import { CONTENT_CHANNELS } from '../../packages/domain/src/contracts/content-library.js'
import { registerContentHandlers } from '../../apps/desktop/src/main/ipc/content-handlers.js'
import { SrtImportService } from '../../apps/desktop/src/main/content/srt-import-service.js'
import { electronMockState, resetElectronMock } from '../setup/electron-mock.js'

describe('subtitle import from browser-selected file contents', () => {
  beforeEach(() => {
    resetElectronMock()
  })

  it('imports subtitle text without requiring a filesystem path', async () => {
    const database = createSqliteConnection({ databasePath: ':memory:' })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)

    registerContentHandlers(
      {
        contentRepository: repository,
        srtImportService: new SrtImportService({
          now: () => 1_713_600_000_000,
          readFile: async () => {
            throw new Error('readFile should not be called for browser file imports')
          },
        }),
      },
      {
        ipcMain: electronMockState.ipcMain,
        dialog: electronMockState.dialog,
        browserWindow: { getFocusedWindow: () => null },
      },
    )

    const importHandler = electronMockState.ipcMainHandlers.get(CONTENT_CHANNELS.importSrt)
    if (!importHandler) {
      throw new Error('Expected the import-srt IPC handler to be registered.')
    }

    const fixturePath = path.join(process.cwd(), 'fixtures/corpus/sample-drama.srt')

    const result = await importHandler(undefined, {
      fileName: 'sample-drama.srt',
      fileContent: readFileSync(fixturePath, 'utf8'),
      difficulty: 1,
    })

    expect(result).toMatchObject({ ok: true })
    expect(repository.listLibraryItems()).toHaveLength(1)
  })
})