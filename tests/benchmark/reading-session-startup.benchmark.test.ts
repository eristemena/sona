import { performance } from 'node:perf_hooks'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { AnnotationCacheService } from '../../apps/desktop/src/main/content/annotation-cache-service.js'
import { AudioCacheService } from '../../apps/desktop/src/main/content/audio-cache-service.js'
import { ReadingProgressService } from '../../apps/desktop/src/main/content/reading-progress-service.js'
import { ReadingSessionService } from '../../apps/desktop/src/main/content/reading-session-service.js'
import { ReviewCardService } from '../../apps/desktop/src/main/content/review-card-service.js'
import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { SqliteContentLibraryRepository } from '../../packages/data/src/sqlite/content-library-repository.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'
import { buildContentBlockId, buildContentItemId, normalizeSearchText, toDifficultyBadge } from '../../packages/domain/src/content/index.js'

const tempDirectories: string[] = []

afterEach(() => {
  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop()!, { force: true, recursive: true })
  }
})

describe('reading session startup benchmark', () => {
  it('keeps the cached synced-reading open path under the 10-second acceptance budget', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sona-reading-startup-benchmark-'))
    tempDirectories.push(directory)

    const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)

    const createdAt = 1_714_200_000_000
    const sourceLocator = 'article://reading-session-startup-benchmark'
    const contentItemId = buildContentItemId({ sourceType: 'article', sourceLocator, createdAt })
    const blocks = Array.from({ length: 120 }, (_, index) => {
      const sentenceOrdinal = index + 1
      return {
        id: buildContentBlockId({
          sourceType: 'article',
          sourceLocator,
          contentItemCreatedAt: createdAt,
          sentenceOrdinal,
        }),
        contentItemId,
        korean: `문장 ${sentenceOrdinal} 를 천천히 읽어요`,
        romanization: null,
        tokens: [
          { surface: '문장' },
          { surface: String(sentenceOrdinal) },
          { surface: '를' },
          { surface: '천천히' },
          { surface: '읽어요' },
        ],
        annotations: {},
        difficulty: 2 as const,
        sourceType: 'article' as const,
        audioOffset: null,
        sentenceOrdinal,
        createdAt: createdAt + sentenceOrdinal,
      }
    })
    const activeBlockId = blocks[0]!.id

    repository.saveContent({
      item: {
        id: contentItemId,
        title: 'Reading session startup benchmark',
        sourceType: 'article',
        difficulty: 2,
        difficultyLabel: toDifficultyBadge(2),
        provenanceLabel: 'Article paste',
        sourceLocator,
        provenanceDetail: 'Used for cached open-path timing validation.',
        searchText: normalizeSearchText('Reading session startup benchmark 문장 1 를 천천히 읽어요'),
        duplicateCheckText: normalizeSearchText('문장 1 를 천천히 읽어요'),
        createdAt,
      },
      blocks,
      sourceRecord: {
        contentItemId,
        originMode: 'article-paste',
        filePath: null,
        url: sourceLocator,
        sessionId: null,
        displaySource: 'Article paste',
        requestedDifficulty: null,
        validatedDifficulty: null,
        capturedAt: createdAt,
      },
    })

    repository.saveReadingProgress({
      contentItemId,
      activeBlockId,
      playbackState: 'paused',
      playbackRate: 1,
      currentTimeMs: 480,
      highlightedTokenIndex: 3,
    })

    const synthesize = vi.fn(async () => ({
      audioData: new Uint8Array([1, 2, 3]),
      contentType: 'audio/mpeg',
      latencyMs: 10,
      estimatedCostUsd: null,
      durationMs: 1600,
    }))

    const audioCacheService = new AudioCacheService({
      repository,
      cacheDirectory: path.join(directory, 'reading-audio-cache'),
      provider: {
        id: 'openai',
        synthesize,
      },
    })
    await audioCacheService.ensureBlockAudio(activeBlockId)

    const readingSessionService = new ReadingSessionService({
      repository,
      readingProgressService: new ReadingProgressService(repository),
      audioCacheService,
      annotationCacheService: new AnnotationCacheService({
        repository,
        provider: {
          id: 'openrouter',
          modelId: 'openai/gpt-4o-mini',
          lookupWord: vi.fn(async () => {
            throw new Error('not used')
          }),
          explainGrammar: vi.fn(async () => {
            throw new Error('not used')
          }),
        },
      }),
      reviewCardService: new ReviewCardService({ repository }),
    })

    const startedAt = performance.now()
    const session = readingSessionService.getReadingSession(contentItemId)
    const asset = await readingSessionService.ensureBlockAudio(activeBlockId)
    const elapsedMs = performance.now() - startedAt

    expect(session.blocks).toHaveLength(120)
    expect(asset).toMatchObject({
      blockId: activeBlockId,
      state: 'ready',
      fromCache: true,
    })
    expect(elapsedMs).toBeLessThan(10_000)

    database.close()
  })
})