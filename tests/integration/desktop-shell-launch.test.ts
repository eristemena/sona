import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'
import { SqliteSettingsRepository } from '../../packages/data/src/sqlite/settings-repository.js'
import { electronMockState, resetElectronMock } from '../setup/electron-mock.js'

const tempDirectories: string[] = []

afterEach(() => {
  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop()!, { force: true, recursive: true })
  }
})

describe('desktop shell launch integration', () => {
  beforeEach(() => {
    resetElectronMock()
    electronMockState.nativeTheme.shouldUseDarkColors = false
  })

  it('restores the stored theme preference across relaunches', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sona-shell-launch-'))
    tempDirectories.push(directory)
    const databasePath = path.join(directory, 'sona.db')

    const firstDatabase = createSqliteConnection({ databasePath })
    runShellMigrations(firstDatabase)
    const firstRepository = new SqliteSettingsRepository(firstDatabase)

    firstRepository.setThemePreferenceMode('light')
    firstDatabase.close()

    const secondDatabase = createSqliteConnection({ databasePath })
    runShellMigrations(secondDatabase)
    const secondRepository = new SqliteSettingsRepository(secondDatabase)

    expect(secondRepository.getThemePreferenceMode()).toBe('light')

    secondDatabase.close()
  })

  it('returns a shell bootstrap payload with the persisted theme and ordered sidebar destinations', async () => {
    const { registerShellHandlers } = await import('../../apps/desktop/src/main/ipc/shell-handlers.js')

    registerShellHandlers(
      {
        settingsRepository: {
          getThemePreferenceMode: () => 'light',
        } as SqliteSettingsRepository,
      },
      {
        ipcMain: electronMockState.ipcMain,
        nativeTheme: electronMockState.nativeTheme,
      },
    )

    const bootstrapHandler = electronMockState.ipcMainHandlers.get('sona:shell:get-bootstrap-state')
    const bootstrapState = await bootstrapHandler?.()

    expect(bootstrapState).toMatchObject({
      appName: 'Sona',
      themePreference: 'light',
      resolvedTheme: 'light',
    })
    expect((bootstrapState as { navigation: Array<{ label: string }> }).navigation.map((item) => item.label)).toEqual([
      'Dashboard',
      'Library',
      'Review',
      'Settings',
    ])
  })
})