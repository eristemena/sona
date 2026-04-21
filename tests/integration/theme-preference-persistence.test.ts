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

describe('theme preference persistence integration', () => {
  beforeEach(() => {
    resetElectronMock()
    electronMockState.nativeTheme.shouldUseDarkColors = true
    electronMockState.nativeTheme.themeSource = 'system'
  })

  it('persists a manual theme override and broadcasts the resolved update', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sona-theme-persistence-'))
    tempDirectories.push(directory)
    const databasePath = path.join(directory, 'sona.db')
    const database = createSqliteConnection({ databasePath })

    runShellMigrations(database)

    const repository = new SqliteSettingsRepository(database)
    const send = vi.fn()
    const { registerSettingsHandlersWithRuntime } = await import('../../apps/desktop/src/main/ipc/settings-handlers.js')

    registerSettingsHandlersWithRuntime(
      {
        settingsRepository: repository,
        windows: () => [{ webContents: { send } }] as never[],
      },
      {
        ipcMain: electronMockState.ipcMain,
        nativeTheme: electronMockState.nativeTheme,
      },
    )

    const setThemePreference = electronMockState.ipcMainHandlers.get('sona:settings:set-theme-preference')
    const update = await setThemePreference?.({}, 'light')

    expect(update).toEqual({ themePreference: 'light', resolvedTheme: 'light' })
    expect(electronMockState.nativeTheme.themeSource).toBe('light')
    expect(send).toHaveBeenCalledWith('sona:settings:theme-changed', {
      themePreference: 'light',
      resolvedTheme: 'light',
    })

    database.close()

    const reopenedDatabase = createSqliteConnection({ databasePath })
    runShellMigrations(reopenedDatabase)
    const reopenedRepository = new SqliteSettingsRepository(reopenedDatabase)

    expect(reopenedRepository.getThemePreferenceMode()).toBe('light')

    reopenedDatabase.close()
  })

  it("persists the reading-audio mode across relaunches", async () => {
    const directory = mkdtempSync(
      path.join(tmpdir(), "sona-reading-audio-mode-"),
    );
    tempDirectories.push(directory);
    const databasePath = path.join(directory, "sona.db");
    const database = createSqliteConnection({ databasePath });

    runShellMigrations(database);

    const repository = new SqliteSettingsRepository(database);
    const { registerSettingsHandlersWithRuntime } =
      await import("../../apps/desktop/src/main/ipc/settings-handlers.js");

    registerSettingsHandlersWithRuntime(
      {
        settingsRepository: repository,
        windows: () => [],
      },
      {
        ipcMain: electronMockState.ipcMain,
        nativeTheme: electronMockState.nativeTheme,
      },
    );

    const setReadingAudioMode = electronMockState.ipcMainHandlers.get(
      "sona:settings:set-reading-audio-mode",
    );
    const update = await setReadingAudioMode?.({}, "learner-slow");

    expect(update).toEqual({ mode: "learner-slow" });
    expect(repository.getReadingAudioMode()).toBe("learner-slow");

    database.close();

    const reopenedDatabase = createSqliteConnection({ databasePath });
    runShellMigrations(reopenedDatabase);
    const reopenedRepository = new SqliteSettingsRepository(reopenedDatabase);

    expect(reopenedRepository.getReadingAudioMode()).toBe("learner-slow");

    reopenedDatabase.close();
  });
})