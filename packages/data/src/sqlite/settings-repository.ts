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
import {
  DEFAULT_ANNOTATION_CACHE_DAYS,
  DEFAULT_DAILY_STUDY_GOAL,
  DEFAULT_MAX_LLM_CALLS_PER_SESSION,
  DEFAULT_STUDY_KOREAN_LEVEL,
  normalizeStudyTtsVoiceRecord,
  normalizeStudyKoreanLevelRecord,
  OPENROUTER_API_KEY_SETTING_KEY,
  STUDY_ANNOTATION_CACHE_DAYS_SETTING_KEY,
  STUDY_KOREAN_LEVEL_SETTING_KEY,
  STUDY_MAX_LLM_CALLS_SETTING_KEY,
  STUDY_TTS_VOICE_SETTING_KEY,
  type StudyKoreanLevel,
} from "@sona/domain/settings/study-preferences";

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

  getAnnotationCacheDays(): number {
    const existing = this.getSetting(STUDY_ANNOTATION_CACHE_DAYS_SETTING_KEY);
    const parsed = existing
      ? normalizePositiveIntegerSettingRecord(JSON.parse(existing.value_json))
      : null;

    if (!existing || !parsed) {
      this.setAnnotationCacheDays(DEFAULT_ANNOTATION_CACHE_DAYS);
      return DEFAULT_ANNOTATION_CACHE_DAYS;
    }

    return parsed.value;
  }

  getDailyStudyGoal(): number {
    const existing = this.getSetting(DAILY_STUDY_GOAL_SETTING_KEY);
    const parsed = existing
      ? normalizeDailyStudyGoalRecord(JSON.parse(existing.value_json))
      : null;

    if (!existing || !parsed) {
      this.setDailyStudyGoal(DEFAULT_DAILY_STUDY_GOAL);
      return DEFAULT_DAILY_STUDY_GOAL;
    }

    return parsed.target;
  }

  getMaxLlmCallsPerSession(): number {
    const existing = this.getSetting(STUDY_MAX_LLM_CALLS_SETTING_KEY);
    const parsed = existing
      ? normalizePositiveIntegerSettingRecord(JSON.parse(existing.value_json))
      : null;

    if (!existing || !parsed) {
      this.setMaxLlmCallsPerSession(DEFAULT_MAX_LLM_CALLS_PER_SESSION);
      return DEFAULT_MAX_LLM_CALLS_PER_SESSION;
    }

    return parsed.value;
  }

  getOpenRouterApiKey(): string | null {
    const existing = this.getSetting(OPENROUTER_API_KEY_SETTING_KEY);
    const parsed = existing
      ? normalizeApiKeySettingRecord(JSON.parse(existing.value_json))
      : null;

    if (!existing || !parsed) {
      return null;
    }

    return parsed.apiKey;
  }

  hasOpenRouterApiKey(): boolean {
    return this.getOpenRouterApiKey() !== null;
  }

  getStudyTtsVoice(): ReadingAudioVoice {
    const existing = this.getSetting(STUDY_TTS_VOICE_SETTING_KEY);
    const parsed = existing
      ? normalizeStudyTtsVoiceRecord(JSON.parse(existing.value_json))
      : null;

    if (!existing || !parsed) {
      this.setStudyTtsVoice("alloy");
      return "alloy";
    }

    return parsed.voice;
  }

  getStudyKoreanLevel(): StudyKoreanLevel {
    const existing = this.getSetting(STUDY_KOREAN_LEVEL_SETTING_KEY);
    const parsed = existing
      ? normalizeStudyKoreanLevelRecord(JSON.parse(existing.value_json))
      : null;

    if (!existing || !parsed) {
      this.setStudyKoreanLevel(DEFAULT_STUDY_KOREAN_LEVEL);
      return DEFAULT_STUDY_KOREAN_LEVEL;
    }

    return parsed.level;
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

  setOpenRouterApiKey(apiKey: string | null) {
    const normalizedApiKey = normalizeApiKeyInput(apiKey);
    if (!normalizedApiKey) {
      this.deleteSetting(OPENROUTER_API_KEY_SETTING_KEY);
      return;
    }

    this.setJsonSetting(OPENROUTER_API_KEY_SETTING_KEY, {
      apiKey: normalizedApiKey,
    });
  }

  setDailyStudyGoal(target: number) {
    const normalizedTarget = normalizeDailyStudyGoal(target);
    this.setJsonSetting(DAILY_STUDY_GOAL_SETTING_KEY, {
      target: normalizedTarget,
      updatedAt: Date.now(),
    });
  }

  setAnnotationCacheDays(days: number) {
    this.setJsonSetting(STUDY_ANNOTATION_CACHE_DAYS_SETTING_KEY, {
      value: normalizeAnnotationCacheDays(days),
      updatedAt: Date.now(),
    });
  }

  setMaxLlmCallsPerSession(value: number) {
    this.setJsonSetting(STUDY_MAX_LLM_CALLS_SETTING_KEY, {
      value: normalizeMaxLlmCallsPerSession(value),
      updatedAt: Date.now(),
    });
  }

  setStudyKoreanLevel(level: StudyKoreanLevel) {
    this.setJsonSetting(STUDY_KOREAN_LEVEL_SETTING_KEY, {
      level,
      updatedAt: Date.now(),
    });
  }

  setStudyTtsVoice(voice: ReadingAudioVoice) {
    this.setJsonSetting(STUDY_TTS_VOICE_SETTING_KEY, {
      voice,
      updatedAt: Date.now(),
    });
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
    return DEFAULT_DAILY_STUDY_GOAL;
  }

  return Math.max(1, Math.min(500, Math.trunc(value)));
}

function normalizeAnnotationCacheDays(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ANNOTATION_CACHE_DAYS;
  }

  return Math.max(1, Math.min(90, Math.trunc(value)));
}

function normalizeMaxLlmCallsPerSession(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_MAX_LLM_CALLS_PER_SESSION;
  }

  return Math.max(1, Math.min(50, Math.trunc(value)));
}

function normalizeDailyStudyGoalRecord(
  value: unknown,
): { target: number; updatedAt: number } | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as { target?: unknown; updatedAt?: unknown };
  if (typeof record.target !== "number" || !Number.isFinite(record.target)) {
    return null;
  }

  const target = normalizeDailyStudyGoal(record.target);
  const updatedAt =
    typeof record.updatedAt === "number" && Number.isFinite(record.updatedAt)
      ? record.updatedAt
      : Date.now();

  return { target, updatedAt };
}

function normalizePositiveIntegerSettingRecord(
  value: unknown,
): { value: number; updatedAt: number } | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as { value?: unknown; updatedAt?: unknown };
  if (typeof record.value !== "number" || !Number.isFinite(record.value)) {
    return null;
  }

  const updatedAt =
    typeof record.updatedAt === "number" && Number.isFinite(record.updatedAt)
      ? record.updatedAt
      : Date.now();

  return {
    value: Math.max(1, Math.trunc(record.value)),
    updatedAt,
  };
}