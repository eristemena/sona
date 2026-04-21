# Contract: `window.sona` Reading API Surface

## Purpose

Defines the typed preload bridge additions required for the synced reading view: session bootstrap, block-audio generation and cache access, tap-to-lookup, richer grammar help, review-card creation, progress persistence, and batched passive exposure flushes.

## Type Definitions

```ts
type ReadingPlaybackState = 'idle' | 'buffering' | 'playing' | 'paused' | 'ended'
type AudioGenerationState = 'ready' | 'pending' | 'failed' | 'unavailable'
type AnnotationCacheState = 'fresh' | 'stale' | 'refreshing' | 'miss'
type AddToDeckDisposition = 'created' | 'duplicate-blocked' | 'deferred'

interface ReadingToken {
  index: number
  surface: string
  normalized?: string
  start?: number
  end?: number
}

interface ReadingBlock {
  id: string
  contentItemId: string
  korean: string
  romanization: string | null
  tokens: ReadingToken[]
  audioOffset: number | null
  sentenceOrdinal: number
}

interface WordTiming {
  tokenIndex: number
  surface: string
  startMs: number
  endMs: number
}

interface ReadingAudioAsset {
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

interface WordLookupInput {
  blockId: string
  token: string
  tokenIndex: number
  sentenceContext: string
}

interface WordLookupResult {
  canonicalForm: string
  surface: string
  meaning: string
  romanization: string
  pattern: string
  register: string
  sentenceTranslation: string
  grammarExplanation: string | null
  cacheState: AnnotationCacheState
  modelId: string | null
}

interface GrammarExplanationInput {
  blockId: string
  token: string
  tokenIndex: number
  sentenceContext: string
  canonicalForm?: string
}

interface AddToDeckInput {
  blockId: string
  token: string
  canonicalForm: string
  sentenceContext: string
}

interface AddToDeckResult {
  disposition: AddToDeckDisposition
  reviewCardId: string | null
  message: string
}

interface ExposureLogInput {
  entries: Array<{
    blockId: string
    token: string
    seenAt: number
  }>
}

interface ExposureLogResult {
  written: number
}

interface SaveReadingProgressInput {
  contentItemId: string
  activeBlockId: string | null
  playbackState: ReadingPlaybackState
  playbackRate: number
  currentTimeMs: number
  highlightedTokenIndex: number | null
}

interface ReadingSessionSnapshot {
  contentItemId: string
  itemTitle: string
  provenanceLabel: string
  provenanceDetail: string
  blocks: ReadingBlock[]
  progress: {
    activeBlockId: string | null
    playbackState: ReadingPlaybackState
    playbackRate: number
    currentTimeMs: number
    highlightedTokenIndex: number | null
  }
}
```

## Surface

```ts
interface WindowSona {
  reading: {
    getReadingSession(contentItemId: string): Promise<ReadingSessionSnapshot>
    ensureBlockAudio(blockId: string): Promise<ReadingAudioAsset>
    lookupWord(input: WordLookupInput): Promise<WordLookupResult>
    explainGrammar(input: GrammarExplanationInput): Promise<WordLookupResult>
    addToDeck(input: AddToDeckInput): Promise<AddToDeckResult>
    saveReadingProgress(input: SaveReadingProgressInput): Promise<void>
    flushExposureLog(input: ExposureLogInput): Promise<ExposureLogResult>
  }
}
```

## Behavior Rules

- `getReadingSession()` returns enough content and progress state to open the reading surface without separate ad hoc IPC calls for item metadata.
- `ensureBlockAudio()` may generate audio on first open or return a cached asset. It never exposes provider keys or raw provider responses to the renderer.
- `ensureBlockAudio()` returns `state: 'unavailable'` or `state: 'failed'` with a learner-safe message when hosted audio cannot be produced, while the reading session remains usable.
- `lookupWord()` first checks the local annotation cache by `(canonical_form, sentence_context_hash)` and may return `cacheState: 'stale'` while a background refresh is queued.
- `lookupWord()` returns sentence-context meaning for the tapped form plus a natural English translation of the full sentence so Korean constructions are not reduced to dictionary-only glosses.
- `explainGrammar()` uses the same cache key and returns the richer explanation path without requiring the renderer to know whether the result came from cache or provider.
- `addToDeck()` creates at most one new FSRS-backed review card per learner action and must report whether the action created a card, hit a duplicate, or was deferred by pacing.
- `flushExposureLog()` is called with a batch of observed tokens and must be safe to retry without creating unbounded duplicates.
- `saveReadingProgress()` is lightweight and separate from exposure flushing so playback state can persist without forcing frequent writes.

## Error Model

- Provider and cache failures return structured learner-safe responses rather than thrown renderer-visible stack traces.
- Missing audio, missing credentials, or unsupported timing payloads do not block text-first reading.
- Duplicate and pacing outcomes for `addToDeck()` are returned as normal results, not exceptional failures.

## Security Rules

- `contextIsolation` remains enabled.
- The renderer never receives raw `ipcRenderer`, OpenRouter headers, provider API keys, or arbitrary filesystem access.
- Audio file paths are returned only as resolved local cache paths for playback; creation and deletion stay in the main process.