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

function createDatabasePath() {
  const directory = mkdtempSync(path.join(tmpdir(), 'sona-review-offline-'))
  tempDirectories.push(directory)
  return path.join(directory, 'sona.db')
}

function createReviewCardFixture(overrides: Partial<ReviewCardRecord> = {}): ReviewCardRecord {
  const createdAt = overrides.createdAt ?? 1_716_700_000_000

  return {
    id: 'card-1',
    canonicalForm: '천천히',
    surface: '천천히',
    meaning: 'slowly',
    grammarPattern: 'Adverbial pacing',
    grammarDetails: 'Softens the tempo of the sentence.',
    romanization: 'cheoncheonhi',
    sentenceContext: '오늘도 천천히 읽어요',
    sentenceTranslation: 'Even today, I read slowly.',
    sourceBlockId: 'block-1',
    sourceContentItemId: 'item-1',
    sentenceContextHash: 'ctx-1',
    fsrsState: 'Review',
    dueAt: createdAt - 5_000,
    stability: 3.1,
    difficulty: 4.3,
    elapsedDays: 2,
    scheduledDays: 2,
    reps: 2,
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
      title: 'Offline review continuity seed',
      sourceType: 'article',
      difficulty: 1,
      difficultyLabel: 'Beginner',
      provenanceLabel: 'Article paste',
      sourceLocator: 'seed://review-offline-continuity',
      provenanceDetail: 'Seeded for offline review continuity coverage.',
      searchText: 'offline review continuity 천천히',
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
      sessionId: 'seed-review-offline-continuity',
      displaySource: 'Seeded for offline review continuity coverage.',
      requestedDifficulty: 1,
      validatedDifficulty: 1,
      capturedAt: createdAt,
    },
  })
}

describe('review offline continuity', () => {
  it('loads and rates due cards from local data after the database is reopened', () => {
    const initialNow = 1_716_700_000_000
    const reopenedNow = initialNow + 30_000
    const databasePath = createDatabasePath()

    const database = createSqliteConnection({ databasePath })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)
    seedReviewSource(repository, initialNow - 10_000)
    repository.saveReviewCard(createReviewCardFixture({ createdAt: initialNow - 10_000, updatedAt: initialNow - 10_000 }))
    database.close()

    const reopenedDatabase = createSqliteConnection({ databasePath })
    const reopenedRepository = new SqliteContentLibraryRepository(reopenedDatabase)
    const service = new DailyReviewService({ repository: reopenedRepository, now: () => reopenedNow })

    const queue = service.getQueue()
    expect(queue.dueCount).toBe(1)
    expect(queue.cards).toHaveLength(1)
    expect(queue.cards[0]).toMatchObject({
      front: {
        id: 'card-1',
        surface: '천천히',
        canonicalForm: '천천히',
      },
      back: {
        meaning: 'slowly',
        sentenceContext: '오늘도 천천히 읽어요',
      },
    })

    const result = service.submitRating({ reviewCardId: 'card-1', rating: 'good' })
    const storedCard = reopenedRepository.getReviewCard('card-1')

    expect(result.reviewCardId).toBe('card-1')
    expect(result.reviewedAt).toBe(reopenedNow)
    expect(storedCard?.lastReviewAt).toBe(reopenedNow)
    expect(storedCard?.dueAt).toBeGreaterThan(reopenedNow)

    reopenedDatabase.close()
  })
})