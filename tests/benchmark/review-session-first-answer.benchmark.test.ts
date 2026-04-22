import { performance } from 'node:perf_hooks'
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
  const directory = mkdtempSync(path.join(tmpdir(), 'sona-review-first-answer-benchmark-'))
  tempDirectories.push(directory)

  const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
  runShellMigrations(database)
  return { database, repository: new SqliteContentLibraryRepository(database) }
}

function createReviewCardFixture(index: number, now: number): ReviewCardRecord {
  return {
    id: `card-${index + 1}`,
    canonicalForm: `단어 ${index + 1}`,
    surface: `단어 ${index + 1}`,
    meaning: `meaning ${index + 1}`,
    grammarPattern: null,
    grammarDetails: null,
    romanization: null,
    sentenceContext: `단어 ${index + 1} 예문`,
    sentenceTranslation: null,
    sourceBlockId: `block-${index + 1}`,
    sourceContentItemId: `item-${index + 1}`,
    sentenceContextHash: `ctx-${index + 1}`,
    fsrsState: 'Review',
    dueAt: now - (20 - index) * 1000,
    stability: 2.5,
    difficulty: 4.3,
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
      title: `Review benchmark item ${index + 1}`,
      sourceType: 'article',
      difficulty: 1,
      difficultyLabel: 'Beginner',
      provenanceLabel: 'Article paste',
      sourceLocator: `seed://review-benchmark-${index + 1}`,
      provenanceDetail: 'Seeded for review first-answer benchmark coverage.',
      searchText: `review benchmark item ${index + 1}`,
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
      sessionId: `seed-review-benchmark-${index + 1}`,
      displaySource: 'Seeded for review first-answer benchmark coverage.',
      requestedDifficulty: 1,
      validatedDifficulty: 1,
      capturedAt: now - (index + 1) * 1000,
    },
  })
}

describe('review session first answer benchmark', () => {
  it('keeps the first due-card answer path under the 30-second acceptance budget', () => {
    const now = 1_716_730_000_000
    const { database, repository } = createRepository()

    for (let index = 0; index < 20; index += 1) {
      seedReviewSource(repository, index, now)
      repository.saveReviewCard(createReviewCardFixture(index, now))
    }

    const service = new DailyReviewService({ repository, now: () => now })

    const startedAt = performance.now()
    const queue = service.getQueue()
    const firstCardId = queue.cards[0]?.front.id
    if (!firstCardId) {
      throw new Error('Expected at least one due review card for the first-answer benchmark.')
    }
    const result = service.submitRating({ reviewCardId: firstCardId, rating: 'good' })
    const elapsedMs = performance.now() - startedAt

    expect(queue.cards).toHaveLength(20)
    expect(result.reviewCardId).toBe(firstCardId)
    expect(elapsedMs).toBeLessThan(30_000)

    database.close()
  })
})