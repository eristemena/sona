import path from 'node:path'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { AnnotationCacheService, hashSentenceContext } from '../../apps/desktop/src/main/content/annotation-cache-service.js'
import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'
import { SqliteContentLibraryRepository } from '../../packages/data/src/sqlite/content-library-repository.js'

const tempDirectories: string[] = []

afterEach(() => {
  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop()!, { force: true, recursive: true })
  }
})

describe('annotation cache stale refresh integration', () => {
  it('returns stale lookup data immediately and refreshes it in the background', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sona-annotation-cache-'))
    tempDirectories.push(directory)

    const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)
    const sentenceContext = '저는 밥을 먹어요.'
    const sentenceContextHash = hashSentenceContext(sentenceContext)

    repository.saveAnnotationCacheEntry({
      id: 'annotation-1',
      canonicalForm: '먹다',
      sentenceContextHash,
      surface: '먹어요',
      meaning: 'to eat in this sentence',
      romanization: 'meogeoyo',
      pattern: '-어요 statement',
      register: 'Polite',
      sentenceTranslation: 'I eat rice.',
      grammarExplanation: null,
      modelId: 'older-model',
      responseJson: JSON.stringify({ register: 'Polite', sentenceTranslation: 'I eat rice.' }),
      createdAt: 1_700_000_000_000,
      refreshedAt: 1_700_000_000_000,
      staleAfter: 1_700_000_000_500,
      lastServedAt: 1_700_000_000_500,
      refreshState: 'stale',
    })

    const provider = {
      id: 'openrouter' as const,
      modelId: 'openai/gpt-4o-mini',
      lookupWord: vi.fn(async () => ({
        canonicalForm: '먹다',
        surface: '먹어요',
        meaning: 'eat (updated)',
        romanization: 'meokda',
        pattern: '-어요 statement',
        register: 'Polite',
        sentenceTranslation: 'I am eating rice.',
        grammarExplanation: null,
        modelId: 'openai/gpt-4o-mini',
        responseJson: JSON.stringify({ register: 'Polite', sentenceTranslation: 'I am eating rice.' }),
      })),
      explainGrammar: vi.fn(async () => {
        throw new Error('not used')
      }),
    }

    const service = new AnnotationCacheService({
      repository,
      provider,
      now: () => 1_700_100_000_000,
    })

    const result = await service.lookupWord(
      {
        blockId: 'block-1',
        token: '먹어요',
        tokenIndex: 2,
        sentenceContext,
      },
      { canonicalCandidate: '먹다' },
    )

    expect(result.meaning).toBe('to eat in this sentence')
    expect(result.cacheState).toBe('stale')

    await service.drainRefreshQueue()

    const refreshed = repository.findAnnotationForLookup({
      surface: '먹어요',
      canonicalForm: '먹다',
      sentenceContextHash,
    })

    expect(provider.lookupWord).toHaveBeenCalledTimes(1)
    expect(refreshed).toMatchObject({
      meaning: 'eat (updated)',
      sentenceTranslation: 'I am eating rice.',
      refreshState: 'fresh',
      modelId: 'openai/gpt-4o-mini',
    })

    database.close()
  })
})