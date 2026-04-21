import type { ContentBlock } from './content-block.js'

export type ReadingPlaybackState = 'idle' | 'buffering' | 'playing' | 'paused' | 'ended'

export interface ReadingToken {
  index: number
  surface: string
  normalized?: string
  start?: number
  end?: number
}

export interface ReadingBlock
  extends Pick<ContentBlock, 'id' | 'contentItemId' | 'korean' | 'romanization' | 'audioOffset' | 'sentenceOrdinal'> {
  tokens: ReadingToken[]
}

export interface ReadingSessionProgress {
  activeBlockId: string | null
  playbackState: ReadingPlaybackState
  playbackRate: number
  currentTimeMs: number
  highlightedTokenIndex: number | null
}

export interface SaveReadingProgressInput {
  contentItemId: string
  activeBlockId: string | null
  playbackState: ReadingPlaybackState
  playbackRate: number
  currentTimeMs: number
  highlightedTokenIndex: number | null
}

export interface ReadingSessionSnapshot {
  contentItemId: string
  itemTitle: string
  provenanceLabel: string
  provenanceDetail: string
  blocks: ReadingBlock[]
  progress: ReadingSessionProgress
}

export function createDefaultReadingProgress(): ReadingSessionProgress {
  return {
    activeBlockId: null,
    playbackState: 'idle',
    playbackRate: 1,
    currentTimeMs: 0,
    highlightedTokenIndex: null,
  }
}