# Contract: `window.sona` Home, Library, and Settings Surface

## Purpose

Defines the preload bridge additions and behavioral rules for the dashboard summary, client-side library catalog flow, provider-key validation, and TTS voice preview.

## Type Definitions

```ts
type LibrarySort = 'recent-desc' | 'recent-asc' | 'title-asc' | 'title-desc'

interface RecentVocabularyItem {
  reviewCardId: string
  surface: string
  meaning: string | null
  createdAt: number
  sourceContentItemId: string
}

interface WeeklyActivityPoint {
  date: string
  cardsReviewed: number
  minutesStudied: number
  isToday: boolean
}

interface ResumeContext {
  contentItemId: string
  title: string
  provenanceLabel: string
  activeBlockId: string | null
  updatedAt: number
}

interface HomeDashboardSnapshot {
  generatedAt: number
  todayDueCount: number
  streakDays: number
  dailyGoal: number
  recentVocabulary: RecentVocabularyItem[]
  weeklyActivity: WeeklyActivityPoint[]
  resumeContext: ResumeContext | null
}

interface ProviderKeyStatus {
  configured: boolean
  lastValidatedAt: number | null
  lastValidationState: 'idle' | 'success' | 'failed'
}

interface ValidateOpenRouterKeyResult {
  ok: boolean
  checkedAt: number
  message: string
}

interface StudyPreferencesSnapshot {
  providerKeyStatus: ProviderKeyStatus
  availableVoices: Array<{
    id: string
    label: string
    description: string
  }>
  selectedVoice: string
  dailyGoal: number
}

interface SaveStudyPreferencesInput {
  openRouterApiKey: string | null
  selectedVoice: string
  dailyGoal: number
}

interface SaveStudyPreferencesResult {
  providerKeyStatus: ProviderKeyStatus
  selectedVoice: string
  dailyGoal: number
}

interface PreviewTtsVoiceInput {
  voice: string
}

interface PreviewTtsVoiceResult {
  ok: boolean
  voice: string
  sampleText: '안녕하세요, 소나입니다.'
  message: string
}
```

## Surface

```ts
interface WindowSona {
  shell: {
    getBootstrapState(): Promise<ShellBootstrapState>
    getHomeDashboard(): Promise<HomeDashboardSnapshot>
  }

  settings: {
    getThemePreference(): Promise<ThemePreferenceMode>
    setThemePreference(mode: ThemePreferenceMode): Promise<ThemeUpdateResult>
    getStudyPreferences(): Promise<StudyPreferencesSnapshot>
    saveStudyPreferences(input: SaveStudyPreferencesInput): Promise<SaveStudyPreferencesResult>
    validateOpenRouterKey(): Promise<ValidateOpenRouterKeyResult>
    previewTtsVoice(input: PreviewTtsVoiceInput): Promise<PreviewTtsVoiceResult>
    subscribeThemeChanges(listener: (update: ThemeUpdateResult) => void): () => void
  }

  content: {
    listLibraryItems(): Promise<SaveContentSuccess['item'][]>
    getContentBlocks(contentItemId: string): Promise<SaveContentSuccess['blocks']>
    browseSubtitleFile(): Promise<string | null>
    importSrt(input: ImportSrtInput): Promise<SaveContentResult>
    createArticleFromPaste(input: CreateArticleFromPasteInput): Promise<SaveContentResult>
    createArticleFromUrl(input: CreateArticleFromUrlInput): Promise<SaveContentResult>
    generatePracticeSentences(input: GeneratePracticeSentencesInput): Promise<SaveContentResult>
    deleteContent(contentItemId: string): Promise<DeleteContentResult>
  }
}
```

## Behavior Rules

- `shell.getHomeDashboard()` returns local-only data and must succeed without network access.
- `content.listLibraryItems()` is used as the initial catalog load for the library screen. Search, filter, and sort after that initial load are renderer-derived and do not require additional IPC calls unless the learner performs a content-mutating action such as import or delete.
- `settings.saveStudyPreferences()` persists the key, selected voice, and daily goal locally even if provider validation or voice preview has not been run.
- `settings.validateOpenRouterKey()` performs an explicit network check against `https://openrouter.ai/api/v1/models` using the stored key and reports success only on HTTP 200.
- `settings.previewTtsVoice()` synthesizes the fixed phrase `안녕하세요, 소나입니다.` with the currently selected voice and attempts immediate playback.
- Preview and validation failures return learner-safe messages and must not block local persistence of settings.

## Error Model

- Dashboard reads fall back to zero-value summaries or `resumeContext = null` when local data is absent.
- Library initial-load failures report that the local desktop bridge could not be loaded.
- Provider validation failures distinguish invalid or unavailable provider responses from simple offline conditions where possible.
- Voice-preview failures do not revert the saved voice preference.

## Security Rules

- The renderer never receives the stored raw API key after save.
- Network calls for provider validation and voice preview originate from the main process or its trusted adapters, not from the renderer.
- The preload bridge remains typed and least-privilege: dashboard, settings, and content APIs expose only learner-safe fields.