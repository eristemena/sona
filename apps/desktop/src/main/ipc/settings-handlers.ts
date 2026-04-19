import { BrowserWindow, ipcMain, nativeTheme } from 'electron'

import { resolveThemePreference, type ThemePreferenceMode } from '@sona/domain/settings/theme-preference'

import type { SqliteSettingsRepository } from '@sona/data/sqlite/settings-repository'

const CHANNELS = {
  getThemePreference: 'sona:settings:get-theme-preference',
  setThemePreference: 'sona:settings:set-theme-preference',
  themeChanged: 'sona:settings:theme-changed',
} as const

interface SettingsElectronRuntime {
  ipcMain: {
    handle: (channel: string, listener: (...args: any[]) => unknown) => void
  }
  nativeTheme: {
    shouldUseDarkColors: boolean
    themeSource: ThemePreferenceMode
  }
}

interface RegisterSettingsHandlersOptions {
  settingsRepository: SqliteSettingsRepository
  windows: () => BrowserWindow[]
}

function emitThemeChanged(
  options: RegisterSettingsHandlersOptions,
  mode: ThemePreferenceMode,
  currentNativeTheme: SettingsElectronRuntime['nativeTheme'],
) {
  const update = resolveThemePreference({
    storedPreference: mode,
    systemTheme: currentNativeTheme.shouldUseDarkColors ? 'dark' : 'light',
  })

  for (const window of options.windows()) {
    window.webContents.send(CHANNELS.themeChanged, {
      themePreference: update.themePreference,
      resolvedTheme: update.resolvedTheme,
    })
  }

  return {
    themePreference: update.themePreference,
    resolvedTheme: update.resolvedTheme,
  }
}

export function registerSettingsHandlers(options: RegisterSettingsHandlersOptions) {
  return registerSettingsHandlersWithRuntime(options, { ipcMain, nativeTheme })
}

export function registerSettingsHandlersWithRuntime(
  options: RegisterSettingsHandlersOptions,
  runtime: SettingsElectronRuntime,
) {
  runtime.ipcMain.handle(CHANNELS.getThemePreference, () => options.settingsRepository.getThemePreferenceMode())

  runtime.ipcMain.handle(CHANNELS.setThemePreference, (_event, mode: ThemePreferenceMode) => {
    options.settingsRepository.setThemePreferenceMode(mode)
    runtime.nativeTheme.themeSource = mode
    return emitThemeChanged(options, mode, runtime.nativeTheme)
  })
}

export { CHANNELS as SETTINGS_CHANNELS, emitThemeChanged }