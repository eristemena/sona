import { BrowserWindow, dialog, ipcMain } from 'electron'

import { CONTENT_CHANNELS, type SaveContentFailure } from '@sona/domain/contracts/content-library'

import type { SqliteContentLibraryRepository } from '@sona/data/sqlite/content-library-repository'

import { ArticleContentService } from '../content/article-content-service.js'
import {
  GeneratedContentProviderUnavailableError,
  GeneratedContentService,
  GeneratedContentValidationRejectedError,
} from '../content/generated-content-service.js'
import { SrtImportService } from '../content/srt-import-service.js'

interface ContentElectronRuntime {
  ipcMain: {
    handle: (channel: string, listener: (...args: any[]) => unknown) => void
  }
  dialog: {
    showOpenDialog: (
      browserWindow: BrowserWindow | null,
      options: {
        title: string
        buttonLabel: string
        filters: Array<{ name: string; extensions: string[] }>
        properties: Array<'openFile'>
      },
    ) => Promise<{ canceled: boolean; filePaths: string[] }>
  }
  browserWindow: {
    getFocusedWindow: () => BrowserWindow | null
  }
}

interface RegisterContentHandlersOptions {
  contentRepository: SqliteContentLibraryRepository
  articleContentService?: ArticleContentService
  generatedContentService?: GeneratedContentService
  srtImportService?: SrtImportService
}

function notImplementedFailure(message: string): SaveContentFailure {
  return {
    ok: false,
    reason: 'invalid-input',
    message,
  }
}

export function registerContentHandlers(
  options: RegisterContentHandlersOptions,
  runtime: ContentElectronRuntime = {
    ipcMain,
    dialog: {
      showOpenDialog(browserWindow, options) {
        if (browserWindow) {
          return dialog.showOpenDialog(browserWindow, options)
        }

        return dialog.showOpenDialog(options)
      },
    },
    browserWindow: BrowserWindow,
  },
) {
  const articleContentService = options.articleContentService ?? new ArticleContentService()
  const generatedContentService = options.generatedContentService ?? new GeneratedContentService()
  const srtImportService = options.srtImportService ?? new SrtImportService()

  runtime.ipcMain.handle(CONTENT_CHANNELS.listLibraryItems, () => {
    return options.contentRepository.listLibraryItems();
  });

  runtime.ipcMain.handle(CONTENT_CHANNELS.getContentBlocks, (_event, contentItemId: string) => {
    return options.contentRepository.getContentBlocks(contentItemId)
  })

  runtime.ipcMain.handle(CONTENT_CHANNELS.browseSubtitleFile, async () => {
    const result = await runtime.dialog.showOpenDialog(runtime.browserWindow.getFocusedWindow(), {
      title: 'Choose Korean subtitle file',
      buttonLabel: 'Select subtitle',
      filters: [
        { name: 'Subtitle files', extensions: ['srt'] },
        { name: 'All files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })

    return result.canceled ? null : (result.filePaths[0] ?? null)
  })

  runtime.ipcMain.handle(CONTENT_CHANNELS.importSrt, async (_event, input) => {
    try {
      const draft = await srtImportService.importFromFile(input)
      return options.contentRepository.saveContent(draft)
    } catch (error) {
      return notImplementedFailure(error instanceof Error ? error.message : 'Subtitle import failed.')
    }
  })

  runtime.ipcMain.handle(CONTENT_CHANNELS.createArticleFromPaste, (_event, input) => {
    try {
      const draft = articleContentService.createFromPaste(input)
      return options.contentRepository.saveContent(draft)
    } catch (error) {
      return notImplementedFailure(error instanceof Error ? error.message : 'Article paste failed.')
    }
  })

  runtime.ipcMain.handle(CONTENT_CHANNELS.createArticleFromUrl, async (_event, input) => {
    try {
      const draft = await articleContentService.createFromUrl(input)
      return options.contentRepository.saveContent(draft)
    } catch (error) {
      return {
        ok: false,
        reason: 'scrape-failed',
        message: error instanceof Error ? error.message : 'Article scrape failed.',
      }
    }
  })

  runtime.ipcMain.handle(CONTENT_CHANNELS.generatePracticeSentences, async (_event, input) => {
    try {
      const draft = await generatedContentService.createFromTopic(input)
      return options.contentRepository.saveContent(draft)
    } catch (error) {
      if (error instanceof GeneratedContentProviderUnavailableError) {
        return {
          ok: false,
          reason: 'provider-unavailable',
          message: error.message,
        }
      }

      if (error instanceof GeneratedContentValidationRejectedError) {
        return {
          ok: false,
          reason: 'validation-rejected',
          message: error.message,
        }
      }

      return notImplementedFailure(error instanceof Error ? error.message : 'Generated content could not be created.')
    }
  })

  runtime.ipcMain.handle(CONTENT_CHANNELS.deleteContent, (_event, contentItemId: string) => {
    return options.contentRepository.deleteContent(contentItemId)
  })
}