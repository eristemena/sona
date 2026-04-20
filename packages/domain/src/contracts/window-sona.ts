import type { NavigationDestinationId, ShellBootstrapState } from './shell-bootstrap.js'
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

export type { NavigationDestinationId, ResolvedTheme, ThemePreferenceMode }

export interface ThemeUpdateResult {
  themePreference: ThemePreferenceMode
  resolvedTheme: ResolvedTheme
}

export interface WindowSona {
  shell: {
    getBootstrapState(): Promise<ShellBootstrapState>;
  };
  settings: {
    getThemePreference(): Promise<ThemePreferenceMode>;
    setThemePreference(mode: ThemePreferenceMode): Promise<ThemeUpdateResult>;
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
}

declare global {
  interface Window {
    sona: WindowSona
  }
}