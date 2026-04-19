import { app, BrowserWindow, nativeTheme } from 'electron'
import path from 'node:path'

import { createSqliteConnection } from '@sona/data/sqlite/connection'
import { runShellMigrations } from '@sona/data/sqlite/migrations/run-migrations'
import { SqliteSettingsRepository } from '@sona/data/sqlite/settings-repository'

import { createMainWindow } from './create-main-window.js'
import { registerSettingsHandlers } from './ipc/settings-handlers.js'
import { registerShellHandlers } from './ipc/shell-handlers.js'
import { registerNativeThemeEvents } from './theme/native-theme-events.js'

let mainWindow: BrowserWindow | null = null

async function bootstrapDesktopShell() {
  const databasePath = path.join(app.getPath('userData'), 'sona.db')
  const database = createSqliteConnection({ databasePath })

  runShellMigrations(database)

  const settingsRepository = new SqliteSettingsRepository(database)
  const themePreference = settingsRepository.getThemePreferenceMode()
  nativeTheme.themeSource = themePreference

  registerShellHandlers({ settingsRepository })
  registerSettingsHandlers({ settingsRepository, windows: () => BrowserWindow.getAllWindows() })
  registerNativeThemeEvents({ settingsRepository, windows: () => BrowserWindow.getAllWindows() })

  mainWindow = createMainWindow()
}

app.whenReady().then(async () => {
  await bootstrapDesktopShell()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})