import { describe, expect, it } from 'vitest'

import { DailyReviewService } from '../../apps/desktop/src/main/content/daily-review-service.js'
import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { SqliteContentLibraryRepository } from '../../packages/data/src/sqlite/content-library-repository.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'
import { SqliteSettingsRepository } from '../../packages/data/src/sqlite/settings-repository.js'
import type { ReviewCardRecord } from '../../packages/domain/src/content/review-card.js'

function seedContentItem(
  repository: SqliteContentLibraryRepository,
  input: { id: string; title: string; provenanceLabel: string; createdAt: number },
) {
  repository.saveContent({
    item: {
      id: input.id,
      title: input.title,
      sourceType: 'article',
      difficulty: 1,
      difficultyLabel: 'Beginner',
      provenanceLabel: input.provenanceLabel,
      sourceLocator: `seed://${input.id}`,
      provenanceDetail: `${input.title} was seeded for dashboard integration coverage.`,
      searchText: `${input.title} dashboard seed`,
      duplicateCheckText: input.title,
      createdAt: input.createdAt,
    },
    blocks: [
      {
        id: `${input.id}-block-1`,
        contentItemId: input.id,
        korean: `${input.title} block`,
        romanization: null,
        tokens: null,
        annotations: {},
        difficulty: 1,
        sourceType: 'article',
        audioOffset: null,
        sentenceOrdinal: 1,
        createdAt: input.createdAt,
      },
    ],
    sourceRecord: {
      contentItemId: input.id,
      originMode: 'article-paste',
      filePath: null,
      url: null,
      sessionId: `seed-${input.id}`,
      displaySource: `${input.title} dashboard seed`,
      requestedDifficulty: 1,
      validatedDifficulty: 1,
      capturedAt: input.createdAt,
    },
  })
}

function createReviewCardFixture(overrides: Partial<ReviewCardRecord> = {}): ReviewCardRecord {
  const createdAt = overrides.createdAt ?? 1_777_032_000_000

  return {
    id: overrides.id ?? `card-${createdAt}`,
    canonicalForm: '읽어요',
    surface: overrides.surface ?? '읽어요',
    meaning: overrides.meaning ?? 'to read',
    grammarPattern: null,
    grammarDetails: null,
    romanization: null,
    sentenceContext: null,
    sentenceTranslation: null,
    sourceBlockId: overrides.sourceBlockId ?? 'item-newer-block-1',
    sourceContentItemId: overrides.sourceContentItemId ?? 'item-newer',
    sentenceContextHash: overrides.sentenceContextHash ?? `ctx-${createdAt}`,
    fsrsState: 'Review',
    dueAt: overrides.dueAt ?? createdAt - 1_000,
    stability: 2.8,
    difficulty: 4.5,
    elapsedDays: 2,
    scheduledDays: 2,
    reps: 3,
    lapses: 0,
    lastReviewAt: createdAt - 86_400_000,
    activationState: overrides.activationState ?? 'active',
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  }
}

describe('home dashboard resume-reading integration', () => {
  it('aggregates streaks, weekly activity, due cards, and the latest resume context', () => {
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

    seedContentItem(repository, {
      id: 'item-older',
      title: 'Morning Reading',
      provenanceLabel: 'Article paste',
      createdAt: now - 300_000,
    })
    seedContentItem(repository, {
      id: 'item-newer',
      title: 'Evening Reading',
      provenanceLabel: 'Subtitle import',
      createdAt: now - 200_000,
    })

    repository.saveReadingProgress({
      contentItemId: 'item-older',
      activeBlockId: 'item-older-block-1',
      playbackState: 'paused',
      playbackRate: 1,
      currentTimeMs: 4_000,
      highlightedTokenIndex: 1,
    })
    repository.saveReadingProgress({
      contentItemId: 'item-newer',
      activeBlockId: 'item-newer-block-1',
      playbackState: 'playing',
      playbackRate: 1,
      currentTimeMs: 9_000,
      highlightedTokenIndex: 2,
    })

    database
      .prepare('UPDATE reading_progress SET updated_at = ? WHERE content_item_id = ?')
      .run(now - 20_000, 'item-older')
    database
      .prepare('UPDATE reading_progress SET updated_at = ? WHERE content_item_id = ?')
      .run(now - 5_000, 'item-newer')

    repository.saveReviewCard(
      createReviewCardFixture({
        id: 'card-due',
        surface: '천천히',
        meaning: 'slowly',
        sourceBlockId: 'item-newer-block-1',
        sourceContentItemId: 'item-newer',
        createdAt: now - 100_000,
        dueAt: now - 60_000,
      }),
    )
    repository.saveReviewCard(
      createReviewCardFixture({
        id: 'card-future',
        surface: '서둘러',
        meaning: 'hurry up',
        sourceBlockId: 'item-older-block-1',
        sourceContentItemId: 'item-older',
        createdAt: now - 90_000,
        dueAt: now + 3_600_000,
      }),
    )
    repository.saveReviewCard(
      createReviewCardFixture({
        id: 'card-inactive',
        surface: '기다려요',
        meaning: 'please wait',
        sourceBlockId: 'item-older-block-1',
        sourceContentItemId: 'item-older',
        createdAt: now - 80_000,
        dueAt: now - 60_000,
        activationState: 'deferred',
      }),
    )

    settingsRepository.setDailyStudyGoal(24)

    repository.recordStudySession({
      id: 'study-today-a',
      startedAt: now - 40 * 60_000,
      endedAt: now - 32 * 60_000,
      cardsReviewed: 4,
      minutesStudied: 8,
      source: 'review-session',
    })
    repository.recordStudySession({
      id: 'study-today-b',
      startedAt: now - 18 * 60_000,
      endedAt: now - 10 * 60_000,
      cardsReviewed: 3,
      minutesStudied: 6,
      source: 'review-session',
    })
    repository.recordStudySession({
      id: 'study-yesterday',
      startedAt: now - 24 * 60 * 60_000 - 20 * 60_000,
      endedAt: now - 24 * 60 * 60_000 - 10 * 60_000,
      cardsReviewed: 5,
      minutesStudied: 11,
      source: 'review-session',
    })
    repository.recordStudySession({
      id: 'study-two-days-ago',
      startedAt: now - 48 * 60 * 60_000 - 25 * 60_000,
      endedAt: now - 48 * 60 * 60_000 - 15 * 60_000,
      cardsReviewed: 2,
      minutesStudied: 5,
      source: 'review-session',
    })
    repository.recordStudySession({
      id: 'study-four-days-ago',
      startedAt: now - 96 * 60 * 60_000 - 25 * 60_000,
      endedAt: now - 96 * 60 * 60_000 - 15 * 60_000,
      cardsReviewed: 6,
      minutesStudied: 13,
      source: 'review-session',
    })

    const snapshot = service.getHomeDashboard()

    expect(snapshot.todayDueCount).toBe(1)
    expect(snapshot.dailyGoal).toBe(24)
    expect(snapshot.streakDays).toBe(3)
    expect(snapshot.resumeContext).toEqual({
      contentItemId: 'item-newer',
      title: 'Evening Reading',
      provenanceLabel: 'Subtitle import',
      activeBlockId: 'item-newer-block-1',
      updatedAt: now - 5_000,
    })
    expect(snapshot.recentVocabulary.map((item) => item.surface)).toEqual([
      '기다려요',
      '서둘러',
      '천천히',
    ])
    expect(snapshot.weeklyActivity).toHaveLength(7)
    expect(snapshot.weeklyActivity.find((point) => point.date === '2026-04-24')).toEqual({
      date: '2026-04-24',
      cardsReviewed: 7,
      minutesStudied: 14,
      isToday: true,
    })
    expect(snapshot.weeklyActivity.find((point) => point.date === '2026-04-23')).toEqual({
      date: '2026-04-23',
      cardsReviewed: 5,
      minutesStudied: 11,
      isToday: false,
    })
    expect(snapshot.weeklyActivity.find((point) => point.date === '2026-04-20')).toEqual({
      date: '2026-04-20',
      cardsReviewed: 6,
      minutesStudied: 13,
      isToday: false,
    })

    database.close()
  })
})