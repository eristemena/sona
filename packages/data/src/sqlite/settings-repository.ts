import type Database from 'better-sqlite3'

import {
  normalizeReadingAudioPreferenceRecord,
  normalizeReadingAudioVoicePreferenceRecord,
  READING_AUDIO_MODE_SETTING_KEY,
  READING_AUDIO_VOICE_SETTING_KEY,
  type ReadingAudioMode,
  type ReadingAudioVoice,
} from "@sona/domain/settings/reading-audio-preference";
import {
  normalizeThemePreferenceRecord,
  resolveThemePreference,
  THEME_PREFERENCE_SETTING_KEY,
  type ThemePreferenceMode,
} from '@sona/domain/settings/theme-preference'

const OPENAI_API_KEY_SETTING_KEY = "integrations.openaiApiKey";

interface SettingRow {
  key: string
  value_json: string
  updated_at: string
}

export class SqliteSettingsRepository {
  constructor(private readonly database: Database.Database) {}

  getReadingAudioMode(): ReadingAudioMode {
    const existing = this.getSetting(READING_AUDIO_MODE_SETTING_KEY);
    const parsed = existing
      ? normalizeReadingAudioPreferenceRecord(JSON.parse(existing.value_json))
      : null;

    if (!existing || !parsed) {
      this.setReadingAudioMode("standard");
      return "standard";
    }

    return parsed.mode;
  }

  getReadingAudioVoice(): ReadingAudioVoice {
    const existing = this.getSetting(READING_AUDIO_VOICE_SETTING_KEY);
    const parsed = existing
      ? normalizeReadingAudioVoicePreferenceRecord(
          JSON.parse(existing.value_json),
        )
      : null;

    if (!existing || !parsed) {
      this.setReadingAudioVoice("alloy");
      return "alloy";
    }

    return parsed.voice;
  }

  getOpenAiApiKey(): string | null {
    const existing = this.getSetting(OPENAI_API_KEY_SETTING_KEY);
    const parsed = existing
      ? normalizeApiKeySettingRecord(JSON.parse(existing.value_json))
      : null;

    if (!existing || !parsed) {
      return null;
    }

    return parsed.apiKey;
  }

  hasOpenAiApiKey(): boolean {
    return this.getOpenAiApiKey() !== null;
  }

  getThemePreferenceMode(): ThemePreferenceMode {
    const existing = this.getSetting(THEME_PREFERENCE_SETTING_KEY);
    const parsed = existing
      ? normalizeThemePreferenceRecord(JSON.parse(existing.value_json))
      : null;
    const resolved = resolveThemePreference({
      storedPreference: parsed?.mode ?? null,
      systemTheme: null,
    });

    if (!existing || !parsed) {
      this.setThemePreferenceMode(resolved.themePreference);
    }

    return resolved.themePreference;
  }

  setReadingAudioMode(mode: ReadingAudioMode) {
    const now = new Date().toISOString();
    const payload = JSON.stringify({ mode });
    const statement = this.database.prepare(
      `
        INSERT INTO settings (key, value_json, updated_at)
        VALUES (@key, @value_json, @updated_at)
        ON CONFLICT(key) DO UPDATE SET
          value_json = excluded.value_json,
          updated_at = excluded.updated_at
      `,
    );

    statement.run({
      key: READING_AUDIO_MODE_SETTING_KEY,
      value_json: payload,
      updated_at: now,
    });
  }

  setReadingAudioVoice(voice: ReadingAudioVoice) {
    const now = new Date().toISOString();
    const payload = JSON.stringify({ voice });
    const statement = this.database.prepare(
      `
        INSERT INTO settings (key, value_json, updated_at)
        VALUES (@key, @value_json, @updated_at)
        ON CONFLICT(key) DO UPDATE SET
          value_json = excluded.value_json,
          updated_at = excluded.updated_at
      `,
    );

    statement.run({
      key: READING_AUDIO_VOICE_SETTING_KEY,
      value_json: payload,
      updated_at: now,
    });
  }

  setThemePreferenceMode(mode: ThemePreferenceMode) {
    const now = new Date().toISOString();
    const payload = JSON.stringify({ mode });
    const statement = this.database.prepare(
      `
        INSERT INTO settings (key, value_json, updated_at)
        VALUES (@key, @value_json, @updated_at)
        ON CONFLICT(key) DO UPDATE SET
          value_json = excluded.value_json,
          updated_at = excluded.updated_at
      `,
    );

    statement.run({
      key: THEME_PREFERENCE_SETTING_KEY,
      value_json: payload,
      updated_at: now,
    });
  }

  setOpenAiApiKey(apiKey: string | null) {
    const normalizedApiKey = normalizeApiKeyInput(apiKey);
    if (!normalizedApiKey) {
      this.deleteSetting(OPENAI_API_KEY_SETTING_KEY);
      return;
    }

    const now = new Date().toISOString();
    const payload = JSON.stringify({ apiKey: normalizedApiKey });
    const statement = this.database.prepare(
      `
        INSERT INTO settings (key, value_json, updated_at)
        VALUES (@key, @value_json, @updated_at)
        ON CONFLICT(key) DO UPDATE SET
          value_json = excluded.value_json,
          updated_at = excluded.updated_at
      `,
    );

    statement.run({
      key: OPENAI_API_KEY_SETTING_KEY,
      value_json: payload,
      updated_at: now,
    });
  }

  private getSetting(key: string): SettingRow | undefined {
    return this.database
      .prepare("SELECT key, value_json, updated_at FROM settings WHERE key = ?")
      .get(key) as SettingRow | undefined;
  }

  private deleteSetting(key: string) {
    this.database.prepare("DELETE FROM settings WHERE key = ?").run(key);
  }
}

function normalizeApiKeyInput(apiKey: string | null): string | null {
  if (typeof apiKey !== "string") {
    return null;
  }

  const trimmedApiKey = apiKey.trim();
  return trimmedApiKey.length > 0 ? trimmedApiKey : null;
}

function normalizeApiKeySettingRecord(
  value: unknown,
): { apiKey: string } | null {
  if (!value || typeof value !== "object" || !("apiKey" in value)) {
    return null;
  }

  const normalizedApiKey = normalizeApiKeyInput(
    (value as { apiKey?: unknown }).apiKey as string | null,
  );
  return normalizedApiKey ? { apiKey: normalizedApiKey } : null;
}