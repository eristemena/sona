import {
  createShellBootstrapState,
  DEFAULT_NAVIGATION_DESTINATIONS,
  type ShellBootstrapState,
} from '@sona/domain/contracts/shell-bootstrap'

export const fallbackShellBootstrapState: ShellBootstrapState = createShellBootstrapState({
  navigation: DEFAULT_NAVIGATION_DESTINATIONS,
  themePreference: 'system',
  systemTheme: 'dark',
})

export async function loadShellBootstrapState(): Promise<ShellBootstrapState> {
  if (typeof window === 'undefined' || typeof window.sona === 'undefined') {
    return fallbackShellBootstrapState
  }

  try {
    return await window.sona.shell.getBootstrapState()
  } catch {
    return fallbackShellBootstrapState
  }
}