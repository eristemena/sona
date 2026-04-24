import { describe, expect, it } from 'vitest'

import { DailyReviewService } from '../../apps/desktop/src/main/content/daily-review-service.js'
import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { SqliteContentLibraryRepository } from '../../packages/data/src/sqlite/content-library-repository.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'
import { SqliteSettingsRepository } from '../../packages/data/src/sqlite/settings-repository.js'
import type { ReviewCardRecord } from '../../packages/domain/src/content/review-card.js'

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
      provenanceDetail: 'Seeded for study-session writeback coverage.',
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
      sessionId: 'seed-study-session',
      displaySource: 'Seeded for study-session writeback coverage.',
      requestedDifficulty: 1,
      validatedDifficulty: 1,
      capturedAt: createdAt,
    },
  })
}

function createReviewCardFixture(overrides: Partial<ReviewCardRecord> = {}): ReviewCardRecord {
  const createdAt = overrides.createdAt ?? 1_777_032_000_000

  return {
    id: 'card-1',
    canonicalForm: '읽어요',
    surface: '읽어요',
    meaning: 'to read',
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

describe('study session writeback integration', () => {
  it('writes one study_sessions row when the final review submission completes a session', () => {
    const now = Date.UTC(2026, 3, 24, 12, 0, 0)
    const database = createSqliteConnection({ databasePath: ':memory:' })
    runShellMigrations(database)

    const repository = new SqliteContentLibraryRepository(database)
    const settingsRepository = new SqliteSettingsRepository(database)
    const service = new DailyReviewService({
      repository,
      settingsRepository,
      now: () => now,
    })

    seedReviewSource(repository, now - 200_000)
    repository.saveReviewCard(
      createReviewCardFixture({
        createdAt: now - 200_000,
        updatedAt: now - 200_000,
        lastReviewAt: now - 86_400_000,
      }),
    )

    const result = service.submitRating({
      reviewCardId: 'card-1',
      rating: 'good',
      sessionCompletion: {
        startedAt: now - 11 * 60_000,
        cardsReviewed: 5,
      },
    })

    const rows = database
      .prepare(
        'SELECT study_date, cards_reviewed, minutes_studied, source, ended_at FROM study_sessions ORDER BY ended_at ASC',
      )
      .all() as Array<{
      study_date: string
      cards_reviewed: number
      minutes_studied: number
      source: string
      ended_at: number
    }>

    expect(result.reviewedAt).toBe(now)
    expect(rows).toEqual([
      {
        study_date: '2026-04-24',
        cards_reviewed: 5,
        minutes_studied: 11,
        source: 'review-session',
        ended_at: now,
      },
    ])

    database.close()
  })
})