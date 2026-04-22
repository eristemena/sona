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
  const directory = mkdtempSync(path.join(tmpdir(), 'sona-review-queue-'))
  tempDirectories.push(directory)

  const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
  runShellMigrations(database)
  return new SqliteContentLibraryRepository(database)
}

function createReviewCardFixture(index: number, now: number): ReviewCardRecord {
  return {
    id: `card-${index + 1}`,
    canonicalForm: `단어 ${index + 1}`,
    surface: `단어 ${index + 1}`,
    meaning: null,
    grammarPattern: null,
    grammarDetails: null,
    romanization: null,
    sentenceContext: null,
    sentenceTranslation: null,
    sourceBlockId: `block-${index + 1}`,
    sourceContentItemId: 'item-1',
    sentenceContextHash: `ctx-${index + 1}`,
    fsrsState: 'Review',
    dueAt: now - (55 - index) * 1000,
    stability: 2.5,
    difficulty: 4.5,
    elapsedDays: 2,
    scheduledDays: 2,
    reps: 2,
    lapses: 0,
    lastReviewAt: now - 86_400_000,
    activationState: 'active',
    createdAt: now - (index + 1) * 1000,
    updatedAt: now - (index + 1) * 1000,
  }
}

function seedReviewSource(repository: SqliteContentLibraryRepository, index: number, now: number) {
  const contentItemId = `item-${index + 1}`
  const blockId = `block-${index + 1}`

  repository.saveContent({
    item: {
      id: contentItemId,
      title: `Review seed item ${index + 1}`,
      sourceType: 'article',
      difficulty: 1,
      difficultyLabel: 'Beginner',
      provenanceLabel: 'Article paste',
      sourceLocator: `seed://review-item-${index + 1}`,
      provenanceDetail: 'Seeded for queue ordering coverage.',
      searchText: `review seed item ${index + 1}`,
      duplicateCheckText: `단어 ${index + 1}`,
      createdAt: now - (index + 1) * 1000,
    },
    blocks: [
      {
        id: blockId,
        contentItemId,
        korean: `단어 ${index + 1} 예문`,
        romanization: null,
        tokens: null,
        annotations: {},
        difficulty: 1,
        sourceType: 'article',
        audioOffset: null,
        sentenceOrdinal: 1,
        createdAt: now - (index + 1) * 1000,
      },
    ],
    sourceRecord: {
      contentItemId,
      originMode: 'article-paste',
      filePath: null,
      url: null,
      sessionId: `seed-review-queue-${index + 1}`,
      displaySource: 'Seeded for queue ordering coverage.',
      requestedDifficulty: 1,
      validatedDifficulty: 1,
      capturedAt: now - (index + 1) * 1000,
    },
  })
}

describe('review queue limit and order', () => {
  it('loads the oldest due active cards first and clamps the queue size to fifty', () => {
    const now = 1_716_520_000_000
    const repository = createRepository()

    for (let index = 0; index < 55; index += 1) {
      seedReviewSource(repository, index, now)
      repository.saveReviewCard(createReviewCardFixture(index, now))
    }

    const service = new DailyReviewService({ repository, now: () => now })
    const queue = service.getQueue(999)

    expect(queue.dueCount).toBe(55)
    expect(queue.sessionLimit).toBe(50)
    expect(queue.cards).toHaveLength(50)
    expect(queue.cards[0]?.front.id).toBe('card-1')
    expect(queue.cards[1]?.front.id).toBe('card-2')
    expect(queue.cards.at(-1)?.front.id).toBe('card-50')
  })
})