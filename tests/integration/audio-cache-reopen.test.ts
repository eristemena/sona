import { mkdtempSync, rmSync } from 'node:fs'
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

describe('audio cache reopen integration', () => {
  it('reuses cached block audio on reopen without a second provider call', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sona-reading-audio-reopen-'))
    tempDirectories.push(directory)

    const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)

    const createdAt = 1_713_800_100_000
    const sourceLocator = 'article://audio-reopen'
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
        title: 'Reading audio reopen',
        sourceType: 'article',
        difficulty: 2,
        difficultyLabel: toDifficultyBadge(2),
        provenanceLabel: 'Article paste',
        sourceLocator,
        provenanceDetail: 'Imported article for cached reopen validation.',
        searchText: normalizeSearchText('Reading audio reopen 다시 만나요'),
        duplicateCheckText: normalizeSearchText('다시 만나요'),
        createdAt,
      },
      blocks: [
        {
          id: blockId,
          contentItemId,
          korean: '다시 만나요',
          romanization: 'dasi mannayo',
          tokens: [{ surface: '다시' }, { surface: '만나요' }],
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

    const firstProvider = vi.fn(async () => ({
      audioData: new Uint8Array([5, 4, 3, 2]),
      contentType: 'audio/mpeg',
      latencyMs: 18,
      estimatedCostUsd: null,
      durationMs: 1200,
    }))

    const firstService = new AudioCacheService({
      repository,
      cacheDirectory: path.join(directory, 'reading-audio-cache'),
      provider: {
        id: 'openai',
        synthesize: firstProvider,
      },
    })

    const firstAsset = await firstService.ensureBlockAudio(blockId)

    const secondProvider = vi.fn(async () => ({
      audioData: new Uint8Array([9, 9, 9]),
      contentType: 'audio/mpeg',
      latencyMs: 18,
      estimatedCostUsd: null,
      durationMs: 1200,
    }))

    const reopenedService = new AudioCacheService({
      repository,
      cacheDirectory: path.join(directory, 'reading-audio-cache'),
      provider: {
        id: 'openai',
        synthesize: secondProvider,
      },
    })

    const reopenedAsset = await reopenedService.ensureBlockAudio(blockId)

    expect(firstProvider).toHaveBeenCalledTimes(1)
    expect(secondProvider).not.toHaveBeenCalled()
    expect(reopenedAsset).toMatchObject({
      blockId,
      state: 'ready',
      fromCache: true,
      audioFilePath: firstAsset.audioFilePath,
    })

    database.close()
  })
})