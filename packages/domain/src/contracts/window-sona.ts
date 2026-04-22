import type { NavigationDestinationId, ShellBootstrapState } from './shell-bootstrap.js'
import type {
  ReadingAudioMode,
  ReadingAudioVoice,
} from "../settings/reading-audio-preference.js";
import type { ResolvedTheme, ThemePreferenceMode } from '../settings/theme-preference.js'
import type {
  CreateArticleFromPasteInput,
  CreateArticleFromUrlInput,
  DeleteContentResult,
  GeneratePracticeSentencesInput,
  ImportSrtInput,
  ListLibraryItemsInput,
  SaveContentSuccess,
  SaveContentResult,
} from "./content-library.js";
import type {
  AddToDeckInput,
  AddToDeckResult,
  ExposureLogInput,
  ExposureLogResult,
  GrammarExplanationInput,
  ReadingAudioAsset,
  ReadingSessionSnapshot,
  SaveReadingProgressInput,
  WordLookupInput,
  WordLookupResult,
} from "./content-reading.js";
import type {
  ClearKnownWordInput,
  ClearKnownWordResult,
  CompleteKnownWordOnboardingInput,
  CompleteKnownWordOnboardingResult,
  KnownWordOnboardingStatus,
  MarkKnownWordInput,
  MarkKnownWordResult,
  ReviewQueueSnapshot,
  SubmitReviewRatingInput,
  SubmitReviewRatingResult,
  UpdateReviewCardDetailsInput,
  UpdateReviewCardDetailsResult,
  WordStudyStatus,
} from "./content-review.js";

export type { NavigationDestinationId, ResolvedTheme, ThemePreferenceMode }

export interface ThemeUpdateResult {
  themePreference: ThemePreferenceMode
  resolvedTheme: ResolvedTheme
}

export interface ApiKeyStatus {
  configured: boolean;
}

export interface ReadingAudioModeUpdateResult {
  mode: ReadingAudioMode;
}

export interface ReadingAudioVoiceUpdateResult {
  voice: ReadingAudioVoice;
}

export interface WindowSona {
  shell: {
    getBootstrapState(): Promise<ShellBootstrapState>;
  };
  settings: {
    getThemePreference(): Promise<ThemePreferenceMode>;
    setThemePreference(mode: ThemePreferenceMode): Promise<ThemeUpdateResult>;
    getOpenAiApiKeyStatus(): Promise<ApiKeyStatus>;
    setOpenAiApiKey(apiKey: string | null): Promise<ApiKeyStatus>;
    getReadingAudioMode(): Promise<ReadingAudioMode>;
    setReadingAudioMode(
      mode: ReadingAudioMode,
    ): Promise<ReadingAudioModeUpdateResult>;
    getReadingAudioVoice(): Promise<ReadingAudioVoice>;
    setReadingAudioVoice(
      voice: ReadingAudioVoice,
    ): Promise<ReadingAudioVoiceUpdateResult>;
    subscribeThemeChanges(
      listener: (update: ThemeUpdateResult) => void,
    ): () => void;
  };
  content: {
    listLibraryItems(
      input?: ListLibraryItemsInput,
    ): Promise<SaveContentSuccess["item"][]>;
    getContentBlocks(
      contentItemId: string,
    ): Promise<SaveContentSuccess["blocks"]>;
    browseSubtitleFile(): Promise<string | null>;
    importSrt(input: ImportSrtInput): Promise<SaveContentResult>;
    createArticleFromPaste(
      input: CreateArticleFromPasteInput,
    ): Promise<SaveContentResult>;
    createArticleFromUrl(
      input: CreateArticleFromUrlInput,
    ): Promise<SaveContentResult>;
    generatePracticeSentences(
      input: GeneratePracticeSentencesInput,
    ): Promise<SaveContentResult>;
    deleteContent(contentItemId: string): Promise<DeleteContentResult>;
  };
  reading: {
    getReadingSession(contentItemId: string): Promise<ReadingSessionSnapshot>;
    ensureBlockAudio(blockId: string): Promise<ReadingAudioAsset>;
    lookupWord(input: WordLookupInput): Promise<WordLookupResult>;
    explainGrammar(input: GrammarExplanationInput): Promise<WordLookupResult>;
    addToDeck(input: AddToDeckInput): Promise<AddToDeckResult>;
    getWordStudyStatus(input: {
      canonicalForm: string;
      surface: string;
    }): Promise<WordStudyStatus>;
    saveReadingProgress(input: SaveReadingProgressInput): Promise<void>;
    flushExposureLog(input: ExposureLogInput): Promise<ExposureLogResult>;
  };
  review: {
    getQueue(limit?: number): Promise<ReviewQueueSnapshot>;
    submitRating(
      input: SubmitReviewRatingInput,
    ): Promise<SubmitReviewRatingResult>;
    updateCardDetails(
      input: UpdateReviewCardDetailsInput,
    ): Promise<UpdateReviewCardDetailsResult>;
    getKnownWordOnboardingStatus(): Promise<KnownWordOnboardingStatus>;
    completeKnownWordOnboarding(
      input: CompleteKnownWordOnboardingInput,
    ): Promise<CompleteKnownWordOnboardingResult>;
    markKnownWord(input: MarkKnownWordInput): Promise<MarkKnownWordResult>;
    clearKnownWord(input: ClearKnownWordInput): Promise<ClearKnownWordResult>;
  };
}

declare global {
  interface Window {
    sona: WindowSona
  }
}