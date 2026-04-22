import { contextBridge, ipcRenderer } from "electron";

import type {
  ApiKeyStatus,
  ReadingAudioModeUpdateResult,
  ReadingAudioVoiceUpdateResult,
  ThemePreferenceMode,
  ThemeUpdateResult,
  WindowSona,
} from "@sona/domain/contracts/window-sona";
import type {
  ReadingAudioMode,
  ReadingAudioVoice,
} from "@sona/domain/settings/reading-audio-preference";
import type {
  CreateArticleFromPasteInput,
  CreateArticleFromUrlInput,
  GeneratePracticeSentencesInput,
  ImportSrtInput,
  ListLibraryItemsInput,
} from "@sona/domain/contracts/content-library";
import { CONTENT_CHANNELS } from "@sona/domain/contracts/content-library";
import type {
  AddToDeckInput,
  ExposureLogInput,
  GrammarExplanationInput,
  SaveReadingProgressInput,
  WordLookupInput,
} from "@sona/domain/contracts/content-reading";
import { READING_CHANNELS } from "@sona/domain/contracts/content-reading";
import type {
  ClearKnownWordInput,
  CompleteKnownWordOnboardingInput,
  MarkKnownWordInput,
  SubmitReviewRatingInput,
  UpdateReviewCardDetailsInput,
} from "@sona/domain/contracts/content-review";
import { REVIEW_CHANNELS } from "@sona/domain/contracts/content-review";

const CHANNELS = {
  getBootstrapState: "sona:shell:get-bootstrap-state",
  getThemePreference: "sona:settings:get-theme-preference",
  setThemePreference: "sona:settings:set-theme-preference",
  getOpenAiApiKeyStatus: "sona:settings:get-openai-api-key-status",
  setOpenAiApiKey: "sona:settings:set-openai-api-key",
  getReadingAudioMode: "sona:settings:get-reading-audio-mode",
  setReadingAudioMode: "sona:settings:set-reading-audio-mode",
  getReadingAudioVoice: "sona:settings:get-reading-audio-voice",
  setReadingAudioVoice: "sona:settings:set-reading-audio-voice",
  themeChanged: "sona:settings:theme-changed",
  ...CONTENT_CHANNELS,
  ...READING_CHANNELS,
  ...REVIEW_CHANNELS,
} as const;

interface PreloadBridge {
  exposeInMainWorld: (name: string, api: WindowSona) => void;
}

interface PreloadIpc {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  on: (
    channel: string,
    listener: (
      event: Electron.IpcRendererEvent,
      update: ThemeUpdateResult,
    ) => void,
  ) => void;
  removeListener: (
    channel: string,
    listener: (
      event: Electron.IpcRendererEvent,
      update: ThemeUpdateResult,
    ) => void,
  ) => void;
}

function isThemePreferenceMode(value: unknown): value is ThemePreferenceMode {
  return value === "system" || value === "dark" || value === "light";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isReadingAudioMode(value: unknown): value is ReadingAudioMode {
  return value === "standard" || value === "learner-slow";
}

function isReadingAudioVoice(value: unknown): value is ReadingAudioVoice {
  return value === "alloy" || value === "coral" || value === "shimmer";
}

export function createWindowSonaApi(
  preloadIpc: PreloadIpc = ipcRenderer,
): WindowSona {
  return {
    shell: {
      getBootstrapState() {
        return preloadIpc.invoke(CHANNELS.getBootstrapState) as Promise<
          ReturnType<WindowSona["shell"]["getBootstrapState"]> extends Promise<
            infer T
          >
            ? T
            : never
        >;
      },
    },
    settings: {
      getThemePreference() {
        return preloadIpc.invoke(
          CHANNELS.getThemePreference,
        ) as Promise<ThemePreferenceMode>;
      },
      setThemePreference(mode: ThemePreferenceMode) {
        if (!isThemePreferenceMode(mode)) {
          return Promise.reject(new Error("Invalid theme preference mode."));
        }

        return preloadIpc.invoke(
          CHANNELS.setThemePreference,
          mode,
        ) as Promise<ThemeUpdateResult>;
      },
      getOpenAiApiKeyStatus() {
        return preloadIpc.invoke(
          CHANNELS.getOpenAiApiKeyStatus,
        ) as Promise<ApiKeyStatus>;
      },
      setOpenAiApiKey(apiKey: string | null) {
        if (!isNullableString(apiKey)) {
          return Promise.reject(new Error("Invalid OpenAI API key value."));
        }

        return preloadIpc.invoke(
          CHANNELS.setOpenAiApiKey,
          apiKey,
        ) as Promise<ApiKeyStatus>;
      },
      getReadingAudioMode() {
        return preloadIpc.invoke(
          CHANNELS.getReadingAudioMode,
        ) as Promise<ReadingAudioMode>;
      },
      setReadingAudioMode(mode: ReadingAudioMode) {
        if (!isReadingAudioMode(mode)) {
          return Promise.reject(new Error("Invalid reading audio mode."));
        }

        return preloadIpc.invoke(
          CHANNELS.setReadingAudioMode,
          mode,
        ) as Promise<ReadingAudioModeUpdateResult>;
      },
      getReadingAudioVoice() {
        return preloadIpc.invoke(
          CHANNELS.getReadingAudioVoice,
        ) as Promise<ReadingAudioVoice>;
      },
      setReadingAudioVoice(voice: ReadingAudioVoice) {
        if (!isReadingAudioVoice(voice)) {
          return Promise.reject(new Error("Invalid reading audio voice."));
        }

        return preloadIpc.invoke(
          CHANNELS.setReadingAudioVoice,
          voice,
        ) as Promise<ReadingAudioVoiceUpdateResult>;
      },
      subscribeThemeChanges(listener: (update: ThemeUpdateResult) => void) {
        const handler = (
          _event: Electron.IpcRendererEvent,
          update: ThemeUpdateResult,
        ) => {
          listener(update);
        };

        preloadIpc.on(CHANNELS.themeChanged, handler);

        return () => {
          preloadIpc.removeListener(CHANNELS.themeChanged, handler);
        };
      },
    },
    content: {
      listLibraryItems(input?: ListLibraryItemsInput) {
        return preloadIpc.invoke(
          CHANNELS.listLibraryItems,
          input,
        ) as ReturnType<WindowSona["content"]["listLibraryItems"]>;
      },
      getContentBlocks(contentItemId: string) {
        return preloadIpc.invoke(
          CHANNELS.getContentBlocks,
          contentItemId,
        ) as ReturnType<WindowSona["content"]["getContentBlocks"]>;
      },
      browseSubtitleFile() {
        return preloadIpc.invoke(CHANNELS.browseSubtitleFile) as ReturnType<
          WindowSona["content"]["browseSubtitleFile"]
        >;
      },
      importSrt(input: ImportSrtInput) {
        return preloadIpc.invoke(CHANNELS.importSrt, input) as ReturnType<
          WindowSona["content"]["importSrt"]
        >;
      },
      createArticleFromPaste(input: CreateArticleFromPasteInput) {
        return preloadIpc.invoke(
          CHANNELS.createArticleFromPaste,
          input,
        ) as ReturnType<WindowSona["content"]["createArticleFromPaste"]>;
      },
      createArticleFromUrl(input: CreateArticleFromUrlInput) {
        return preloadIpc.invoke(
          CHANNELS.createArticleFromUrl,
          input,
        ) as ReturnType<WindowSona["content"]["createArticleFromUrl"]>;
      },
      generatePracticeSentences(input: GeneratePracticeSentencesInput) {
        return preloadIpc.invoke(
          CHANNELS.generatePracticeSentences,
          input,
        ) as ReturnType<WindowSona["content"]["generatePracticeSentences"]>;
      },
      deleteContent(contentItemId: string) {
        return preloadIpc.invoke(
          CHANNELS.deleteContent,
          contentItemId,
        ) as ReturnType<WindowSona["content"]["deleteContent"]>;
      },
    },
    reading: {
      getReadingSession(contentItemId: string) {
        return preloadIpc.invoke(
          CHANNELS.getReadingSession,
          contentItemId,
        ) as ReturnType<WindowSona["reading"]["getReadingSession"]>;
      },
      ensureBlockAudio(blockId: string) {
        return preloadIpc.invoke(
          CHANNELS.ensureBlockAudio,
          blockId,
        ) as ReturnType<WindowSona["reading"]["ensureBlockAudio"]>;
      },
      lookupWord(input: WordLookupInput) {
        return preloadIpc.invoke(CHANNELS.lookupWord, input) as ReturnType<
          WindowSona["reading"]["lookupWord"]
        >;
      },
      explainGrammar(input: GrammarExplanationInput) {
        return preloadIpc.invoke(CHANNELS.explainGrammar, input) as ReturnType<
          WindowSona["reading"]["explainGrammar"]
        >;
      },
      addToDeck(input: AddToDeckInput) {
        return preloadIpc.invoke(CHANNELS.addToDeck, input) as ReturnType<
          WindowSona["reading"]["addToDeck"]
        >;
      },
      getWordStudyStatus(input: { canonicalForm: string; surface: string }) {
        return preloadIpc.invoke(
          CHANNELS.getWordStudyStatus,
          input,
        ) as ReturnType<WindowSona["reading"]["getWordStudyStatus"]>;
      },
      saveReadingProgress(input: SaveReadingProgressInput) {
        return preloadIpc.invoke(
          CHANNELS.saveReadingProgress,
          input,
        ) as ReturnType<WindowSona["reading"]["saveReadingProgress"]>;
      },
      flushExposureLog(input: ExposureLogInput) {
        return preloadIpc.invoke(
          CHANNELS.flushExposureLog,
          input,
        ) as ReturnType<WindowSona["reading"]["flushExposureLog"]>;
      },
    },
    review: {
      getQueue(limit?: number) {
        return preloadIpc.invoke(CHANNELS.getQueue, limit) as ReturnType<
          WindowSona["review"]["getQueue"]
        >;
      },
      submitRating(input: SubmitReviewRatingInput) {
        return preloadIpc.invoke(CHANNELS.submitRating, input) as ReturnType<
          WindowSona["review"]["submitRating"]
        >;
      },
      updateCardDetails(input: UpdateReviewCardDetailsInput) {
        return preloadIpc.invoke(
          CHANNELS.updateCardDetails,
          input,
        ) as ReturnType<WindowSona["review"]["updateCardDetails"]>;
      },
      getKnownWordOnboardingStatus() {
        return preloadIpc.invoke(
          CHANNELS.getKnownWordOnboardingStatus,
        ) as ReturnType<WindowSona["review"]["getKnownWordOnboardingStatus"]>;
      },
      completeKnownWordOnboarding(input: CompleteKnownWordOnboardingInput) {
        return preloadIpc.invoke(
          CHANNELS.completeKnownWordOnboarding,
          input,
        ) as ReturnType<WindowSona["review"]["completeKnownWordOnboarding"]>;
      },
      markKnownWord(input: MarkKnownWordInput) {
        return preloadIpc.invoke(CHANNELS.markKnownWord, input) as ReturnType<
          WindowSona["review"]["markKnownWord"]
        >;
      },
      clearKnownWord(input: ClearKnownWordInput) {
        return preloadIpc.invoke(CHANNELS.clearKnownWord, input) as ReturnType<
          WindowSona["review"]["clearKnownWord"]
        >;
      },
    },
  };
}

export function exposeWindowSona(
  bridge: PreloadBridge = contextBridge,
  preloadIpc: PreloadIpc = ipcRenderer,
) {
  const api = createWindowSonaApi(preloadIpc);
  bridge.exposeInMainWorld("sona", api);
  return api;
}

if (contextBridge && typeof contextBridge.exposeInMainWorld === "function") {
  exposeWindowSona();
}
