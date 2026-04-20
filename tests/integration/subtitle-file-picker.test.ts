import { beforeEach, describe, expect, it } from 'vitest'

import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { SqliteContentLibraryRepository } from '../../packages/data/src/sqlite/content-library-repository.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'
import { CONTENT_CHANNELS } from '../../packages/domain/src/contracts/content-library.js'
import { registerContentHandlers } from '../../apps/desktop/src/main/ipc/content-handlers.js'
import { electronMockState, resetElectronMock } from '../setup/electron-mock.js'

describe('subtitle file picker', () => {
  beforeEach(() => {
    resetElectronMock()
  })

  it('opens a native subtitle picker and returns the selected file path', async () => {
    const database = createSqliteConnection({ databasePath: ':memory:' })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)

    electronMockState.dialog.showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['/tmp/subtitles/sample.srt'],
    })

    registerContentHandlers(
      { contentRepository: repository },
      {
        ipcMain: electronMockState.ipcMain,
        dialog: electronMockState.dialog,
        browserWindow: { getFocusedWindow: () => null },
      },
    )

    const browseHandler = electronMockState.ipcMainHandlers.get(CONTENT_CHANNELS.browseSubtitleFile)
    if (!browseHandler) {
      throw new Error('Expected the browse-subtitle-file IPC handler to be registered.')
    }

    await expect(browseHandler()).resolves.toBe('/tmp/subtitles/sample.srt')
    expect(electronMockState.dialog.showOpenDialog).toHaveBeenCalledWith(null, {
      title: 'Choose Korean subtitle file',
      buttonLabel: 'Select subtitle',
      filters: [
        { name: 'Subtitle files', extensions: ['srt'] },
        { name: 'All files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })
  })

  it('returns null when the picker is cancelled', async () => {
    const database = createSqliteConnection({ databasePath: ':memory:' })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)

    electronMockState.dialog.showOpenDialog.mockResolvedValue({
      canceled: true,
      filePaths: [],
    })

    registerContentHandlers(
      { contentRepository: repository },
      {
        ipcMain: electronMockState.ipcMain,
        dialog: electronMockState.dialog,
        browserWindow: { getFocusedWindow: () => null },
      },
    )

    const browseHandler = electronMockState.ipcMainHandlers.get(CONTENT_CHANNELS.browseSubtitleFile)
    if (!browseHandler) {
      throw new Error('Expected the browse-subtitle-file IPC handler to be registered.')
    }

    await expect(browseHandler()).resolves.toBeNull()
  })
})