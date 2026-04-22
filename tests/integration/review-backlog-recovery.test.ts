import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { DailyReviewService } from '../../apps/desktop/src/main/content/daily-review-service.js'
import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { SqliteContentLibraryRepository } from '../../packages/data/src/sqlite/content-library-repository.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'
import type { ReviewCardActivationState, ReviewCardRecord } from '../../packages/domain/src/content/review-card.js'

const tempDirectories: string[] = []

afterEach(() => {
  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop()!, { force: true, recursive: true })
  }
})

function createRepository() {
  const directory = mkdtempSync(path.join(tmpdir(), 'sona-review-backlog-'))
  tempDirectories.push(directory)

  const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
  runShellMigrations(database)
  return new SqliteContentLibraryRepository(database)
}

function createReviewCardFixture(
  index: number,
  now: number,
  overrides: Partial<ReviewCardRecord> = {},
): ReviewCardRecord {
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
    sourceContentItemId: `item-${index + 1}`,
    sentenceContextHash: `ctx-${index + 1}`,
    fsrsState: 'Review',
    dueAt: now - (80 - index) * 1000,
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
    ...overrides,
  }
}

function seedReviewSource(repository: SqliteContentLibraryRepository, index: number, now: number) {
  const contentItemId = `item-${index + 1}`
  const blockId = `block-${index + 1}`

  repository.saveContent({
    item: {
      id: contentItemId,
      title: `Review backlog item ${index + 1}`,
      sourceType: 'article',
      difficulty: 1,
      difficultyLabel: 'Beginner',
      provenanceLabel: 'Article paste',
      sourceLocator: `seed://review-backlog-${index + 1}`,
      provenanceDetail: 'Seeded for backlog recovery coverage.',
      searchText: `review backlog item ${index + 1}`,
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
      sessionId: `seed-review-backlog-${index + 1}`,
      displaySource: 'Seeded for backlog recovery coverage.',
      requestedDifficulty: 1,
      validatedDifficulty: 1,
      capturedAt: now - (index + 1) * 1000,
    },
  })
}

describe('review backlog recovery', () => {
  it('surfaces the remaining overdue cards in the next bounded session after part of a larger backlog is reviewed', () => {
    const now = 1_716_720_000_000
    const repository = createRepository()

    for (let index = 0; index < 80; index += 1) {
      seedReviewSource(repository, index, now)
      repository.saveReviewCard(createReviewCardFixture(index, now))
    }

    const service = new DailyReviewService({ repository, now: () => now })
    const firstQueue = service.getQueue()

    expect(firstQueue.dueCount).toBe(80)
    expect(firstQueue.cards).toHaveLength(50)
    expect(firstQueue.cards[0]?.front.id).toBe('card-1')
    expect(firstQueue.cards.at(-1)?.front.id).toBe('card-50')

    for (let index = 0; index < 30; index += 1) {
      service.submitRating({ reviewCardId: `card-${index + 1}`, rating: 'good' })
    }

    const recoveryQueue = service.getQueue()

    expect(recoveryQueue.dueCount).toBe(50)
    expect(recoveryQueue.cards).toHaveLength(50)
    expect(recoveryQueue.cards[0]?.front.id).toBe('card-31')
    expect(recoveryQueue.cards.at(-1)?.front.id).toBe('card-80')
  })
})