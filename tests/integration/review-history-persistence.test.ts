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
  const directory = mkdtempSync(path.join(tmpdir(), 'sona-review-history-'))
  tempDirectories.push(directory)
  return path.join(directory, 'sona.db')
}

function createReviewCardFixture(overrides: Partial<ReviewCardRecord> = {}): ReviewCardRecord {
  const createdAt = overrides.createdAt ?? 1_716_510_000_000

  return {
    id: 'card-1',
    canonicalForm: '읽어요',
    surface: '읽어요',
    meaning: null,
    grammarPattern: null,
    grammarDetails: null,
    romanization: null,
    sentenceContext: null,
    sentenceTranslation: null,
    sourceBlockId: 'block-1',
    sourceContentItemId: 'item-1',
    sentenceContextHash: 'ctx-1',
    fsrsState: 'Review',
    dueAt: createdAt - 1_000,
    stability: 2.8,
    difficulty: 4.5,
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
      title: 'Review seed item',
      sourceType: 'article',
      difficulty: 1,
      difficultyLabel: 'Beginner',
      provenanceLabel: 'Article paste',
      sourceLocator: 'seed://review-item',
      provenanceDetail: 'Seeded for review-history persistence coverage.',
      searchText: 'review seed item 읽어요',
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
      sessionId: 'seed-review-history',
      displaySource: 'Seeded for review-history persistence coverage.',
      requestedDifficulty: 1,
      validatedDifficulty: 1,
      capturedAt: createdAt,
    },
  })
}

describe('review history persistence', () => {
  it('persists a review event row alongside the updated review card across reopen', () => {
    const now = 1_716_510_000_000
    const databasePath = createDatabasePath()

    const database = createSqliteConnection({ databasePath })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)
    seedReviewSource(repository, now - 200_000)
    const card = createReviewCardFixture({ createdAt: now - 200_000, updatedAt: now - 200_000, lastReviewAt: now - 86_400_000 })
    repository.saveReviewCard(card)

    const service = new DailyReviewService({ repository, now: () => now })
    service.submitRating({ reviewCardId: card.id, rating: 'easy' })
    database.close()

    const reopenedDatabase = createSqliteConnection({ databasePath })
    const reopenedRepository = new SqliteContentLibraryRepository(reopenedDatabase)
    const reopenedCard = reopenedRepository.getReviewCard(card.id)
    const historyRows = reopenedDatabase
      .prepare('SELECT review_card_id, rating, fsrs_grade, reviewed_at FROM review_events ORDER BY reviewed_at ASC')
      .all() as Array<{ review_card_id: string; rating: string; fsrs_grade: number; reviewed_at: number }>

    expect(reopenedCard?.dueAt).toBeGreaterThan(now)
    expect(reopenedCard?.lastReviewAt).toBe(now)
    expect(historyRows).toEqual([
      {
        review_card_id: 'card-1',
        rating: 'easy',
        fsrs_grade: 4,
        reviewed_at: now,
      },
    ])

    reopenedDatabase.close()
  })
})