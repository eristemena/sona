import { BrowserWindow, ipcMain, nativeTheme } from "electron";
import type {
  SaveStudyPreferencesInput,
  StudyPreferencesSnapshot,
} from "@sona/domain/contracts/window-sona";
import { STUDY_TTS_VOICE_OPTIONS } from "@sona/domain/settings/study-preferences";
import {
  isStudyKoreanLevel,
  type StudyKoreanLevel,
} from "@sona/domain/settings/study-preferences";

import {
  isReadingAudioMode,
  type ReadingAudioMode,
  isReadingAudioVoice,
  type ReadingAudioVoice,
} from "@sona/domain/settings/reading-audio-preference";
import {
  resolveThemePreference,
  type ThemePreferenceMode,
} from "@sona/domain/settings/theme-preference";

import type { SqliteSettingsRepository } from "@sona/data/sqlite/settings-repository";
import { OpenAiSettingsService } from "../providers/openai-settings-service.js";
import { OpenRouterSettingsService } from "../providers/openrouter-settings-service.js";

const CHANNELS = {
  getThemePreference: "sona:settings:get-theme-preference",
  setThemePreference: "sona:settings:set-theme-preference",
  getOpenAiApiKeyStatus: "sona:settings:get-openai-api-key-status",
  setOpenAiApiKey: "sona:settings:set-openai-api-key",
  validateOpenAiKey: "sona:settings:validate-openai-key",
  getReadingAudioMode: "sona:settings:get-reading-audio-mode",
  setReadingAudioMode: "sona:settings:set-reading-audio-mode",
  getReadingAudioVoice: "sona:settings:get-reading-audio-voice",
  setReadingAudioVoice: "sona:settings:set-reading-audio-voice",
  getStudyPreferences: "sona:settings:get-study-preferences",
  saveStudyPreferences: "sona:settings:save-study-preferences",
  validateOpenRouterKey: "sona:settings:validate-openrouter-key",
  previewTtsVoice: "sona:settings:preview-tts-voice",
  clearAnnotationCache: "sona:settings:clear-annotation-cache",
  themeChanged: "sona:settings:theme-changed",
} as const;

interface SettingsElectronRuntime {
  ipcMain: {
    handle: (channel: string, listener: (...args: any[]) => unknown) => void;
  };
  nativeTheme: {
    shouldUseDarkColors: boolean;
    themeSource: ThemePreferenceMode;
  };
}

interface RegisterSettingsHandlersOptions {
  settingsRepository: SqliteSettingsRepository;
  windows: () => BrowserWindow[];
  clearAnnotationCache?: () => number;
  openAiSettingsService?: OpenAiSettingsService;
  openRouterSettingsService?: OpenRouterSettingsService;
}

function emitThemeChanged(
  options: RegisterSettingsHandlersOptions,
  mode: ThemePreferenceMode,
  currentNativeTheme: SettingsElectronRuntime["nativeTheme"],
) {
  const update = resolveThemePreference({
    storedPreference: mode,
    systemTheme: currentNativeTheme.shouldUseDarkColors ? "dark" : "light",
  });

  for (const window of options.windows()) {
    window.webContents.send(CHANNELS.themeChanged, {
      themePreference: update.themePreference,
      resolvedTheme: update.resolvedTheme,
    });
  }

  return {
    themePreference: update.themePreference,
    resolvedTheme: update.resolvedTheme,
  };
}

export function registerSettingsHandlers(
  options: RegisterSettingsHandlersOptions,
) {
  return registerSettingsHandlersWithRuntime(options, { ipcMain, nativeTheme });
}

export function registerSettingsHandlersWithRuntime(
  options: RegisterSettingsHandlersOptions,
  runtime: SettingsElectronRuntime,
) {
  const openRouterSettingsService =
    options.openRouterSettingsService ??
    new OpenRouterSettingsService({
      getApiKey: () => options.settingsRepository.getOpenRouterApiKey(),
    });
  const openAiSettingsService =
    options.openAiSettingsService ??
    new OpenAiSettingsService({
      fetch,
      getApiKey: () => options.settingsRepository.getOpenAiApiKey(),
      modelsEndpoint: "https://api.openai.com/v1/models",
      speechEndpoint: "https://api.openai.com/v1/audio/speech",
    });

  runtime.ipcMain.handle(CHANNELS.getThemePreference, () =>
    options.settingsRepository.getThemePreferenceMode(),
  );
  runtime.ipcMain.handle(CHANNELS.getOpenAiApiKeyStatus, () => ({
    configured: options.settingsRepository.hasOpenAiApiKey(),
  }));
  runtime.ipcMain.handle(CHANNELS.validateOpenAiKey, () =>
    openAiSettingsService.validateStoredKey(),
  );
  runtime.ipcMain.handle(CHANNELS.getReadingAudioMode, () =>
    options.settingsRepository.getReadingAudioMode(),
  );
  runtime.ipcMain.handle(CHANNELS.getReadingAudioVoice, () =>
    options.settingsRepository.getReadingAudioVoice(),
  );
  runtime.ipcMain.handle(CHANNELS.getStudyPreferences, () =>
    createStudyPreferencesSnapshot(
      options.settingsRepository,
      openRouterSettingsService,
      openAiSettingsService,
    ),
  );
  runtime.ipcMain.handle(CHANNELS.validateOpenRouterKey, () =>
    openRouterSettingsService.validateStoredKey(),
  );
  runtime.ipcMain.handle(
    CHANNELS.previewTtsVoice,
    (_event, input: { voice: string }) => {
      if (
        !input ||
        typeof input !== "object" ||
        typeof input.voice !== "string"
      ) {
        throw new Error("Invalid TTS voice preview input.");
      }

      if (!isReadingAudioVoice(input.voice)) {
        throw new Error("Invalid TTS voice preview input.");
      }

      return openAiSettingsService.previewVoice(input.voice);
    },
  );

  runtime.ipcMain.handle(
    CHANNELS.setThemePreference,
    (_event, mode: ThemePreferenceMode) => {
      options.settingsRepository.setThemePreferenceMode(mode);
      runtime.nativeTheme.themeSource = mode;
      return emitThemeChanged(options, mode, runtime.nativeTheme);
    },
  );

  runtime.ipcMain.handle(
    CHANNELS.setOpenAiApiKey,
    (_event, apiKey: string | null) => {
      options.settingsRepository.setOpenAiApiKey(apiKey);
      openAiSettingsService.markConfigurationChanged();
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
  runtime.ipcMain.handle(
    CHANNELS.saveStudyPreferences,
    (_event, input: SaveStudyPreferencesInput) => {
      const normalizedInput = normalizeStudyPreferencesInput(input);

      if ("openRouterApiKey" in normalizedInput) {
        options.settingsRepository.setOpenRouterApiKey(
          normalizedInput.openRouterApiKey,
        );
      }
      if ("openAiApiKey" in normalizedInput) {
        options.settingsRepository.setOpenAiApiKey(
          normalizedInput.openAiApiKey,
        );
      }
      options.settingsRepository.setReadingAudioVoice(
        normalizedInput.selectedVoice,
      );
      options.settingsRepository.setDailyStudyGoal(normalizedInput.dailyGoal);
      options.settingsRepository.setStudyKoreanLevel(
        normalizedInput.koreanLevel,
      );
      options.settingsRepository.setMaxLlmCallsPerSession(
        normalizedInput.maxLlmCallsPerSession,
      );
      options.settingsRepository.setAnnotationCacheDays(
        normalizedInput.annotationCacheDays,
      );
      openAiSettingsService.markConfigurationChanged();
      openRouterSettingsService.markConfigurationChanged();

      return {
        openAiKeyStatus: openAiSettingsService.getProviderKeyStatus(),
        openRouterKeyStatus: openRouterSettingsService.getProviderKeyStatus(),
        selectedVoice: options.settingsRepository.getReadingAudioVoice(),
        dailyGoal: options.settingsRepository.getDailyStudyGoal(),
        koreanLevel: options.settingsRepository.getStudyKoreanLevel(),
        maxLlmCallsPerSession:
          options.settingsRepository.getMaxLlmCallsPerSession(),
        annotationCacheDays:
          options.settingsRepository.getAnnotationCacheDays(),
      };
    },
  );
  runtime.ipcMain.handle(CHANNELS.clearAnnotationCache, () => ({
    removedEntries: options.clearAnnotationCache
      ? options.clearAnnotationCache()
      : 0,
  }));
}

export { CHANNELS as SETTINGS_CHANNELS, emitThemeChanged };

function createStudyPreferencesSnapshot(
  settingsRepository: SqliteSettingsRepository,
  openRouterSettingsService: OpenRouterSettingsService,
  openAiSettingsService: OpenAiSettingsService,
): StudyPreferencesSnapshot {
  return {
    openAiKeyStatus: openAiSettingsService.getProviderKeyStatus(),
    openRouterKeyStatus: openRouterSettingsService.getProviderKeyStatus(),
    availableVoices: STUDY_TTS_VOICE_OPTIONS,
    selectedVoice: settingsRepository.getReadingAudioVoice(),
    dailyGoal: settingsRepository.getDailyStudyGoal(),
    koreanLevel: settingsRepository.getStudyKoreanLevel(),
    maxLlmCallsPerSession: settingsRepository.getMaxLlmCallsPerSession(),
    annotationCacheDays: settingsRepository.getAnnotationCacheDays(),
  };
}

function normalizeStudyPreferencesInput(input: SaveStudyPreferencesInput) {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid study preferences input.");
  }

  if (!isStudyKoreanLevel(input.koreanLevel)) {
    throw new Error("Invalid study preferences Korean level.");
  }

  if (!isReadingAudioVoice(input.selectedVoice)) {
    throw new Error("Invalid study preferences voice.");
  }

  if (
    typeof input.dailyGoal !== "number" ||
    !Number.isFinite(input.dailyGoal)
  ) {
    throw new Error("Invalid daily study goal.");
  }

  return {
    selectedVoice: input.selectedVoice,
    dailyGoal: Math.max(1, Math.min(500, Math.trunc(input.dailyGoal))),
    koreanLevel: input.koreanLevel as StudyKoreanLevel,
    maxLlmCallsPerSession: Math.max(
      1,
      Math.min(50, Math.trunc(input.maxLlmCallsPerSession)),
    ),
    annotationCacheDays: Math.max(
      1,
      Math.min(90, Math.trunc(input.annotationCacheDays)),
    ),
    ...(Object.prototype.hasOwnProperty.call(input, "openAiApiKey")
      ? {
          openAiApiKey:
            typeof input.openAiApiKey === "string" &&
            input.openAiApiKey.trim().length > 0
              ? input.openAiApiKey.trim()
              : null,
        }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(input, "openRouterApiKey")
      ? {
          openRouterApiKey:
            typeof input.openRouterApiKey === "string" &&
            input.openRouterApiKey.trim().length > 0
              ? input.openRouterApiKey.trim()
              : null,
        }
      : {}),
  };
}
