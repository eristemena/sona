export type ThemePreferenceMode = 'system' | 'dark' | 'light'
export type ResolvedTheme = 'dark' | 'light'
export type SystemTheme = ResolvedTheme

export const THEME_PREFERENCE_SETTING_KEY = 'appearance.themePreference'

export interface ThemePreferenceRecord {
  mode: ThemePreferenceMode
}

export interface ResolvedThemePreference {
  source: 'stored-setting' | 'default' | 'invalid-setting-fallback'
  themePreference: ThemePreferenceMode
  resolvedTheme: ResolvedTheme
}

export function isThemePreferenceMode(value: unknown): value is ThemePreferenceMode {
  return value === 'system' || value === 'dark' || value === 'light'
}

export function normalizeThemePreferenceRecord(value: unknown): ThemePreferenceRecord | null {
  if (!value || typeof value !== 'object' || !('mode' in value)) {
    return null
  }

  const mode = (value as { mode?: unknown }).mode
  return isThemePreferenceMode(mode) ? { mode } : null
}

export function resolveThemePreference(input: {
  storedPreference?: ThemePreferenceMode | null
  systemTheme?: SystemTheme | null
}): ResolvedThemePreference {
  if (isThemePreferenceMode(input.storedPreference)) {
    return {
      source: 'stored-setting',
      themePreference: input.storedPreference,
      resolvedTheme: input.storedPreference === 'system' ? input.systemTheme ?? 'dark' : input.storedPreference,
    }
  }

  return {
    source: input.storedPreference == null ? 'default' : 'invalid-setting-fallback',
    themePreference: 'system',
    resolvedTheme: input.systemTheme ?? 'dark',
  }
}