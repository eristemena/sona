import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { SqliteContentLibraryRepository } from '../../packages/data/src/sqlite/content-library-repository.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'
import { runReadingExposureFlush } from '../../packages/data/src/sqlite/workloads/reading-exposure-flush.js'
import { buildContentBlockId, buildContentItemId, normalizeSearchText, toDifficultyBadge } from '../../packages/domain/src/content/index.js'

const tempDirectories: string[] = []

afterEach(() => {
  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop()!, { force: true, recursive: true })
  }
})

describe('exposure log batching integration', () => {
  it('flushes passive exposures in one deduped batch and stays idempotent on repeat flushes', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sona-exposure-log-batching-'))
    tempDirectories.push(directory)

    const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)

    const createdAt = 1_714_200_000_000
    const sourceLocator = 'article://exposure-log-batching'
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
        title: 'Exposure log batching',
        sourceType: 'article',
        difficulty: 1,
        difficultyLabel: toDifficultyBadge(1),
        provenanceLabel: 'Article paste',
        sourceLocator,
        provenanceDetail: 'Used for exposure flush validation.',
        searchText: normalizeSearchText('Exposure log batching 안녕하세요 천천히'),
        duplicateCheckText: normalizeSearchText('안녕하세요 천천히'),
        createdAt,
      },
      blocks: [
        {
          id: blockId,
          contentItemId,
          korean: '안녕하세요 천천히',
          romanization: 'annyeonghaseyo cheoncheonhi',
          tokens: [
            { surface: '안녕하세요', normalized: '안녕하세요' },
            { surface: '천천히', normalized: '천천히' },
          ],
          annotations: {},
          difficulty: 1,
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

    const entries = [
      { blockId, token: '안녕하세요', seenAt: createdAt + 10 },
      { blockId, token: '안녕하세요', seenAt: createdAt + 10 },
      { blockId, token: '천천히', seenAt: createdAt + 20 },
      { blockId, token: '   ', seenAt: createdAt + 30 },
    ]

    const firstWritten = runReadingExposureFlush(repository, entries)
    const secondWritten = runReadingExposureFlush(repository, entries)
    const rows = database
      .prepare('SELECT block_id, token, seen_at FROM exposure_log ORDER BY seen_at ASC')
      .all() as Array<{ block_id: string; token: string; seen_at: number }>

    expect(firstWritten).toBe(2)
    expect(secondWritten).toBe(0)
    expect(rows).toEqual([
      { block_id: blockId, token: '안녕하세요', seen_at: createdAt + 10 },
      { block_id: blockId, token: '천천히', seen_at: createdAt + 20 },
    ])

    database.close()
  })
})