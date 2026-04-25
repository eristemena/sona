import type { NavigationDestinationId, ShellBootstrapState } from './shell-bootstrap.js'
import type {
  ReadingAudioMode,
  ReadingAudioVoice,
} from "../settings/reading-audio-preference.js";
import type { HomeDashboardSnapshot } from '../content/home-dashboard.js'
import type { ResolvedTheme, ThemePreferenceMode } from '../settings/theme-preference.js'
import type {
  CreateArticleFromPasteInput,
  CreateArticleFromUrlInput,
  DeleteContentResult,
  GeneratePracticeSentencesInput,
  ImportSrtInput,
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
  EnsureReviewSentenceAudioInput,
  KnownWordOnboardingStatus,
  MarkKnownWordInput,
  MarkKnownWordResult,
  ReviewQueueSnapshot,
  SubmitReviewRatingInput,
  SubmitReviewRatingResult,
  ReviewSentenceAudioAsset,
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

export interface ProviderKeyStatus {
  configured: boolean
  lastValidatedAt: number | null
  lastValidationState: 'idle' | 'success' | 'failed'
}

export interface ValidateOpenRouterKeyResult {
  ok: boolean
  checkedAt: number
  message: string
}

export interface ValidateOpenAiKeyResult {
  ok: boolean;
  checkedAt: number;
  message: string;
}

export interface StudyPreferencesVoiceOption {
  id: string
  label: string
  description: string
}

export interface StudyPreferencesSnapshot {
  openAiKeyStatus: ProviderKeyStatus;
  openRouterKeyStatus: ProviderKeyStatus;
  availableVoices: StudyPreferencesVoiceOption[];
  selectedVoice: string;
  dailyGoal: number;
  koreanLevel: string;
  maxLlmCallsPerSession: number;
  annotationCacheDays: number;
}

export interface SaveStudyPreferencesInput {
  openAiApiKey?: string | null;
  openRouterApiKey?: string | null;
  selectedVoice: string;
  dailyGoal: number;
  koreanLevel: string;
  maxLlmCallsPerSession: number;
  annotationCacheDays: number;
}

export interface SaveStudyPreferencesResult {
  openAiKeyStatus: ProviderKeyStatus;
  openRouterKeyStatus: ProviderKeyStatus;
  selectedVoice: string;
  dailyGoal: number;
  koreanLevel: string;
  maxLlmCallsPerSession: number;
  annotationCacheDays: number;
}

export interface PreviewTtsVoiceInput {
  voice: string
}

export interface PreviewTtsVoiceResult {
  ok: boolean;
  voice: string;
  sampleText: "안녕하세요, 소나입니다.";
  message: string;
  audioDataUrl: string | null;
}

export interface ClearAnnotationCacheResult {
  removedEntries: number;
}

export interface WindowSona {
  shell: {
    getBootstrapState(): Promise<ShellBootstrapState>;
    getHomeDashboard(): Promise<HomeDashboardSnapshot>;
  };
  settings: {
    getThemePreference(): Promise<ThemePreferenceMode>;
    setThemePreference(mode: ThemePreferenceMode): Promise<ThemeUpdateResult>;
    getOpenAiApiKeyStatus(): Promise<ApiKeyStatus>;
    setOpenAiApiKey(apiKey: string | null): Promise<ApiKeyStatus>;
    validateOpenAiKey(): Promise<ValidateOpenAiKeyResult>;
    getReadingAudioMode(): Promise<ReadingAudioMode>;
    setReadingAudioMode(
      mode: ReadingAudioMode,
    ): Promise<ReadingAudioModeUpdateResult>;
    getReadingAudioVoice(): Promise<ReadingAudioVoice>;
    setReadingAudioVoice(
      voice: ReadingAudioVoice,
    ): Promise<ReadingAudioVoiceUpdateResult>;
    getStudyPreferences(): Promise<StudyPreferencesSnapshot>;
    saveStudyPreferences(
      input: SaveStudyPreferencesInput,
    ): Promise<SaveStudyPreferencesResult>;
    validateOpenRouterKey(): Promise<ValidateOpenRouterKeyResult>;
    previewTtsVoice(
      input: PreviewTtsVoiceInput,
    ): Promise<PreviewTtsVoiceResult>;
    clearAnnotationCache(): Promise<ClearAnnotationCacheResult>;
    subscribeThemeChanges(
      listener: (update: ThemeUpdateResult) => void,
    ): () => void;
  };
  content: {
    listLibraryItems(): Promise<SaveContentSuccess["item"][]>;
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
    ensureSentenceAudio(
      input: EnsureReviewSentenceAudioInput,
    ): Promise<ReviewSentenceAudioAsset>;
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