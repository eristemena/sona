import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { SqliteContentLibraryRepository } from '../../packages/data/src/sqlite/content-library-repository.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'

const tempDirectories: string[] = []

afterEach(() => {
  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop()!, { force: true, recursive: true })
  }
})

function createTestDatabase() {
  const directory = mkdtempSync(path.join(tmpdir(), 'sona-reading-schema-'))
  tempDirectories.push(directory)

  const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
  runShellMigrations(database)

  return database
}

describe('reading sync schema contract', () => {
  it('creates the synced-reading tables and applies the reading migration', () => {
    const database = createTestDatabase()

    const tableNames = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>

    const appliedMigrations = database
      .prepare('SELECT version, name FROM schema_migrations ORDER BY version ASC')
      .all() as Array<{ version: number; name: string }>

    expect(tableNames.map((row) => row.name)).toEqual(
      expect.arrayContaining([
        'block_audio_assets',
        'annotations',
        'reading_progress',
        'exposure_log',
        'review_cards',
      ]),
    )

    expect(appliedMigrations).toEqual(
      expect.arrayContaining([{ version: 3, name: '003_sync_reading_audio_v1' }]),
    )
  })

  it('persists reading progress and idempotent exposure batches locally', async () => {
    const { buildContentBlockId, buildContentItemId, normalizeSearchText, toDifficultyBadge } = await import(
      '../../packages/domain/src/content/index.js'
    )

    const database = createTestDatabase()
    const repository = new SqliteContentLibraryRepository(database)
    const createdAt = 1_713_571_200_000
    const sourceLocator = '/fixtures/sample.srt'
    const contentItemId = buildContentItemId({ sourceType: 'srt', sourceLocator, createdAt })
    const blockId = buildContentBlockId({
      sourceType: 'srt',
      sourceLocator,
      contentItemCreatedAt: createdAt,
      sentenceOrdinal: 1,
    })

    repository.saveContent({
      item: {
        id: contentItemId,
        title: 'Sample Drama Lines',
        sourceType: 'srt',
        difficulty: 2,
        difficultyLabel: toDifficultyBadge(2),
        provenanceLabel: 'Subtitle import',
        sourceLocator,
        provenanceDetail: sourceLocator,
        searchText: normalizeSearchText('Sample Drama Lines 안녕하세요'),
        duplicateCheckText: normalizeSearchText('안녕하세요'),
        createdAt,
      },
      blocks: [
        {
          id: blockId,
          contentItemId,
          korean: '안녕하세요',
          romanization: 'annyeonghaseyo',
          tokens: [{ surface: '안녕하세요', normalized: '안녕하세요' }],
          annotations: {},
          difficulty: 2,
          sourceType: 'srt',
          audioOffset: 1.25,
          sentenceOrdinal: 1,
          createdAt,
        },
      ],
      sourceRecord: {
        contentItemId,
        originMode: 'file-import',
        filePath: sourceLocator,
        url: null,
        sessionId: null,
        displaySource: sourceLocator,
        requestedDifficulty: null,
        validatedDifficulty: null,
        capturedAt: createdAt,
      },
    })

    repository.saveReadingProgress({
      contentItemId,
      activeBlockId: blockId,
      playbackState: 'paused',
      playbackRate: 1,
      currentTimeMs: 900,
      highlightedTokenIndex: 0,
    })

    const firstWritten = repository.flushExposureLog([
      { blockId, token: '안녕하세요', seenAt: createdAt },
      { blockId, token: '안녕하세요', seenAt: createdAt },
    ])

    const session = repository.getReadingSession(contentItemId)
    const exposureRows = database.prepare('SELECT block_id, token, seen_at FROM exposure_log').all() as Array<{
      block_id: string
      token: string
      seen_at: number
    }>

    expect(session?.progress).toMatchObject({
      activeBlockId: blockId,
      playbackState: 'paused',
      currentTimeMs: 900,
      highlightedTokenIndex: 0,
    })
    expect(firstWritten).toBe(1)
    expect(exposureRows).toEqual([{ block_id: blockId, token: '안녕하세요', seen_at: createdAt }])
  })
})