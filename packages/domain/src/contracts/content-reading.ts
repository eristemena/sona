export type {
  AddToDeckDisposition,
  AddToDeckInput,
  AddToDeckResult,
  ExposureLogEntry,
  ExposureLogInput,
  ExposureLogResult,
} from '../content/review-card.js'
export type {
  AnnotationCacheEntry,
  AnnotationCacheState,
  GrammarExplanationInput,
  WordLookupInput,
  WordLookupResult,
} from '../content/annotation-cache.js'
export type { AudioGenerationState, ReadingAudioAsset, WordTiming } from '../content/reading-audio.js'
export type {
  ReadingBlock,
  ReadingPlaybackState,
  ReadingSessionProgress,
  ReadingSessionSnapshot,
  ReadingToken,
  SaveReadingProgressInput,
} from '../content/reading-session.js'

export const READING_CHANNELS = {
  getReadingSession: 'sona:reading:get-session',
  ensureBlockAudio: 'sona:reading:ensure-block-audio',
  lookupWord: 'sona:reading:lookup-word',
  explainGrammar: 'sona:reading:explain-grammar',
  addToDeck: 'sona:reading:add-to-deck',
  saveReadingProgress: 'sona:reading:save-progress',
  flushExposureLog: 'sona:reading:flush-exposure-log',
} as const