import type { RequiredDifficultyLevel } from './difficulty.js'

export type ContentSourceType = 'generated' | 'article' | 'srt'

export interface Token {
  surface: string
  normalized?: string
  start?: number
  end?: number
}

export interface Annotation {
  label: string
  value?: string
}

export interface ContentBlock {
  id: string
  contentItemId: string
  korean: string
  romanization: string | null
  tokens: Token[] | null
  annotations: Record<string, Annotation | null>
  difficulty: RequiredDifficultyLevel
  sourceType: ContentSourceType
  audioOffset: number | null
  sentenceOrdinal: number
  createdAt: number
}