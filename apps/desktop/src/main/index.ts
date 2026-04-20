import { app, BrowserWindow, nativeTheme } from 'electron'
import path from 'node:path'

import { createSqliteConnection } from '@sona/data/sqlite/connection'
import { SqliteContentLibraryRepository } from "@sona/data/sqlite/content-library-repository";
import { runShellMigrations } from '@sona/data/sqlite/migrations/run-migrations'
import { SqliteSettingsRepository } from '@sona/data/sqlite/settings-repository'

import { ArticleContentService } from "./content/article-content-service.js";
import { GeneratedContentService } from "./content/generated-content-service.js";
import { SrtImportService } from "./content/srt-import-service.js";
import { createMainWindow } from './create-main-window.js'
import { registerContentHandlers } from "./ipc/content-handlers.js";
import { registerSettingsHandlers } from './ipc/settings-handlers.js'
import { registerShellHandlers } from './ipc/shell-handlers.js'
import { registerNativeThemeEvents } from './theme/native-theme-events.js'

let mainWindow: BrowserWindow | null = null

async function bootstrapDesktopShell() {
  const databasePath = path.join(app.getPath('userData'), 'sona.db')
  const database = createSqliteConnection({ databasePath })

  runShellMigrations(database)

  const settingsRepository = new SqliteSettingsRepository(database)
  const contentRepository = new SqliteContentLibraryRepository(database);
  const articleContentService = new ArticleContentService();
  const generatedContentService = new GeneratedContentService();
  const srtImportService = new SrtImportService();
  const themePreference = settingsRepository.getThemePreferenceMode()
  nativeTheme.themeSource = themePreference

  registerShellHandlers({ settingsRepository })
  registerSettingsHandlers({ settingsRepository, windows: () => BrowserWindow.getAllWindows() })
  registerContentHandlers({
    articleContentService,
    contentRepository,
    generatedContentService,
    srtImportService,
  });
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