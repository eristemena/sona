# Contract: `window.sona` Content Library API Surface

## Purpose

Defines the typed preload bridge additions required for content ingestion, library browsing, search/filter refresh, and deletion. This contract extends the existing `window.sona` shell/settings surface and remains the only renderer-facing IPC boundary for the feature.

## Type Definitions

```ts
type ContentSourceType = 'generated' | 'article' | 'srt'
type DifficultyLevel = 1 | 2 | 3 | null
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
  difficulty: DifficultyLevel
  source_type: ContentSourceType
  audio_offset: number | null
  created_at: number
}

interface ContentLibraryItem {
  id: string
  title: string
  sourceType: ContentSourceType
  difficulty: DifficultyLevel
  difficultyBadge: DifficultyBadge
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
  difficulty: DifficultyLevel
  confirmDuplicate?: boolean
}

interface CreateArticleFromPasteInput {
  title?: string
  text: string
  difficulty: DifficultyLevel
  confirmDuplicate?: boolean
}

interface CreateArticleFromUrlInput {
  url: string
  title?: string
  difficulty: DifficultyLevel
  confirmDuplicate?: boolean
}

interface GeneratePracticeSentencesInput {
  topic: string
  difficulty: Exclude<DifficultyLevel, null>
  confirmDuplicate?: boolean
}

interface SaveContentResult {
  item: ContentLibraryItem
  blocks: ContentBlock[]
}

interface DeleteContentResult {
  deletedId: string
}
```

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
- `listLibraryItems()` supports the library card grid, pill-tab filters, and search input state without requiring direct SQL in the renderer.
- `listLibraryItems()` returns enough metadata for the learner to inspect both a short provenance label and a fuller provenance detail string.
- `importSrt()` parses the file in the main process, creates a library item plus sentence-level blocks, and returns the saved result only after persistence succeeds.
- `createArticleFromPaste()` and `createArticleFromUrl()` both normalize article text into sentence-level blocks with the same boundary rules.
- `generatePracticeSentences()` persists content only after difficulty validation accepts or relabels the generated result.
- `deleteContent()` removes the library item and its associated blocks from the local collection.
- Save methods may require `confirmDuplicate: true` before creating a new item when the repository detects a likely duplicate.

## Error Model

- Invalid user input is rejected before persistence with normalized, learner-safe errors.
- Duplicate candidates return a normalized duplicate-warning error until the learner explicitly confirms save.
- Scrape and provider failures return explicit feature-scoped errors and must not mutate existing library records.
- Generation validation failures return a non-destructive error or relabeled result rather than saving hidden drift.

## Security Rules

- `contextIsolation` remains enabled.
- Only the typed `window.sona` surface is exposed; no `ipcRenderer` passthrough is added.
- API credentials for optional provider use remain in the main process or settings storage and are never exposed to the renderer.