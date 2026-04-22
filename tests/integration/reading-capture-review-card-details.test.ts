import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

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

describe('reading capture review card details', () => {
  it('persists lookup-derived detail snapshots on the review card when a reading word is added', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sona-reading-capture-review-card-details-'))
    tempDirectories.push(directory)

    const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)

    const createdAt = 1_716_600_000_000
    const sourceLocator = 'article://reading-capture-review-card-details'
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
        title: 'Reading capture review detail snapshot',
        sourceType: 'article',
        difficulty: 2,
        difficultyLabel: toDifficultyBadge(2),
        provenanceLabel: 'Article paste',
        sourceLocator,
        provenanceDetail: 'Used for captured review detail coverage.',
        searchText: normalizeSearchText('Reading capture review detail snapshot 오늘도 천천히 읽어요'),
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
      meaning: 'slowly in this sentence',
      grammarPattern: 'Adverbial pacing',
      grammarDetails: 'Neutral register. Describes the reading tempo.',
      romanization: 'cheoncheonhi',
      sentenceTranslation: 'Even today, I read slowly.',
    })

    const persistedCard = repository.getReviewCard(addResult.reviewCardId!)

    expect(addResult.disposition).toBe('created')
    expect(persistedCard).toMatchObject({
      meaning: 'slowly in this sentence',
      grammarPattern: 'Adverbial pacing',
      grammarDetails: 'Neutral register. Describes the reading tempo.',
      romanization: 'cheoncheonhi',
      sentenceContext,
      sentenceTranslation: 'Even today, I read slowly.',
    })

    database.close()
  })
})