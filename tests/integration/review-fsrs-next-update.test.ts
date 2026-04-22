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

function createRepository() {
  const directory = mkdtempSync(path.join(tmpdir(), 'sona-review-fsrs-'))
  tempDirectories.push(directory)

  const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
  runShellMigrations(database)
  return new SqliteContentLibraryRepository(database)
}

function createReviewCardFixture(overrides: Partial<ReviewCardRecord> = {}): ReviewCardRecord {
  const createdAt = overrides.createdAt ?? 1_716_500_000_000

  return {
    id: 'card-1',
    canonicalForm: '천천히',
    surface: '천천히',
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
    stability: 3.1,
    difficulty: 4.2,
    elapsedDays: 3,
    scheduledDays: 2,
    reps: 4,
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
      provenanceDetail: 'Seeded for FSRS review coverage.',
      searchText: 'review seed item 천천히',
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
      sessionId: 'seed-review-fsrs',
      displaySource: 'Seeded for FSRS review coverage.',
      requestedDifficulty: 1,
      validatedDifficulty: 1,
      capturedAt: createdAt,
    },
  })
}

describe('review fsrs next update', () => {
  it('updates the due card schedule after a learner submits a rating', () => {
    const now = 1_716_500_000_000
    const repository = createRepository()
    seedReviewSource(repository, now - 86_400_000)
    const card = createReviewCardFixture({ createdAt: now - 86_400_000, updatedAt: now - 86_400_000, lastReviewAt: now - 86_400_000 })
    repository.saveReviewCard(card)

    const service = new DailyReviewService({ repository, now: () => now })
    const result = service.submitRating({ reviewCardId: card.id, rating: 'good' })
    const storedCard = repository.getReviewCard(card.id)

    expect(result.reviewCardId).toBe(card.id)
    expect(result.fsrsGrade).toBe(3)
    expect(result.nextDueAt).toBeGreaterThan(now)
    expect(result.scheduledDays).toBeGreaterThan(0)
    expect(storedCard?.dueAt).toBe(result.nextDueAt)
    expect(storedCard?.lastReviewAt).toBe(now)
    expect(storedCard?.updatedAt).toBe(now)
  })
})