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
      expect.arrayContaining([
        "schema_migrations",
        "settings",
        "study_sessions",
      ]),
    );
    expect(appliedMigrations).toEqual(
      expect.arrayContaining([
        { version: 1, name: "001_shell_v1" },
        { version: 2, name: "002_content_library_v1" },
        { version: 6, name: "006_home_dashboard_v1" },
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

  it("stores and clears the integrations.openaiApiKey setting through the repository", () => {
    const database = createTestDatabase();
    const repository = new SqliteSettingsRepository(database);

    expect(repository.hasOpenAiApiKey()).toBe(false);
    expect(repository.getOpenAiApiKey()).toBeNull();

    repository.setOpenAiApiKey("  sk-test-openai  ");

    expect(repository.hasOpenAiApiKey()).toBe(true);
    expect(repository.getOpenAiApiKey()).toBe("sk-test-openai");

    repository.setOpenAiApiKey(null);

    expect(repository.hasOpenAiApiKey()).toBe(false);
    expect(repository.getOpenAiApiKey()).toBeNull();
  });

  it("stores and clears the integrations.openRouterApiKey setting through the repository", () => {
    const database = createTestDatabase();
    const repository = new SqliteSettingsRepository(database);

    expect(repository.hasOpenRouterApiKey()).toBe(false);
    expect(repository.getOpenRouterApiKey()).toBeNull();

    repository.setOpenRouterApiKey("  sk-or-local  ");

    expect(repository.hasOpenRouterApiKey()).toBe(true);
    expect(repository.getOpenRouterApiKey()).toBe("sk-or-local");

    repository.setOpenRouterApiKey(null);

    expect(repository.hasOpenRouterApiKey()).toBe(false);
    expect(repository.getOpenRouterApiKey()).toBeNull();
  });

  it("seeds and repairs the study.dailyGoal setting through the repository", () => {
    const database = createTestDatabase();
    const repository = new SqliteSettingsRepository(database);

    expect(repository.getDailyStudyGoal()).toBe(20);

    let storedSetting = database
      .prepare("SELECT value_json FROM settings WHERE key = ?")
      .get("study.dailyGoal") as { value_json: string };

    expect(JSON.parse(storedSetting.value_json)).toEqual(
      expect.objectContaining({ target: 20 }),
    );

    database
      .prepare("UPDATE settings SET value_json = ? WHERE key = ?")
      .run(JSON.stringify({ target: "nope" }), "study.dailyGoal");

    expect(repository.getDailyStudyGoal()).toBe(20);

    storedSetting = database
      .prepare("SELECT value_json FROM settings WHERE key = ?")
      .get("study.dailyGoal") as { value_json: string };

    expect(JSON.parse(storedSetting.value_json)).toEqual(
      expect.objectContaining({ target: 20 }),
    );

    repository.setDailyStudyGoal(37);
    expect(repository.getDailyStudyGoal()).toBe(37);

    storedSetting = database
      .prepare("SELECT value_json FROM settings WHERE key = ?")
      .get("study.dailyGoal") as { value_json: string };

    expect(JSON.parse(storedSetting.value_json)).toEqual(
      expect.objectContaining({ target: 37 }),
    );
  });

  it("seeds and repairs the study.ttsVoice setting through the repository", () => {
    const database = createTestDatabase();
    const repository = new SqliteSettingsRepository(database);

    expect(repository.getStudyTtsVoice()).toBe("alloy");

    let storedSetting = database
      .prepare("SELECT value_json FROM settings WHERE key = ?")
      .get("study.ttsVoice") as { value_json: string };

    expect(JSON.parse(storedSetting.value_json)).toEqual(
      expect.objectContaining({ voice: "alloy" }),
    );

    database
      .prepare("UPDATE settings SET value_json = ? WHERE key = ?")
      .run(JSON.stringify({ voice: "robot" }), "study.ttsVoice");

    expect(repository.getStudyTtsVoice()).toBe("alloy");

    storedSetting = database
      .prepare("SELECT value_json FROM settings WHERE key = ?")
      .get("study.ttsVoice") as { value_json: string };

    expect(JSON.parse(storedSetting.value_json)).toEqual(
      expect.objectContaining({ voice: "alloy" }),
    );

    repository.setStudyTtsVoice("coral");
    expect(repository.getStudyTtsVoice()).toBe("coral");

    storedSetting = database
      .prepare("SELECT value_json FROM settings WHERE key = ?")
      .get("study.ttsVoice") as { value_json: string };

    expect(JSON.parse(storedSetting.value_json)).toEqual(
      expect.objectContaining({ voice: "coral" }),
    );
  });
})