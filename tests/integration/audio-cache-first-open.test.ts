import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { AudioCacheService } from '../../apps/desktop/src/main/content/audio-cache-service.js'
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

describe('audio cache first open integration', () => {
  it('generates block audio on first open, writes the cache file, and persists fallback timings', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sona-reading-audio-first-open-'))
    tempDirectories.push(directory)

    const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)

    const createdAt = 1_713_800_000_000
    const sourceLocator = 'article://audio-first-open'
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
        title: 'Reading audio first open',
        sourceType: 'article',
        difficulty: 2,
        difficultyLabel: toDifficultyBadge(2),
        provenanceLabel: 'Article paste',
        sourceLocator,
        provenanceDetail: 'Imported article for reading audio cache validation.',
        searchText: normalizeSearchText('Reading audio first open 안녕하세요 여러분 오늘'),
        duplicateCheckText: normalizeSearchText('안녕하세요 여러분 오늘'),
        createdAt,
      },
      blocks: [
        {
          id: blockId,
          contentItemId,
          korean: '안녕하세요 여러분 오늘',
          romanization: 'annyeonghaseyo yeoreobun oneul',
          tokens: [{ surface: '안녕하세요' }, { surface: '여러분' }, { surface: '오늘' }],
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

    const synthesize = vi.fn(async () => ({
      audioData: new Uint8Array([1, 2, 3, 4]),
      contentType: 'audio/mpeg',
      latencyMs: 32,
      estimatedCostUsd: null,
      durationMs: 1800,
    }))

    const service = new AudioCacheService({
      repository,
      cacheDirectory: path.join(directory, 'reading-audio-cache'),
      provider: {
        id: 'openai',
        synthesize,
      },
    })

    const asset = await service.ensureBlockAudio(blockId)
    const persisted = repository.getBlockAudioAsset(blockId)

    expect(synthesize).toHaveBeenCalledTimes(1)
    expect(asset).toMatchObject({
      blockId,
      state: 'ready',
      durationMs: 1800,
      fromCache: false,
    })
    expect(asset.timings).toHaveLength(3)
    expect(asset.audioFilePath).not.toBeNull()
    expect(existsSync(asset.audioFilePath!)).toBe(true)
    expect(Array.from(readFileSync(asset.audioFilePath!))).toEqual([1, 2, 3, 4])
    expect(persisted).toMatchObject({
      blockId,
      state: 'ready',
      fromCache: true,
    })

    database.close()
  })
})