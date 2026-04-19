import type { NavigationDestinationId, ShellBootstrapState } from './shell-bootstrap.js'
import type { ResolvedTheme, ThemePreferenceMode } from '../settings/theme-preference.js'

export type { NavigationDestinationId, ResolvedTheme, ThemePreferenceMode }

export interface ThemeUpdateResult {
  themePreference: ThemePreferenceMode
  resolvedTheme: ResolvedTheme
}

export interface WindowSona {
  shell: {
    getBootstrapState(): Promise<ShellBootstrapState>
  }
  settings: {
    getThemePreference(): Promise<ThemePreferenceMode>
    setThemePreference(mode: ThemePreferenceMode): Promise<ThemeUpdateResult>
    subscribeThemeChanges(listener: (update: ThemeUpdateResult) => void): () => void
  }
}

declare global {
  interface Window {
    sona: WindowSona
  }
}