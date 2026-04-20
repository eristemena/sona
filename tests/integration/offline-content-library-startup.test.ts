import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { registerContentHandlers } from '../../apps/desktop/src/main/ipc/content-handlers.js'
import { registerShellHandlers } from '../../apps/desktop/src/main/ipc/shell-handlers.js'
import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { SqliteContentLibraryRepository } from '../../packages/data/src/sqlite/content-library-repository.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'
import { SqliteSettingsRepository } from '../../packages/data/src/sqlite/settings-repository.js'
import { CONTENT_CHANNELS } from '../../packages/domain/src/contracts/content-library.js'
import { THEME_PREFERENCE_SETTING_KEY } from '../../packages/domain/src/settings/theme-preference.js'
import { electronMockState, resetElectronMock } from '../setup/electron-mock.js'

const tempDirectories: string[] = []

afterEach(() => {
  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop()!, { force: true, recursive: true })
  }
})

function createDatabasePath(prefix: string) {
  const directory = mkdtempSync(path.join(tmpdir(), prefix))
  tempDirectories.push(directory)
  return path.join(directory, 'sona.db')
}

describe('offline content-library startup', () => {
  beforeEach(() => {
    resetElectronMock()
  })

  it('preserves existing shell settings while migrating in the content-library schema', () => {
    const databasePath = createDatabasePath('sona-offline-library-migration-')
    const legacyDatabase = createSqliteConnection({ databasePath })

    legacyDatabase.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE,
        checksum TEXT,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `)

    legacyDatabase
      .prepare('INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES (?, ?, ?, ?)')
      .run(1, '001_shell_v1', null, new Date('2026-04-18T12:00:00.000Z').toISOString())
    legacyDatabase
      .prepare('INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)')
      .run(THEME_PREFERENCE_SETTING_KEY, JSON.stringify({ mode: 'dark' }), new Date('2026-04-18T12:00:00.000Z').toISOString())
    legacyDatabase.close()

    const migratedDatabase = createSqliteConnection({ databasePath })
    runShellMigrations(migratedDatabase)
    const settingsRepository = new SqliteSettingsRepository(migratedDatabase)

    expect(settingsRepository.getThemePreferenceMode()).toBe('dark')

    const tables = migratedDatabase
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('content_library_items', 'content_blocks', 'content_source_records', 'generation_requests') ORDER BY name",
      )
      .all() as Array<{ name: string }>
    const appliedVersions = migratedDatabase
      .prepare('SELECT version FROM schema_migrations ORDER BY version ASC')
      .all() as Array<{ version: number }>

    expect(tables.map((row) => row.name)).toEqual([
      'content_blocks',
      'content_library_items',
      'content_source_records',
      'generation_requests',
    ])
    expect(appliedVersions.map((row) => row.version)).toEqual([1, 2])

    migratedDatabase.close()
  })

  it('boots shell and content-library handlers against a migrated offline database', async () => {
    const databasePath = createDatabasePath('sona-offline-library-bootstrap-')
    const database = createSqliteConnection({ databasePath })
    runShellMigrations(database)

    const settingsRepository = new SqliteSettingsRepository(database)
    settingsRepository.setThemePreferenceMode('light')

    registerShellHandlers(
      { settingsRepository },
      {
        ipcMain: electronMockState.ipcMain,
        nativeTheme: electronMockState.nativeTheme,
      },
    )
    registerContentHandlers(
      {
        contentRepository: new SqliteContentLibraryRepository(database),
      },
      {
        ipcMain: electronMockState.ipcMain,
        dialog: electronMockState.dialog,
        browserWindow: { getFocusedWindow: () => null },
      },
    )

    const bootstrapHandler = electronMockState.ipcMainHandlers.get('sona:shell:get-bootstrap-state')
    const listHandler = electronMockState.ipcMainHandlers.get(CONTENT_CHANNELS.listLibraryItems)
    const blocksHandler = electronMockState.ipcMainHandlers.get(CONTENT_CHANNELS.getContentBlocks)

    if (!bootstrapHandler || !listHandler || !blocksHandler) {
      throw new Error('Expected shell and content handlers to be registered during offline startup.')
    }

    const bootstrapState = await bootstrapHandler(undefined)
    const listedItems = await listHandler(undefined, { filter: 'all' })
    const missingBlocks = await blocksHandler(undefined, 'missing-item')

    expect(bootstrapState).toMatchObject({
      appName: 'Sona',
      themePreference: 'light',
      resolvedTheme: 'light',
    })
    expect(listedItems).toEqual([])
    expect(missingBlocks).toEqual([])

    database.close()
  })
})