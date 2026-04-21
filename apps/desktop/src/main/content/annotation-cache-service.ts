import { createHash, randomUUID } from 'node:crypto'

import {
  createLookupUnavailableResult,
  toWordLookupResult,
  type AnnotationCacheEntry,
  type GrammarExplanationInput,
  type WordLookupInput,
  type WordLookupResult,
} from '@sona/domain/content'
import type { SqliteContentLibraryRepository } from '@sona/data/sqlite/content-library-repository'
import type {
  ReadingAnnotationProviderAdapter,
  ReadingAnnotationResponse,
} from '@sona/integrations/llm/provider-adapter'

const DEFAULT_STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000
const GRAMMAR_EXPLANATION_FALLBACK = 'A richer grammar explanation is unavailable right now. Continue reading and try again later.'

interface AnnotationCacheServiceOptions {
  repository: SqliteContentLibraryRepository
  provider: ReadingAnnotationProviderAdapter
  now?: () => number
  staleAfterMs?: number
}

interface AnnotationLookupOptions {
  canonicalCandidate?: string | null
}

export class AnnotationCacheService {
  private readonly now: () => number
  private readonly staleAfterMs: number
  private readonly refreshQueue = new Map<string, Promise<void>>()

  constructor(private readonly options: AnnotationCacheServiceOptions) {
    this.now = options.now ?? (() => Date.now())
    this.staleAfterMs = options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS
  }

  async lookupWord(input: WordLookupInput, options: AnnotationLookupOptions = {}): Promise<WordLookupResult> {
    const sentenceContextHash = hashSentenceContext(input.sentenceContext)
    const canonicalCandidate = normalizeLookupToken(options.canonicalCandidate ?? input.token)
    const timestamp = this.now()
    const cached = this.options.repository.findAnnotationForLookup({
      surface: input.token,
      canonicalForm: canonicalCandidate,
      sentenceContextHash,
    })

    if (cached) {
      const stale = this.isStale(cached, timestamp)
      const servedEntry = {
        ...cached,
        lastServedAt: timestamp,
        refreshState: stale ? (cached.refreshState === 'refreshing' ? 'refreshing' : 'stale') : 'fresh',
      } satisfies AnnotationCacheEntry

      this.options.repository.saveAnnotationCacheEntry(servedEntry)

      if (stale) {
        this.scheduleRefresh(servedEntry, input, canonicalCandidate)
      }

      return toWordLookupResult(servedEntry)
    }

    try {
      const response = await this.options.provider.lookupWord({
        token: input.token,
        sentenceContext: input.sentenceContext,
        canonicalForm: canonicalCandidate,
      })

      const entry = this.buildEntry({
        response,
        sentenceContextHash,
        surface: input.token,
        existingEntry: null,
        timestamp,
      })

      this.options.repository.saveAnnotationCacheEntry(entry)
      return toWordLookupResult(entry)
    } catch {
      return createLookupUnavailableResult(input.token)
    }
  }

  async explainGrammar(input: GrammarExplanationInput, options: AnnotationLookupOptions = {}): Promise<WordLookupResult> {
    const sentenceContextHash = hashSentenceContext(input.sentenceContext)
    const canonicalCandidate = normalizeLookupToken(options.canonicalCandidate ?? input.canonicalForm ?? input.token)
    const timestamp = this.now()
    const cached = this.options.repository.findAnnotationForLookup({
      surface: input.token,
      canonicalForm: canonicalCandidate,
      sentenceContextHash,
    })

    if (cached && cached.grammarExplanation && !this.isStale(cached, timestamp)) {
      const servedEntry = {
        ...cached,
        lastServedAt: timestamp,
        refreshState: 'fresh',
      } satisfies AnnotationCacheEntry

      this.options.repository.saveAnnotationCacheEntry(servedEntry)
      return toWordLookupResult(servedEntry)
    }

    try {
      const response = await this.options.provider.explainGrammar({
        token: input.token,
        sentenceContext: input.sentenceContext,
        canonicalForm: cached?.canonicalForm ?? canonicalCandidate,
      })

      const entry = this.buildEntry({
        response,
        sentenceContextHash,
        surface: cached?.surface ?? input.token,
        existingEntry: cached ?? null,
        timestamp,
      })

      this.options.repository.saveAnnotationCacheEntry(entry)
      return toWordLookupResult(entry)
    } catch {
      if (cached) {
        const servedEntry = {
          ...cached,
          lastServedAt: timestamp,
          refreshState: this.isStale(cached, timestamp) ? 'stale' : 'fresh',
        } satisfies AnnotationCacheEntry

        this.options.repository.saveAnnotationCacheEntry(servedEntry)
        return {
          ...toWordLookupResult(servedEntry),
          grammarExplanation: servedEntry.grammarExplanation ?? GRAMMAR_EXPLANATION_FALLBACK,
        }
      }

      return {
        ...createLookupUnavailableResult(input.token),
        grammarExplanation: GRAMMAR_EXPLANATION_FALLBACK,
      }
    }
  }

  async drainRefreshQueue(): Promise<void> {
    await Promise.allSettled([...this.refreshQueue.values()])
  }

  private scheduleRefresh(entry: AnnotationCacheEntry, input: WordLookupInput, canonicalCandidate: string): void {
    const cacheKey = `${entry.canonicalForm}:${entry.sentenceContextHash}`
    if (this.refreshQueue.has(cacheKey)) {
      return
    }

    const refreshingEntry = {
      ...entry,
      refreshState: 'refreshing',
    } satisfies AnnotationCacheEntry
    this.options.repository.saveAnnotationCacheEntry(refreshingEntry)

    const refreshPromise = this.refreshEntry(refreshingEntry, input, canonicalCandidate).finally(() => {
      this.refreshQueue.delete(cacheKey)
    })

    this.refreshQueue.set(cacheKey, refreshPromise)
  }

  private async refreshEntry(entry: AnnotationCacheEntry, input: WordLookupInput, canonicalCandidate: string): Promise<void> {
    try {
      const response = await this.options.provider.lookupWord({
        token: input.token,
        sentenceContext: input.sentenceContext,
        canonicalForm: entry.canonicalForm || canonicalCandidate,
      })

      const refreshedEntry = this.buildEntry({
        response,
        sentenceContextHash: entry.sentenceContextHash,
        surface: entry.surface,
        existingEntry: entry,
        timestamp: this.now(),
      })

      this.options.repository.saveAnnotationCacheEntry(refreshedEntry)
    } catch {
      this.options.repository.saveAnnotationCacheEntry({
        ...entry,
        refreshState: 'stale',
      })
    }
  }

  private buildEntry(input: {
    response: ReadingAnnotationResponse
    sentenceContextHash: string
    surface: string
    existingEntry: AnnotationCacheEntry | null
    timestamp: number
  }): AnnotationCacheEntry {
    return {
      id: input.existingEntry?.id ?? randomUUID(),
      canonicalForm: normalizeLookupToken(input.response.canonicalForm || input.surface),
      sentenceContextHash: input.sentenceContextHash,
      surface: input.response.surface,
      meaning: input.response.meaning,
      romanization: input.response.romanization,
      pattern: input.response.pattern,
      register: input.response.register,
      sentenceTranslation: input.response.sentenceTranslation,
      grammarExplanation: input.response.grammarExplanation,
      modelId: input.response.modelId,
      responseJson: input.response.responseJson,
      createdAt: input.existingEntry?.createdAt ?? input.timestamp,
      refreshedAt: input.timestamp,
      staleAfter: input.timestamp + this.staleAfterMs,
      lastServedAt: input.timestamp,
      refreshState: 'fresh',
    }
  }

  private isStale(entry: AnnotationCacheEntry, timestamp: number): boolean {
    return entry.staleAfter <= timestamp || entry.modelId !== this.options.provider.modelId
  }
}

export function hashSentenceContext(sentenceContext: string): string {
  return createHash('sha256').update(sentenceContext.trim().replace(/\s+/g, ' ')).digest('hex')
}

function normalizeLookupToken(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}