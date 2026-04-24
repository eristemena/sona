import { app, BrowserWindow, nativeTheme } from 'electron'
import path from 'node:path'

import { createSqliteConnection } from '@sona/data/sqlite/connection'
import { SqliteContentLibraryRepository } from "@sona/data/sqlite/content-library-repository";
import { runShellMigrations } from '@sona/data/sqlite/migrations/run-migrations'
import { SqliteSettingsRepository } from '@sona/data/sqlite/settings-repository'

import { ArticleContentService } from "./content/article-content-service.js";
import { AnnotationCacheService } from "./content/annotation-cache-service.js";
import { AudioCacheService } from "./content/audio-cache-service.js";
import { DailyReviewService } from "./content/daily-review-service.js";
import { GeneratedContentService } from "./content/generated-content-service.js";
import { KnownWordOnboardingService } from "./content/known-word-onboarding-service.js";
import { KnownWordService } from "./content/known-word-service.js";
import { ReadingProgressService } from "./content/reading-progress-service.js";
import { ReviewCardService } from "./content/review-card-service.js";
import { ReadingSessionService } from "./content/reading-session-service.js";
import { SrtImportService } from "./content/srt-import-service.js";
import { createMainWindow } from './create-main-window.js'
import { registerContentHandlers } from "./ipc/content-handlers.js";
import { registerReadingHandlers } from "./ipc/reading-handlers.js";
import { registerReviewHandlers } from "./ipc/review-handlers.js";
import { OpenRouterReadingAnnotationProvider } from "./providers/openrouter-reading-annotation-provider.js";
import { OpenRouterContentGenerator } from "./providers/openrouter-content-generator.js";
import { OpenRouterSettingsService } from "./providers/openrouter-settings-service.js";
import { createOpenAiTtsProvider } from "./providers/openai-tts-provider.js";
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
  const srtImportService = new SrtImportService();
  const openAiTtsProvider = createOpenAiTtsProvider(() =>
    settingsRepository.getOpenAiApiKey(),
  );
  const openRouterSettingsService = new OpenRouterSettingsService({
    getApiKey: () => settingsRepository.getOpenRouterApiKey(),
  });
  const openRouterReadingAnnotationProvider =
    new OpenRouterReadingAnnotationProvider({
      fetch,
      getApiKey: () => settingsRepository.getOpenRouterApiKey(),
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      appTitle: "Sona Desktop",
    });
  const generatedContentService = new GeneratedContentService(
    new OpenRouterContentGenerator({
      fetch,
      getApiKey: () => settingsRepository.getOpenRouterApiKey(),
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      appTitle: "Sona Desktop",
    }),
  );
  const audioCacheService = new AudioCacheService({
    repository: contentRepository,
    cacheDirectory: path.join(app.getPath("userData"), "reading-audio-cache"),
    provider: openAiTtsProvider,
    getReadingAudioMode: () => settingsRepository.getReadingAudioMode(),
    getReadingAudioVoice: () => settingsRepository.getReadingAudioVoice(),
  });
  const readingProgressService = new ReadingProgressService(contentRepository);
  const annotationCacheService = new AnnotationCacheService({
    repository: contentRepository,
    provider: openRouterReadingAnnotationProvider,
  });
  const reviewCardService = new ReviewCardService({
    repository: contentRepository,
  });
  const dailyReviewService = new DailyReviewService({
    repository: contentRepository,
    settingsRepository,
  });
  const knownWordService = new KnownWordService({
    repository: contentRepository,
  });
  const knownWordOnboardingService = new KnownWordOnboardingService({
    repository: contentRepository,
    settingsRepository,
  });
  const readingSessionService = new ReadingSessionService({
    repository: contentRepository,
    readingProgressService,
    audioCacheService,
    annotationCacheService,
    reviewCardService,
    knownWordService,
  });
  const themePreference = settingsRepository.getThemePreferenceMode()
  nativeTheme.themeSource = themePreference

  registerShellHandlers({ dailyReviewService, settingsRepository })
  registerSettingsHandlers({
    clearAnnotationCache: () => contentRepository.clearAnnotationCache(),
    settingsRepository,
    windows: () => BrowserWindow.getAllWindows(),
    openRouterSettingsService,
  });
  registerContentHandlers({
    articleContentService,
    contentRepository,
    generatedContentService,
    srtImportService,
  });
  registerReadingHandlers({
    readingSessionService,
    readingProgressService,
    audioCacheService,
  });
  registerReviewHandlers({
    dailyReviewService,
    knownWordService,
    knownWordOnboardingService,
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