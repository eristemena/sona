import { ipcMain } from 'electron'

import { READING_CHANNELS } from '@sona/domain/contracts/content-reading'

import { AudioCacheService } from '../content/audio-cache-service.js'
import { ReadingProgressService } from '../content/reading-progress-service.js'
import { ReadingSessionService } from '../content/reading-session-service.js'

interface ReadingElectronRuntime {
  ipcMain: {
    handle: (channel: string, listener: (...args: any[]) => unknown) => void
  }
}

interface RegisterReadingHandlersOptions {
  readingSessionService: ReadingSessionService
  readingProgressService: ReadingProgressService
  audioCacheService: AudioCacheService
}

export function registerReadingHandlers(
  options: RegisterReadingHandlersOptions,
  runtime: ReadingElectronRuntime = { ipcMain },
) {
  runtime.ipcMain.handle(READING_CHANNELS.getReadingSession, (_event, contentItemId: string) => {
    return options.readingSessionService.getReadingSession(contentItemId)
  })

  runtime.ipcMain.handle(READING_CHANNELS.ensureBlockAudio, (_event, blockId: string) => {
    return options.readingSessionService.ensureBlockAudio(blockId)
  })

  runtime.ipcMain.handle(READING_CHANNELS.lookupWord, (_event, input) => {
    return options.readingSessionService.lookupWord(input as never)
  })

  runtime.ipcMain.handle(READING_CHANNELS.explainGrammar, (_event, input) => {
    return options.readingSessionService.explainGrammar(input as never)
  })

  runtime.ipcMain.handle(READING_CHANNELS.addToDeck, (_event, input) => {
    return options.readingSessionService.addToDeck(input as never)
  })

  runtime.ipcMain.handle(READING_CHANNELS.saveReadingProgress, (_event, input) => {
    options.readingSessionService.saveReadingProgress(input as never)
  })

  runtime.ipcMain.handle(READING_CHANNELS.flushExposureLog, (_event, input) => {
    return options.readingSessionService.flushExposureLog(input as never)
  })
}