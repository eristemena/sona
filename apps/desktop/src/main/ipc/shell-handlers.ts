import { ipcMain, nativeTheme } from 'electron'

import { createShellBootstrapState, DEFAULT_NAVIGATION_DESTINATIONS } from '@sona/domain/contracts/shell-bootstrap'

import type { SqliteSettingsRepository } from '@sona/data/sqlite/settings-repository'

const GET_BOOTSTRAP_STATE_CHANNEL = 'sona:shell:get-bootstrap-state'

interface ShellElectronRuntime {
  ipcMain: {
    handle: (channel: string, listener: (...args: unknown[]) => unknown) => void
  }
  nativeTheme: {
    shouldUseDarkColors: boolean
  }
}

interface RegisterShellHandlersOptions {
  settingsRepository: SqliteSettingsRepository
}

export function registerShellHandlers(
  { settingsRepository }: RegisterShellHandlersOptions,
  runtime: ShellElectronRuntime = { ipcMain, nativeTheme },
) {
  runtime.ipcMain.handle(GET_BOOTSTRAP_STATE_CHANNEL, () => {
    const themePreference = settingsRepository.getThemePreferenceMode()

    return createShellBootstrapState({
      navigation: DEFAULT_NAVIGATION_DESTINATIONS,
      themePreference,
      systemTheme: runtime.nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
    })
  })
}