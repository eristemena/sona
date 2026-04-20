import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'
import { SqliteSettingsRepository } from '../../packages/data/src/sqlite/settings-repository.js'
import { THEME_PREFERENCE_SETTING_KEY } from '../../packages/domain/src/settings/theme-preference.js'

const tempDirectories: string[] = []

afterEach(() => {
  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop()!, { force: true, recursive: true })
  }
})

function createTestDatabase() {
  const directory = mkdtempSync(path.join(tmpdir(), 'sona-shell-schema-'))
  tempDirectories.push(directory)

  const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
  runShellMigrations(database)

  return database
}

describe('shell schema contract', () => {
  it('creates the v1 settings schema and records the applied migration', () => {
    const database = createTestDatabase()

    const tableNames = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>

    const appliedMigrations = database
      .prepare('SELECT version, name FROM schema_migrations ORDER BY version ASC')
      .all() as Array<{ version: number; name: string }>

    expect(tableNames.map((row) => row.name)).toEqual(
      expect.arrayContaining(['schema_migrations', 'settings']),
    )
    expect(appliedMigrations).toEqual(
      expect.arrayContaining([
        { version: 1, name: "001_shell_v1" },
        { version: 2, name: "002_content_library_v1" },
      ]),
    );
  })

  it('seeds and repairs the appearance.themePreference setting through the repository', () => {
    const database = createTestDatabase()
    const repository = new SqliteSettingsRepository(database)

    expect(repository.getThemePreferenceMode()).toBe('system')

    database
      .prepare('UPDATE settings SET value_json = ? WHERE key = ?')
      .run(JSON.stringify({ mode: 'sepia' }), THEME_PREFERENCE_SETTING_KEY)

    expect(repository.getThemePreferenceMode()).toBe('system')

    const storedSetting = database
      .prepare('SELECT value_json FROM settings WHERE key = ?')
      .get(THEME_PREFERENCE_SETTING_KEY) as { value_json: string }

    expect(JSON.parse(storedSetting.value_json)).toEqual({ mode: 'system' })
  })
})