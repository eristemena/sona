import type {
  Annotation,
  ContentBlock,
  ContentLibraryItem,
  ContentSourceType,
  DifficultyLevel,
  LibraryFilter,
  RequiredDifficultyLevel,
  Token,
} from '../content/index.js'

export type {
  Annotation,
  ContentBlock,
  ContentLibraryItem,
  ContentSourceType,
  DifficultyLevel,
  LibraryFilter,
  RequiredDifficultyLevel,
  Token,
}

export const CONTENT_CHANNELS = {
  listLibraryItems: 'sona:content:list-library-items',
  getContentBlocks: 'sona:content:get-content-blocks',
  browseSubtitleFile: 'sona:content:browse-subtitle-file',
  importSrt: 'sona:content:import-srt',
  createArticleFromPaste: 'sona:content:create-article-from-paste',
  createArticleFromUrl: 'sona:content:create-article-from-url',
  generatePracticeSentences: 'sona:content:generate-practice-sentences',
  deleteContent: 'sona:content:delete-content',
} as const

export interface ImportSrtInput {
  filePath?: string
  fileName?: string
  fileContent?: string
  title?: string
  difficulty: RequiredDifficultyLevel
  confirmDuplicate?: boolean
}

export interface CreateArticleFromPasteInput {
  title?: string
  text: string
  difficulty: RequiredDifficultyLevel
  confirmDuplicate?: boolean
}

export interface CreateArticleFromUrlInput {
  url: string
  title?: string
  difficulty: RequiredDifficultyLevel
  confirmDuplicate?: boolean
}

export interface GeneratePracticeSentencesInput {
  topic: string
  difficulty: RequiredDifficultyLevel
  confirmDuplicate?: boolean
}

export interface SaveContentSuccess {
  ok: true
  item: Omit<ContentLibraryItem, 'difficultyLabel' | 'sourceLocator' | 'searchText' | 'duplicateCheckText'> & {
    difficultyBadge: ContentLibraryItem['difficultyLabel']
    blockCount: number
  }
  blocks: Array<
    Omit<ContentBlock, 'contentItemId'> & {
      annotations: Record<string, Annotation | null>
      tokens: Token[] | null
    }
  >
}

export interface DuplicateWarningResult {
  ok: false
  reason: 'duplicate-warning'
  message: string
  matchingItemIds: string[]
}

export interface SaveContentFailure {
  ok: false
  reason: 'invalid-input' | 'validation-rejected' | 'provider-unavailable' | 'scrape-failed'
  message: string
}

export type SaveContentResult = SaveContentSuccess | DuplicateWarningResult | SaveContentFailure

export interface DeleteContentResult {
  deletedId: string
}