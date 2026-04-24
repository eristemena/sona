import { resolveThemePreference, type ResolvedTheme, type SystemTheme, type ThemePreferenceMode } from '../settings/theme-preference.js'

export type NavigationDestinationId = 'dashboard' | 'library' | 'review' | 'settings'

export interface NavigationDestination {
  id: NavigationDestinationId
  label: string
  order: number
}

export interface ShellBootstrapState {
  appName: 'Sona'
  defaultDestination: NavigationDestinationId
  navigation: NavigationDestination[]
  themePreference: ThemePreferenceMode
  resolvedTheme: ResolvedTheme
  systemTheme: SystemTheme
}

export const DEFAULT_NAVIGATION_DESTINATIONS: NavigationDestination[] = [
  { id: 'dashboard', label: 'Dashboard', order: 1 },
  { id: 'library', label: 'Library', order: 2 },
  { id: 'review', label: 'Review', order: 3 },
  { id: 'settings', label: 'Settings', order: 4 },
]

export function createShellBootstrapState(input: {
  defaultDestination?: NavigationDestinationId
  navigation?: NavigationDestination[]
  systemTheme: SystemTheme
  themePreference: ThemePreferenceMode
}): ShellBootstrapState {
  const resolved = resolveThemePreference({
    storedPreference: input.themePreference,
    systemTheme: input.systemTheme,
  })

  return {
    appName: 'Sona',
    defaultDestination: input.defaultDestination ?? 'dashboard',
    navigation: input.navigation ?? DEFAULT_NAVIGATION_DESTINATIONS,
    themePreference: resolved.themePreference,
    resolvedTheme: resolved.resolvedTheme,
    systemTheme: input.systemTheme,
  }
}