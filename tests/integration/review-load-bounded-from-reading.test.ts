import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { ReviewCardService } from '../../apps/desktop/src/main/content/review-card-service.js'
import { hashSentenceContext } from '../../apps/desktop/src/main/content/annotation-cache-service.js'
import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { SqliteContentLibraryRepository } from '../../packages/data/src/sqlite/content-library-repository.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'
import { buildContentBlockId, buildContentItemId, normalizeSearchText, toDifficultyBadge } from '../../packages/domain/src/content/index.js'

const tempDirectories: string[] = []

afterEach(() => {
  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop()!, { force: true, recursive: true })
  }
})

describe('review load bounded from reading integration', () => {
  it('creates one active card, blocks duplicate active work, and defers over-limit additions while preserving provenance', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sona-review-load-bounded-'))
    tempDirectories.push(directory)

    const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)

    const createdAt = 1_714_100_000_000
    const sourceLocator = 'article://review-load-bounded'
    const contentItemId = buildContentItemId({ sourceType: 'article', sourceLocator, createdAt })
    const blockId = buildContentBlockId({
      sourceType: 'article',
      sourceLocator,
      contentItemCreatedAt: createdAt,
      sentenceOrdinal: 1,
    })

    repository.saveContent({
      item: {
        id: contentItemId,
        title: 'Review load bounded',
        sourceType: 'article',
        difficulty: 2,
        difficultyLabel: toDifficultyBadge(2),
        provenanceLabel: 'Article paste',
        sourceLocator,
        provenanceDetail: 'Used for pacing validation.',
        searchText: normalizeSearchText('Review load bounded 오늘도 천천히 읽어요'),
        duplicateCheckText: normalizeSearchText('오늘도 천천히 읽어요'),
        createdAt,
      },
      blocks: [
        {
          id: blockId,
          contentItemId,
          korean: '오늘도 천천히 읽어요',
          romanization: 'oneuldo cheoncheonhi ilg-eoyo',
          tokens: [
            { surface: '오늘도', normalized: '오늘도' },
            { surface: '천천히', normalized: '천천히' },
            { surface: '읽어요', normalized: '읽다' },
          ],
          annotations: {},
          difficulty: 2,
          sourceType: 'article',
          audioOffset: null,
          sentenceOrdinal: 1,
          createdAt,
        },
      ],
      sourceRecord: {
        contentItemId,
        originMode: 'article-paste',
        filePath: null,
        url: sourceLocator,
        sessionId: null,
        displaySource: 'Article paste',
        requestedDifficulty: null,
        validatedDifficulty: null,
        capturedAt: createdAt,
      },
    })

    const service = new ReviewCardService({
      repository,
      now: () => createdAt + 500,
      activeNewCardLimit: 1,
    })

    const firstResult = service.addToDeck({
      blockId,
      token: '천천히',
      canonicalForm: '천천히',
      sentenceContext: '오늘도 천천히 읽어요',
    })
    const duplicateResult = service.addToDeck({
      blockId,
      token: '천천히',
      canonicalForm: '천천히',
      sentenceContext: '오늘도 천천히 읽어요',
    })
    const deferredResult = service.addToDeck({
      blockId,
      token: '읽어요',
      canonicalForm: '읽다',
      sentenceContext: '오늘도 천천히 읽어요',
    })

    const reviewCards = database
      .prepare(
        `
          SELECT canonical_form, source_block_id, source_content_item_id, sentence_context_hash, fsrs_state, activation_state
          FROM review_cards
          ORDER BY created_at ASC
        `,
      )
      .all() as Array<{
        canonical_form: string
        source_block_id: string
        source_content_item_id: string
        sentence_context_hash: string
        fsrs_state: string
        activation_state: string
      }>

    expect(firstResult.disposition).toBe('created')
    expect(duplicateResult.disposition).toBe('duplicate-blocked')
    expect(deferredResult.disposition).toBe('deferred')
    expect(reviewCards).toEqual([
      {
        canonical_form: '천천히',
        source_block_id: blockId,
        source_content_item_id: contentItemId,
        sentence_context_hash: hashSentenceContext('오늘도 천천히 읽어요'),
        fsrs_state: 'New',
        activation_state: 'active',
      },
      {
        canonical_form: '읽다',
        source_block_id: blockId,
        source_content_item_id: contentItemId,
        sentence_context_hash: hashSentenceContext('오늘도 천천히 읽어요'),
        fsrs_state: 'New',
        activation_state: 'deferred',
      },
    ])

    database.close()
  })
})