import type { RequiredDifficultyLevel, DifficultyBadge } from './difficulty.js'
import type { ContentSourceType } from './content-block.js'

export type OriginMode = 'file-import' | 'article-paste' | 'article-scrape' | 'generation-request'
export type LibraryFilter = 'all' | 'article' | 'srt' | 'generated'
export type ValidationOutcome = 'accepted' | 'relabeled' | 'rejected'

export interface ContentLibraryItem {
  id: string
  title: string
  sourceType: ContentSourceType
  difficulty: RequiredDifficultyLevel
  difficultyLabel: DifficultyBadge
  provenanceLabel: string
  sourceLocator: string
  provenanceDetail: string
  searchText: string
  duplicateCheckText: string
  createdAt: number
}

export interface ContentSourceRecord {
  contentItemId: string
  originMode: OriginMode
  filePath: string | null
  url: string | null
  sessionId: string | null
  displaySource: string
  requestedDifficulty: RequiredDifficultyLevel | null
  validatedDifficulty: RequiredDifficultyLevel | null
  capturedAt: number
}

export interface GenerationRequest {
  sessionId: string
  topic: string
  requestedDifficulty: RequiredDifficultyLevel
  generatorModel: string
  validatorModel: string
  validatedDifficulty: RequiredDifficultyLevel | null
  validationOutcome: ValidationOutcome
  createdAt: number
}

export interface LibraryQueryState {
  filter: LibraryFilter
  search: string
  resultCount: number
}

export interface DuplicateCheckResult {
  isDuplicateCandidate: boolean
  matchingItemIds: string[]
  requiresConfirmation: boolean
}