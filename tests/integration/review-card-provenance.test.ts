import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { ReviewCardService } from '../../apps/desktop/src/main/content/review-card-service.js'
import { hashSentenceContext } from '../../apps/desktop/src/main/content/annotation-cache-service.js'
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

describe('review card provenance retrieval integration', () => {
  it('retrieves saved review-card provenance after the reading capture is written', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sona-review-card-provenance-'))
    tempDirectories.push(directory)

    const databasePath = path.join(directory, 'sona.db')
    const database = createSqliteConnection({ databasePath })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)

    const createdAt = 1_714_100_500_000
    const sourceLocator = 'article://review-card-provenance'
    const sentenceContext = '오늘도 천천히 읽어요'
    const contentItemId = buildContentItemId({ sourceType: 'article', sourceLocator, createdAt })
    const blockId = buildContentBlockId({
      sourceType: 'article',
      sourceLocator,
      contentItemCreatedAt: createdAt,
      sentenceOrdinal: 1,
    })

    repository.saveContent({
      item: {
        id: contentItemId,
        title: 'Review provenance retrieval',
        sourceType: 'article',
        difficulty: 2,
        difficultyLabel: toDifficultyBadge(2),
        provenanceLabel: 'Article paste',
        sourceLocator,
        provenanceDetail: 'Used for later review provenance checks.',
        searchText: normalizeSearchText('Review provenance retrieval 오늘도 천천히 읽어요'),
        duplicateCheckText: normalizeSearchText(sentenceContext),
        createdAt,
      },
      blocks: [
        {
          id: blockId,
          contentItemId,
          korean: sentenceContext,
          romanization: 'oneuldo cheoncheonhi ilg-eoyo',
          tokens: [
            { surface: '오늘도', normalized: '오늘도' },
            { surface: '천천히', normalized: '천천히' },
            { surface: '읽어요', normalized: '읽다' },
          ],
          annotations: {},
          difficulty: 2,
          sourceType: 'article',
          audioOffset: null,
          sentenceOrdinal: 1,
          createdAt,
        },
      ],
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

    const service = new ReviewCardService({
      repository,
      now: () => createdAt + 750,
      activeNewCardLimit: 3,
    })

    const addResult = service.addToDeck({
      blockId,
      token: '천천히',
      canonicalForm: '천천히',
      sentenceContext,
    })

    expect(addResult.disposition).toBe('created')
    expect(addResult.reviewCardId).toBeTruthy()

    database.close()

    const reopenedDatabase = createSqliteConnection({ databasePath })
    const reopenedRepository = new SqliteContentLibraryRepository(reopenedDatabase)
    const persistedCard = reopenedRepository.getReviewCard(addResult.reviewCardId!)

    expect(persistedCard).toMatchObject({
      id: addResult.reviewCardId,
      canonicalForm: '천천히',
      surface: '천천히',
      sourceBlockId: blockId,
      sourceContentItemId: contentItemId,
      sentenceContextHash: hashSentenceContext(sentenceContext),
      fsrsState: 'New',
      activationState: 'active',
    })

    reopenedDatabase.close()
  })
})