export type AnnotationCacheState = 'fresh' | 'stale' | 'refreshing' | 'miss'

export interface WordLookupInput {
  blockId: string
  token: string
  tokenIndex: number
  sentenceContext: string
}

export interface WordLookupResult {
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

export interface GrammarExplanationInput extends WordLookupInput {
  canonicalForm?: string
}

export interface AnnotationCacheEntry {
  id: string
  canonicalForm: string
  sentenceContextHash: string
  surface: string
  meaning: string
  romanization: string
  pattern: string
  register: string
  sentenceTranslation: string
  grammarExplanation: string | null
  modelId: string
  responseJson: string
  createdAt: number
  refreshedAt: number
  staleAfter: number
  lastServedAt: number
  refreshState: Exclude<AnnotationCacheState, 'miss'>
}

export function createLookupUnavailableResult(token: string): WordLookupResult {
  return {
    canonicalForm: token,
    surface: token,
    meaning: 'Unavailable offline',
    romanization: '',
    pattern: 'Lookup unavailable',
    register: 'Offline',
    sentenceTranslation: 'Lookup is not available yet for this reading session.',
    grammarExplanation: null,
    cacheState: 'miss',
    modelId: null,
  }
}

export function toWordLookupResult(entry: AnnotationCacheEntry): WordLookupResult {
  return {
    canonicalForm: entry.canonicalForm,
    surface: entry.surface,
    meaning: entry.meaning,
    romanization: entry.romanization,
    pattern: entry.pattern,
    register: entry.register,
    sentenceTranslation: entry.sentenceTranslation,
    grammarExplanation: entry.grammarExplanation,
    cacheState: entry.refreshState,
    modelId: entry.modelId,
  }
}