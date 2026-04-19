import { BrowserWindow, nativeTheme } from 'electron'

import type { SqliteSettingsRepository } from '@sona/data/sqlite/settings-repository'

import { emitThemeChanged } from '../ipc/settings-handlers.js'

interface RegisterNativeThemeEventsOptions {
  settingsRepository: SqliteSettingsRepository
  windows: () => BrowserWindow[]
}

interface NativeThemeRuntime {
  nativeTheme: {
    on: (event: 'updated', listener: () => void) => void
    shouldUseDarkColors: boolean
    themeSource: 'system' | 'dark' | 'light'
  }
}

export function registerNativeThemeEvents(
  options: RegisterNativeThemeEventsOptions,
  runtime: NativeThemeRuntime = { nativeTheme },
) {
  runtime.nativeTheme.on('updated', () => {
    const themePreference = options.settingsRepository.getThemePreferenceMode()
    emitThemeChanged(options, themePreference, runtime.nativeTheme)
  })
}