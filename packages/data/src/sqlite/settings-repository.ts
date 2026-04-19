import type Database from 'better-sqlite3'

import {
  normalizeThemePreferenceRecord,
  resolveThemePreference,
  THEME_PREFERENCE_SETTING_KEY,
  type ThemePreferenceMode,
} from '@sona/domain/settings/theme-preference'

interface SettingRow {
  key: string
  value_json: string
  updated_at: string
}

export class SqliteSettingsRepository {
  constructor(private readonly database: Database.Database) {}

  getThemePreferenceMode(): ThemePreferenceMode {
    const existing = this.getSetting(THEME_PREFERENCE_SETTING_KEY)
    const parsed = existing ? normalizeThemePreferenceRecord(JSON.parse(existing.value_json)) : null
    const resolved = resolveThemePreference({ storedPreference: parsed?.mode ?? null, systemTheme: null })

    if (!existing || !parsed) {
      this.setThemePreferenceMode(resolved.themePreference)
    }

    return resolved.themePreference
  }

  setThemePreferenceMode(mode: ThemePreferenceMode) {
    const now = new Date().toISOString()
    const payload = JSON.stringify({ mode })
    const statement = this.database.prepare(
      `
        INSERT INTO settings (key, value_json, updated_at)
        VALUES (@key, @value_json, @updated_at)
        ON CONFLICT(key) DO UPDATE SET
          value_json = excluded.value_json,
          updated_at = excluded.updated_at
      `,
    )

    statement.run({
      key: THEME_PREFERENCE_SETTING_KEY,
      value_json: payload,
      updated_at: now,
    })
  }

  private getSetting(key: string): SettingRow | undefined {
    return this.database.prepare('SELECT key, value_json, updated_at FROM settings WHERE key = ?').get(key) as
      | SettingRow
      | undefined
  }
}