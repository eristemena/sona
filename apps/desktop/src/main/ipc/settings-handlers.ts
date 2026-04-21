import { BrowserWindow, ipcMain, nativeTheme } from 'electron'

import {
  isReadingAudioMode,
  type ReadingAudioMode,
  isReadingAudioVoice,
  type ReadingAudioVoice,
} from "@sona/domain/settings/reading-audio-preference";
import { resolveThemePreference, type ThemePreferenceMode } from '@sona/domain/settings/theme-preference'

import type { SqliteSettingsRepository } from '@sona/data/sqlite/settings-repository'

const CHANNELS = {
  getThemePreference: "sona:settings:get-theme-preference",
  setThemePreference: "sona:settings:set-theme-preference",
  getOpenAiApiKeyStatus: "sona:settings:get-openai-api-key-status",
  setOpenAiApiKey: "sona:settings:set-openai-api-key",
  getReadingAudioMode: "sona:settings:get-reading-audio-mode",
  setReadingAudioMode: "sona:settings:set-reading-audio-mode",
  getReadingAudioVoice: "sona:settings:get-reading-audio-voice",
  setReadingAudioVoice: "sona:settings:set-reading-audio-voice",
  themeChanged: "sona:settings:theme-changed",
} as const;

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
  runtime.ipcMain.handle(CHANNELS.getOpenAiApiKeyStatus, () => ({
    configured: options.settingsRepository.hasOpenAiApiKey(),
  }));
  runtime.ipcMain.handle(CHANNELS.getReadingAudioMode, () =>
    options.settingsRepository.getReadingAudioMode(),
  );
  runtime.ipcMain.handle(CHANNELS.getReadingAudioVoice, () =>
    options.settingsRepository.getReadingAudioVoice(),
  );

  runtime.ipcMain.handle(CHANNELS.setThemePreference, (_event, mode: ThemePreferenceMode) => {
    options.settingsRepository.setThemePreferenceMode(mode)
    runtime.nativeTheme.themeSource = mode
    return emitThemeChanged(options, mode, runtime.nativeTheme)
  })

  runtime.ipcMain.handle(
    CHANNELS.setOpenAiApiKey,
    (_event, apiKey: string | null) => {
      options.settingsRepository.setOpenAiApiKey(apiKey);
      return { configured: options.settingsRepository.hasOpenAiApiKey() };
    },
  );
  runtime.ipcMain.handle(
    CHANNELS.setReadingAudioMode,
    (_event, mode: ReadingAudioMode) => {
      if (!isReadingAudioMode(mode)) {
        throw new Error("Invalid reading audio mode.");
      }

      options.settingsRepository.setReadingAudioMode(mode);
      return { mode: options.settingsRepository.getReadingAudioMode() };
    },
  );
  runtime.ipcMain.handle(
    CHANNELS.setReadingAudioVoice,
    (_event, voice: ReadingAudioVoice) => {
      if (!isReadingAudioVoice(voice)) {
        throw new Error("Invalid reading audio voice.");
      }

      options.settingsRepository.setReadingAudioVoice(voice);
      return { voice: options.settingsRepository.getReadingAudioVoice() };
    },
  );
}

export { CHANNELS as SETTINGS_CHANNELS, emitThemeChanged }