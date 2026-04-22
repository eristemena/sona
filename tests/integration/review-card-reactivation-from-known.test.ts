import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { DailyReviewService } from '../../apps/desktop/src/main/content/daily-review-service.js'
import { KnownWordService } from '../../apps/desktop/src/main/content/known-word-service.js'
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

describe('review card reactivation from known', () => {
  it('reactivates a known review card back into the due queue when known-word status is cleared', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sona-review-reactivation-'))
    tempDirectories.push(directory)

    const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)

    const createdAt = 1_714_102_000_000
    const sourceLocator = 'article://review-reactivation'
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
        title: 'Review reactivation',
        sourceType: 'article',
        difficulty: 2,
        difficultyLabel: toDifficultyBadge(2),
        provenanceLabel: 'Article paste',
        sourceLocator,
        provenanceDetail: 'Used for known-word reactivation checks.',
        searchText: normalizeSearchText('Review reactivation 오늘도 천천히 읽어요'),
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

    const reviewCardService = new ReviewCardService({
      repository,
      now: () => createdAt + 400,
      activeNewCardLimit: 3,
    })
    const knownWordService = new KnownWordService({
      repository,
      now: () => createdAt + 900,
      activeReviewCardLimit: 3,
    })
    const dailyReviewService = new DailyReviewService({
      repository,
      now: () => createdAt + 2_000,
    })

    const addResult = reviewCardService.addToDeck({
      blockId,
      token: '천천히',
      canonicalForm: '천천히',
      sentenceContext,
    })

    expect(dailyReviewService.getQueue()).toMatchObject({
      dueCount: 1,
      cards: [{ front: { id: addResult.reviewCardId } }],
    })

    knownWordService.markKnownWord({
      canonicalForm: '천천히',
      surface: '천천히',
      source: 'manual',
      reviewCardId: addResult.reviewCardId,
    })

    expect(repository.getReviewCard(addResult.reviewCardId!)?.activationState).toBe('known')
    expect(dailyReviewService.getQueue()).toMatchObject({ dueCount: 0, cards: [] })

    const clearResult = knownWordService.clearKnownWord({
      canonicalForm: '천천히',
      reviewCardId: addResult.reviewCardId,
    })

    expect(clearResult).toMatchObject({
      canonicalForm: '천천히',
      affectedReviewCardId: addResult.reviewCardId,
      activationState: 'active',
    })
    expect(repository.getReviewCard(addResult.reviewCardId!)?.activationState).toBe('active')
    expect(dailyReviewService.getQueue()).toMatchObject({
      dueCount: 1,
      cards: [{ front: { id: addResult.reviewCardId } }],
    })

    database.close()
  })
})