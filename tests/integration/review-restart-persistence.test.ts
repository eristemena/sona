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
  const directory = mkdtempSync(path.join(tmpdir(), 'sona-review-restart-'))
  tempDirectories.push(directory)
  return path.join(directory, 'sona.db')
}

function createReviewCardFixture(overrides: Partial<ReviewCardRecord> = {}): ReviewCardRecord {
  const createdAt = overrides.createdAt ?? 1_716_710_000_000

  return {
    id: 'card-1',
    canonicalForm: '읽어요',
    surface: '읽어요',
    meaning: 'to read',
    grammarPattern: 'Present polite',
    grammarDetails: 'Neutral present-tense polite ending.',
    romanization: 'ilgeoyo',
    sentenceContext: '오늘도 읽어요',
    sentenceTranslation: 'I read again today.',
    sourceBlockId: 'block-1',
    sourceContentItemId: 'item-1',
    sentenceContextHash: 'ctx-1',
    fsrsState: 'Review',
    dueAt: createdAt - 1_000,
    stability: 2.9,
    difficulty: 4.4,
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
      title: 'Review restart persistence seed',
      sourceType: 'article',
      difficulty: 1,
      difficultyLabel: 'Beginner',
      provenanceLabel: 'Article paste',
      sourceLocator: 'seed://review-restart-persistence',
      provenanceDetail: 'Seeded for restart persistence coverage.',
      searchText: 'review restart persistence 읽어요',
      duplicateCheckText: '읽어요',
      createdAt,
    },
    blocks: [
      {
        id: 'block-1',
        contentItemId: 'item-1',
        korean: '오늘도 읽어요',
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
      sessionId: 'seed-review-restart-persistence',
      displaySource: 'Seeded for restart persistence coverage.',
      requestedDifficulty: 1,
      validatedDifficulty: 1,
      capturedAt: createdAt,
    },
  })
}

describe('review restart persistence', () => {
  it('persists the updated due state so the next session after restart sees the new schedule', () => {
    const initialNow = 1_716_710_000_000
    const reviewNow = initialNow + 20_000
    const afterRestartNow = reviewNow + 10_000
    const databasePath = createDatabasePath()

    const database = createSqliteConnection({ databasePath })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)
    seedReviewSource(repository, initialNow - 15_000)
    repository.saveReviewCard(createReviewCardFixture({ createdAt: initialNow - 15_000, updatedAt: initialNow - 15_000 }))

    const service = new DailyReviewService({ repository, now: () => reviewNow })
    const beforeReviewQueue = service.getQueue()
    expect(beforeReviewQueue.cards).toHaveLength(1)

    const result = service.submitRating({ reviewCardId: 'card-1', rating: 'easy' })
    database.close()

    const reopenedDatabase = createSqliteConnection({ databasePath })
    const reopenedRepository = new SqliteContentLibraryRepository(reopenedDatabase)
    const reopenedService = new DailyReviewService({ repository: reopenedRepository, now: () => afterRestartNow })

    const afterRestartQueue = reopenedService.getQueue()
    const persistedCard = reopenedRepository.getReviewCard('card-1')
    const reviewEvents = reopenedDatabase
      .prepare('SELECT rating, reviewed_at, next_due_at FROM review_events WHERE review_card_id = ?')
      .all('card-1') as Array<{ rating: string; reviewed_at: number; next_due_at: number }>

    expect(result.nextDueAt).toBeGreaterThan(reviewNow)
    expect(afterRestartQueue.cards).toHaveLength(0)
    expect(afterRestartQueue.dueCount).toBe(0)
    expect(persistedCard?.dueAt).toBe(result.nextDueAt)
    expect(persistedCard?.lastReviewAt).toBe(reviewNow)
    expect(reviewEvents).toEqual([
      {
        rating: 'easy',
        reviewed_at: reviewNow,
        next_due_at: result.nextDueAt,
      },
    ])

    reopenedDatabase.close()
  })
})