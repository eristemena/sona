import { existsSync, mkdtempSync, rmSync } from 'node:fs'
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

describe('audio cache cleanup integration', () => {
  it('removes invalidated cached audio files when a block text hash changes', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sona-audio-cache-cleanup-'))
    tempDirectories.push(directory)

    const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)

    const createdAt = 1_713_800_300_000
    const sourceLocator = 'article://audio-cache-cleanup'
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
        title: 'Audio cache cleanup',
        sourceType: 'article',
        difficulty: 2,
        difficultyLabel: toDifficultyBadge(2),
        provenanceLabel: 'Article paste',
        sourceLocator,
        provenanceDetail: 'Used for cache invalidation cleanup validation.',
        searchText: normalizeSearchText('Audio cache cleanup 다시 만나요'),
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

    const initialProvider = vi.fn(async () => ({
      audioData: new Uint8Array([1, 2, 3, 4]),
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
        synthesize: initialProvider,
      },
    })

    const firstAsset = await firstService.ensureBlockAudio(blockId)

    database
      .prepare('UPDATE content_blocks SET korean = ?, tokens_json = ? WHERE id = ?')
      .run('다시 천천히 읽어요', JSON.stringify([{ surface: '다시' }, { surface: '천천히' }, { surface: '읽어요' }]), blockId)

    const refreshedProvider = vi.fn(async () => ({
      audioData: new Uint8Array([9, 8, 7, 6]),
      contentType: 'audio/mpeg',
      latencyMs: 16,
      estimatedCostUsd: null,
      durationMs: 1600,
    }))

    const refreshedService = new AudioCacheService({
      repository,
      cacheDirectory: path.join(directory, 'reading-audio-cache'),
      provider: {
        id: 'openai',
        synthesize: refreshedProvider,
      },
    })

    const refreshedAsset = await refreshedService.ensureBlockAudio(blockId)
    const persistedAssets = repository.listPersistedBlockAudioAssets(blockId)

    expect(initialProvider).toHaveBeenCalledTimes(1)
    expect(refreshedProvider).toHaveBeenCalledTimes(1)
    expect(firstAsset.audioFilePath).not.toBeNull()
    expect(refreshedAsset.audioFilePath).not.toBeNull()
    expect(refreshedAsset.audioFilePath).not.toBe(firstAsset.audioFilePath)
    expect(existsSync(firstAsset.audioFilePath!)).toBe(false)
    expect(existsSync(refreshedAsset.audioFilePath!)).toBe(true)
    expect(persistedAssets).toHaveLength(1)
    expect(persistedAssets[0]).toMatchObject({
      blockId,
      audioFilePath: refreshedAsset.audioFilePath,
      state: 'ready',
    })

    database.close()
  })

  it('regenerates cached block audio when the reading-audio mode changes', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sona-audio-cache-mode-change-'))
    tempDirectories.push(directory)

    const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)

    const createdAt = 1_713_800_320_000
    const sourceLocator = 'article://audio-cache-mode-change'
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
        title: 'Audio cache mode change',
        sourceType: 'article',
        difficulty: 2,
        difficultyLabel: toDifficultyBadge(2),
        provenanceLabel: 'Article paste',
        sourceLocator,
        provenanceDetail: 'Used for reading-audio mode cache invalidation validation.',
        searchText: normalizeSearchText('Audio cache mode change 다시 만나요'),
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

    const provider = {
      id: 'openai' as const,
      synthesize: vi
        .fn()
        .mockImplementationOnce(async (request) => {
          expect(request.instructions).toContain('calm, conversational tone')
          return {
            audioData: new Uint8Array([1, 2, 3]),
            contentType: 'audio/mpeg',
            latencyMs: 18,
            estimatedCostUsd: null,
            durationMs: 1200,
          }
        })
        .mockImplementationOnce(async (request) => {
          expect(request.instructions).toContain('Speak slowly, clearly, and naturally')
          return {
            audioData: new Uint8Array([9, 8, 7]),
            contentType: 'audio/mpeg',
            latencyMs: 16,
            estimatedCostUsd: null,
            durationMs: 1400,
          }
        }),
    }

    let mode: 'standard' | 'learner-slow' = 'standard'

    const service = new AudioCacheService({
      repository,
      cacheDirectory: path.join(directory, 'reading-audio-cache'),
      provider,
      getReadingAudioMode: () => mode,
    })

    const standardAsset = await service.ensureBlockAudio(blockId)
    mode = 'learner-slow'
    const learnerSlowAsset = await service.ensureBlockAudio(blockId)
    const persistedAssets = repository.listPersistedBlockAudioAssets(blockId)

    expect(provider.synthesize).toHaveBeenCalledTimes(2)
    expect(standardAsset.audioFilePath).not.toBeNull()
    expect(learnerSlowAsset.audioFilePath).not.toBeNull()
    expect(learnerSlowAsset.audioFilePath).not.toBe(standardAsset.audioFilePath)
    expect(existsSync(standardAsset.audioFilePath!)).toBe(false)
    expect(existsSync(learnerSlowAsset.audioFilePath!)).toBe(true)
    expect(persistedAssets).toHaveLength(1)
    expect(persistedAssets[0]).toMatchObject({
      blockId,
      audioFilePath: learnerSlowAsset.audioFilePath,
      state: 'ready',
    })

    database.close()
  })
})