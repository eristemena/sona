import {
  createLookupUnavailableResult,
  type AddToDeckInput,
  type AddToDeckResult,
  type ExposureLogInput,
  type ExposureLogResult,
  type GrammarExplanationInput,
  type ReadingSessionSnapshot,
  type SaveReadingProgressInput,
  type WordLookupInput,
  type WordLookupResult,
} from '@sona/domain/content'

import type { SqliteContentLibraryRepository } from '@sona/data/sqlite/content-library-repository'
import { runReadingExposureFlush } from '@sona/data/sqlite/workloads/reading-exposure-flush'

import { AnnotationCacheService } from './annotation-cache-service.js'
import { AudioCacheService } from './audio-cache-service.js'
import { ReadingProgressService } from './reading-progress-service.js'
import { ReviewCardService } from './review-card-service.js'

interface ReadingSessionServiceOptions {
  repository: SqliteContentLibraryRepository
  readingProgressService: ReadingProgressService
  audioCacheService: AudioCacheService
  annotationCacheService: AnnotationCacheService
  reviewCardService: ReviewCardService
}

export class ReadingSessionService {
  constructor(private readonly options: ReadingSessionServiceOptions) {}

  getReadingSession(contentItemId: string): ReadingSessionSnapshot {
    const session = this.options.repository.getReadingSession(contentItemId)
    if (!session) {
      throw new Error(`Reading session content was not found for ${contentItemId}.`)
    }

    return session
  }

  async lookupWord(input: WordLookupInput): Promise<WordLookupResult> {
    return this.options.annotationCacheService.lookupWord(input, {
      canonicalCandidate: this.resolveCanonicalCandidate(input),
    })
  }

  async explainGrammar(input: GrammarExplanationInput): Promise<WordLookupResult> {
    return this.options.annotationCacheService.explainGrammar(input, {
      canonicalCandidate: input.canonicalForm ?? this.resolveCanonicalCandidate(input),
    })
  }

  addToDeck(input: AddToDeckInput): AddToDeckResult {
    return this.options.reviewCardService.addToDeck(input)
  }

  saveReadingProgress(input: SaveReadingProgressInput): void {
    this.options.readingProgressService.saveProgress(input)
  }

  flushExposureLog(input: ExposureLogInput): ExposureLogResult {
    return {
      written: runReadingExposureFlush(this.options.repository, input.entries),
    }
  }

  ensureBlockAudio(blockId: string) {
    return this.options.audioCacheService.ensureBlockAudio(blockId)
  }

  private resolveCanonicalCandidate(input: Pick<WordLookupInput, 'blockId' | 'tokenIndex'>): string | null {
    const block = this.options.repository.getReadingBlock(input.blockId)
    const token = block?.tokens[input.tokenIndex]
    return token?.normalized?.trim() || null
  }
}