import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { DailyReviewService } from '../../apps/desktop/src/main/content/daily-review-service.js'
import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { SqliteContentLibraryRepository } from '../../packages/data/src/sqlite/content-library-repository.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'
import type { ReviewCardRecord } from '../../packages/domain/src/content/review-card.js'

const tempDirectories: string[] = []

afterEach(() => {
  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop()!, { force: true, recursive: true })
  }
})

function createReviewCardFixture(overrides: Partial<ReviewCardRecord> = {}): ReviewCardRecord {
  const createdAt = overrides.createdAt ?? 1_716_640_000_000

  return {
    id: 'card-1',
    canonicalForm: '천천히',
    surface: '천천히',
    meaning: null,
    grammarPattern: null,
    grammarDetails: null,
    romanization: 'cheoncheonhi',
    sentenceContext: '오늘도 천천히 읽어요',
    sentenceTranslation: null,
    sourceBlockId: 'block-1',
    sourceContentItemId: 'item-1',
    sentenceContextHash: 'ctx-1',
    fsrsState: 'Review',
    dueAt: createdAt - 1_000,
    stability: 2.5,
    difficulty: 4.2,
    elapsedDays: 2,
    scheduledDays: 2,
    reps: 3,
    lapses: 0,
    lastReviewAt: createdAt - 86_400_000,
    activationState: 'active',
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  }
}

function seedReviewSource(repository: SqliteContentLibraryRepository, createdAt: number) {
  repository.saveContent({
    item: {
      id: 'item-1',
      title: 'Review detail edit persistence seed',
      sourceType: 'article',
      difficulty: 1,
      difficultyLabel: 'Beginner',
      provenanceLabel: 'Article paste',
      sourceLocator: 'seed://review-detail-edit',
      provenanceDetail: 'Seeded for detail edit persistence coverage.',
      searchText: 'review detail edit persistence 천천히',
      duplicateCheckText: '천천히',
      createdAt,
    },
    blocks: [
      {
        id: 'block-1',
        contentItemId: 'item-1',
        korean: '오늘도 천천히 읽어요',
        romanization: null,
        tokens: null,
        annotations: {},
        difficulty: 1,
        sourceType: 'article',
        audioOffset: null,
        sentenceOrdinal: 1,
        createdAt,
      },
    ],
    sourceRecord: {
      contentItemId: 'item-1',
      originMode: 'article-paste',
      filePath: null,
      url: null,
      sessionId: 'seed-review-detail-edit',
      displaySource: 'Seeded for detail edit persistence coverage.',
      requestedDifficulty: 1,
      validatedDifficulty: 1,
      capturedAt: createdAt,
    },
  })
}

describe('review card detail edit persistence', () => {
  it('persists updated meaning and grammar detail fields across reopen', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sona-review-card-detail-edit-persistence-'))
    tempDirectories.push(directory)

    const databasePath = path.join(directory, 'sona.db')
    const database = createSqliteConnection({ databasePath })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)
    const createdAt = 1_716_640_000_000

    seedReviewSource(repository, createdAt)
    repository.saveReviewCard(createReviewCardFixture({ createdAt }))

    const service = new DailyReviewService({
      repository,
      now: () => createdAt + 4_000,
    })

    const result = service.updateCardDetails({
      reviewCardId: 'card-1',
      meaning: 'slowly in this sentence',
      grammarPattern: 'Adverbial pacing',
      grammarDetails: 'Neutral register. Describes the reading tempo.',
    })

    database.close()

    const reopenedDatabase = createSqliteConnection({ databasePath })
    const reopenedRepository = new SqliteContentLibraryRepository(reopenedDatabase)
    const persistedCard = reopenedRepository.getReviewCard('card-1')

    expect(result.updatedAt).toBe(createdAt + 4_000)
    expect(persistedCard).toMatchObject({
      meaning: 'slowly in this sentence',
      grammarPattern: 'Adverbial pacing',
      grammarDetails: 'Neutral register. Describes the reading tempo.',
      updatedAt: createdAt + 4_000,
    })

    reopenedDatabase.close()
  })
})