import type Database from "better-sqlite3";

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
} from "@sona/domain/settings/theme-preference";

const OPENAI_API_KEY_SETTING_KEY = "integrations.openaiApiKey";
const DAILY_STUDY_GOAL_SETTING_KEY = 'study.dailyGoal'
export const KNOWN_WORD_ONBOARDING_SETTING_KEY =
  "study.knownWords.onboardingComplete";

interface SettingRow {
  key: string;
  value_json: string;
  updated_at: string;
}

export interface KnownWordOnboardingSettingRecord {
  completed: true;
  completedAt: number;
  selectedSeedPack: string;
}

export class SqliteSettingsRepository {
  constructor(private readonly database: Database.Database) {}

  getDailyStudyGoal(): number {
    const existing = this.getSetting(DAILY_STUDY_GOAL_SETTING_KEY)
    const parsed = existing ? normalizeDailyStudyGoalRecord(JSON.parse(existing.value_json)) : null

    if (!existing || !parsed) {
      this.setDailyStudyGoal(20)
      return 20
    }

    return parsed.target
  }

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

  setDailyStudyGoal(target: number) {
    const normalizedTarget = normalizeDailyStudyGoal(target)
    this.setJsonSetting(DAILY_STUDY_GOAL_SETTING_KEY, {
      target: normalizedTarget,
      updatedAt: Date.now(),
    })
  }

  getKnownWordOnboardingRecord(): KnownWordOnboardingSettingRecord | null {
    const existing = this.getSetting(KNOWN_WORD_ONBOARDING_SETTING_KEY);
    if (!existing) {
      return null;
    }

    return normalizeKnownWordOnboardingSettingRecord(
      JSON.parse(existing.value_json),
    );
  }

  setKnownWordOnboardingRecord(record: KnownWordOnboardingSettingRecord) {
    this.setJsonSetting(KNOWN_WORD_ONBOARDING_SETTING_KEY, record);
  }

  clearKnownWordOnboardingRecord() {
    this.deleteSetting(KNOWN_WORD_ONBOARDING_SETTING_KEY);
  }

  private getSetting(key: string): SettingRow | undefined {
    return this.database
      .prepare("SELECT key, value_json, updated_at FROM settings WHERE key = ?")
      .get(key) as SettingRow | undefined;
  }

  private deleteSetting(key: string) {
    this.database.prepare("DELETE FROM settings WHERE key = ?").run(key);
  }

  private setJsonSetting(key: string, value: unknown) {
    const now = new Date().toISOString();
    const payload = JSON.stringify(value);
    this.database
      .prepare(
        `
        INSERT INTO settings (key, value_json, updated_at)
        VALUES (@key, @value_json, @updated_at)
        ON CONFLICT(key) DO UPDATE SET
          value_json = excluded.value_json,
          updated_at = excluded.updated_at
      `,
      )
      .run({
        key,
        value_json: payload,
        updated_at: now,
      });
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

function normalizeKnownWordOnboardingSettingRecord(
  value: unknown,
): KnownWordOnboardingSettingRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Partial<KnownWordOnboardingSettingRecord>;
  if (
    record.completed !== true ||
    typeof record.completedAt !== "number" ||
    !Number.isFinite(record.completedAt) ||
    typeof record.selectedSeedPack !== "string" ||
    record.selectedSeedPack.trim().length === 0
  ) {
    return null;
  }

  return {
    completed: true,
    completedAt: record.completedAt,
    selectedSeedPack: record.selectedSeedPack.trim(),
  };
}

function normalizeDailyStudyGoal(value: number): number {
  if (!Number.isFinite(value)) {
    return 20
  }

  return Math.max(1, Math.min(500, Math.trunc(value)))
}

function normalizeDailyStudyGoalRecord(
  value: unknown,
): { target: number; updatedAt: number } | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as { target?: unknown; updatedAt?: unknown }
  if (typeof record.target !== 'number' || !Number.isFinite(record.target)) {
    return null
  }

  const target = normalizeDailyStudyGoal(record.target)
  const updatedAt =
    typeof record.updatedAt === 'number' && Number.isFinite(record.updatedAt)
      ? record.updatedAt
      : Date.now()

  return { target, updatedAt }
}