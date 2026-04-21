export type AudioGenerationState = 'ready' | 'pending' | 'failed' | 'unavailable'

export interface WordTiming {
  tokenIndex: number
  surface: string
  startMs: number
  endMs: number
}

export interface ReadingAudioAsset {
  blockId: string
  state: AudioGenerationState
  audioFilePath: string | null
  durationMs: number | null
  modelId: string
  voice: string
  timings: WordTiming[]
  failureMessage?: string
  fromCache: boolean
}

export interface PersistedReadingAudioAsset {
  id: string
  blockId: string
  provider: 'openai'
  modelId: string
  voice: string
  textHash: string
  audioFilePath: string | null
  timingFormat: 'verbose_json'
  timings: WordTiming[]
  durationMs: number | null
  state: AudioGenerationState
  failureReason: string | null
  generatedAt: number | null
  lastAccessedAt: number
}