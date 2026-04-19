# Contract: `window.sona` Content Library API Surface

## Purpose

Defines the typed preload bridge additions required for content ingestion, library browsing, search/filter refresh, and deletion. This contract extends the existing `window.sona` shell/settings surface and remains the only renderer-facing IPC boundary for the feature.

## Type Definitions

```ts
type ContentSourceType = 'generated' | 'article' | 'srt'
type DifficultyLevel = 1 | 2 | 3 | null
type RequiredDifficultyLevel = 1 | 2 | 3
type DifficultyBadge = '초급' | '중급' | '고급' | null
type LibraryFilter = 'all' | 'article' | 'srt' | 'generated'

interface Token {
  surface: string
  normalized?: string
  start?: number
  end?: number
}

interface Annotation {
  label: string
  value?: string
}

interface ContentBlock {
  id: string
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

interface ContentLibraryItem {
  id: string
  title: string
  sourceType: ContentSourceType
  difficulty: RequiredDifficultyLevel
  difficultyBadge: Exclude<DifficultyBadge, null>
  provenanceLabel: string
  provenanceDetail: string
  createdAt: number
  blockCount: number
}

interface ListLibraryItemsInput {
  filter?: LibraryFilter
  search?: string
}

interface ImportSrtInput {
  filePath: string
  title?: string
  difficulty: RequiredDifficultyLevel
  confirmDuplicate?: boolean
}

interface CreateArticleFromPasteInput {
  title?: string
  text: string
  difficulty: RequiredDifficultyLevel
  confirmDuplicate?: boolean
}

interface CreateArticleFromUrlInput {
  url: string
  title?: string
  difficulty: RequiredDifficultyLevel
  confirmDuplicate?: boolean
}

interface GeneratePracticeSentencesInput {
  topic: string
  difficulty: RequiredDifficultyLevel
  confirmDuplicate?: boolean
}

interface SaveContentSuccess {
  ok: true
  item: ContentLibraryItem
  blocks: ContentBlock[]
}

interface DuplicateWarningResult {
  ok: false
  reason: 'duplicate-warning'
  message: string
  matchingItemIds: string[]
}

interface SaveContentFailure {
  ok: false
  reason: 'invalid-input' | 'validation-rejected' | 'provider-unavailable' | 'scrape-failed'
  message: string
}

type SaveContentResult = SaveContentSuccess | DuplicateWarningResult | SaveContentFailure

interface DeleteContentResult {
  deletedId: string
}
```

`DifficultyLevel` and `DifficultyBadge` remain nullable only for transient pre-save form or validation state. Persisted library items, saved blocks, and save inputs must use the required difficulty variants shown below.

## Surface

```ts
interface WindowSona {
  shell: {
    getBootstrapState(): Promise<ShellBootstrapState>
  }
  settings: {
    getThemePreference(): Promise<ThemePreferenceMode>
    setThemePreference(mode: ThemePreferenceMode): Promise<ThemeUpdateResult>
    subscribeThemeChanges(listener: (update: ThemeUpdateResult) => void): () => void
  }
  content: {
    listLibraryItems(input?: ListLibraryItemsInput): Promise<ContentLibraryItem[]>
    getContentBlocks(contentItemId: string): Promise<ContentBlock[]>
    importSrt(input: ImportSrtInput): Promise<SaveContentResult>
    createArticleFromPaste(input: CreateArticleFromPasteInput): Promise<SaveContentResult>
    createArticleFromUrl(input: CreateArticleFromUrlInput): Promise<SaveContentResult>
    generatePracticeSentences(input: GeneratePracticeSentencesInput): Promise<SaveContentResult>
    deleteContent(contentItemId: string): Promise<DeleteContentResult>
  }
}
```

## Behavior Rules

- All methods return typed data only; no raw database handles, filesystem handles, or generic IPC channel names are exposed to the renderer.
- The renderer-facing preload contract uses camelCase field names; snake_case remains limited to SQLite schema and migration artifacts.
- `listLibraryItems()` supports the library card grid, pill-tab filters, and search input state without requiring direct SQL in the renderer.
- `listLibraryItems()` returns enough metadata for the learner to inspect both a short provenance label and a fuller provenance detail string.
- `provenanceDetail` is the renderer-facing carrier for source-specific provenance in this feature slice and must format the relevant file path, article source, or generation request metadata into a learner-readable string instead of exposing separate source-specific fields.
- `importSrt()` parses the file in the main process, creates a library item plus sentence-level blocks, and returns the saved result only after persistence succeeds.
- `createArticleFromPaste()` and `createArticleFromUrl()` both normalize article text into sentence-level blocks with the same boundary rules.
- `generatePracticeSentences()` persists content only after difficulty validation accepts or relabels the generated result.
- `deleteContent()` removes the library item and its associated blocks from the local collection.
- Save methods may require `confirmDuplicate: true` before creating a new item when the repository detects a likely duplicate.

## Error Model

- Invalid user input is rejected before persistence with normalized, learner-safe errors.
- Duplicate candidates return `DuplicateWarningResult` until the learner explicitly confirms save.
- Scrape and provider failures return `SaveContentFailure` with feature-scoped reasons and must not mutate existing library records.
- Generation validation failures return `SaveContentFailure` with `reason: 'validation-rejected'` rather than saving hidden drift.

## Security Rules

- `contextIsolation` remains enabled.
- Only the typed `window.sona` surface is exposed; no `ipcRenderer` passthrough is added.
- API credentials for optional provider use remain in the main process or settings storage and are never exposed to the renderer.