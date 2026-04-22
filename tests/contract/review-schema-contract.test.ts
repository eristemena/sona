import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

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

function createTestDatabase() {
  const directory = mkdtempSync(path.join(tmpdir(), 'sona-review-schema-'))
  tempDirectories.push(directory)

  const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
  runShellMigrations(database)

  return database
}

function createReviewCardFixture(overrides: Partial<ReviewCardRecord> = {}): ReviewCardRecord {
  const createdAt = overrides.createdAt ?? 1_716_400_000_000

  return {
    id: 'card-1',
    canonicalForm: '천천히',
    surface: '천천히',
    meaning: 'slowly',
    grammarPattern: 'Adverbial pacing',
    grammarDetails: 'Softens the reading tempo.',
    romanization: 'cheoncheonhi',
    sentenceContext: '오늘도 천천히 읽어요',
    sentenceTranslation: 'Even today, I read slowly.',
    sourceBlockId: 'block-1',
    sourceContentItemId: 'item-1',
    sentenceContextHash: 'ctx-1',
    fsrsState: 'New',
    dueAt: createdAt - 1000,
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    lastReviewAt: null,
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
      provenanceDetail: 'Seeded for review-card contract coverage.',
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
      sessionId: 'seed-review-schema',
      displaySource: 'Seeded for review-card contract coverage.',
      requestedDifficulty: 1,
      validatedDifficulty: 1,
      capturedAt: createdAt,
    },
  })
}

describe('review schema contract', () => {
  it('creates review, review history, and known-word tables and applies the review migration', () => {
    const database = createTestDatabase()

    const tableNames = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>

    const appliedMigrations = database
      .prepare('SELECT version, name FROM schema_migrations ORDER BY version ASC')
      .all() as Array<{ version: number; name: string }>

    expect(tableNames.map((row) => row.name)).toEqual(
      expect.arrayContaining(['review_cards', 'review_events', 'known_words']),
    )

    expect(appliedMigrations).toEqual(
      expect.arrayContaining([{ version: 5, name: '005_daily_vocabulary_review_v1' }]),
    )
  })

  it('persists editable review-card details, review events, and known-word records locally', () => {
    const database = createTestDatabase()
    const repository = new SqliteContentLibraryRepository(database)
    const createdAt = 1_716_400_000_000
    seedReviewSource(repository, createdAt)
    const card = createReviewCardFixture({ createdAt, dueAt: createdAt - 1000, updatedAt: createdAt })

    repository.saveReviewCard(card)
    repository.saveReviewEvent({
      id: 'event-1',
      reviewCardId: card.id,
      rating: 'good',
      fsrsGrade: 3,
      reviewedAt: createdAt,
      previousState: 'New',
      nextState: 'Learning',
      previousDueAt: card.dueAt,
      nextDueAt: createdAt + 86_400_000,
      scheduledDays: 1,
    })
    repository.saveKnownWord({
      canonicalForm: '이미',
      surface: '이미',
      source: 'manual',
      sourceDetail: 'Seeded manually for review suppression.',
      createdAt,
      updatedAt: createdAt,
    })

    const storedCard = repository.getReviewCard(card.id)
    const historyRows = database
      .prepare('SELECT review_card_id, rating, fsrs_grade FROM review_events ORDER BY reviewed_at ASC')
      .all() as Array<{ review_card_id: string; rating: string; fsrs_grade: number }>
    const knownWordRows = database
      .prepare('SELECT canonical_form, source FROM known_words ORDER BY canonical_form ASC')
      .all() as Array<{ canonical_form: string; source: string }>

    expect(storedCard).toMatchObject({
      id: 'card-1',
      meaning: 'slowly',
      grammarPattern: 'Adverbial pacing',
      grammarDetails: 'Softens the reading tempo.',
      sentenceContext: '오늘도 천천히 읽어요',
      sentenceTranslation: 'Even today, I read slowly.',
    })
    expect(historyRows).toEqual([{ review_card_id: 'card-1', rating: 'good', fsrs_grade: 3 }])
    expect(knownWordRows).toEqual([{ canonical_form: '이미', source: 'manual' }])
  })
})