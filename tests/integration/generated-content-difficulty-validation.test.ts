import { beforeEach, describe, expect, it } from 'vitest'

import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { SqliteContentLibraryRepository } from '../../packages/data/src/sqlite/content-library-repository.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'
import { CONTENT_CHANNELS } from '../../packages/domain/src/contracts/content-library.js'
import { GeneratedContentService } from '../../apps/desktop/src/main/content/generated-content-service.js'
import { registerContentHandlers } from '../../apps/desktop/src/main/ipc/content-handlers.js'
import type { PracticeSentenceGenerator } from '../../apps/desktop/src/main/providers/openrouter-content-generator.js'
import { electronMockState, resetElectronMock } from '../setup/electron-mock.js'

describe('generated content difficulty validation', () => {
  beforeEach(() => {
    resetElectronMock()
  })

  it('saves accepted generated content and warns before saving a duplicate', async () => {
    const database = createSqliteConnection({ databasePath: ':memory:' })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)
    const generator: PracticeSentenceGenerator = {
      async generateSentences() {
        return {
          title: 'Coffee Shop Practice',
          sentences: ['따뜻한 라테 한 잔 부탁드려요.', '창가 자리가 비어 있으면 거기에 앉고 싶어요.'],
        }
      },
      async validateDifficulty() {
        return {
          validatedDifficulty: 2,
          validationOutcome: 'accepted',
          explanation: 'Validated difficulty matches 중급.',
        }
      },
    }

    registerContentHandlers(
      {
        contentRepository: repository,
        generatedContentService: new GeneratedContentService(generator, { now: () => 1_713_630_000_000 }),
      },
      {
        ipcMain: electronMockState.ipcMain,
        dialog: electronMockState.dialog,
        browserWindow: { getFocusedWindow: () => null },
      },
    )

    const generateHandler = electronMockState.ipcMainHandlers.get(CONTENT_CHANNELS.generatePracticeSentences)
    if (!generateHandler) {
      throw new Error('Expected the generate-practice-sentences IPC handler to be registered.')
    }

    const firstResult = await generateHandler(undefined, { topic: 'coffee shop', difficulty: 2 })
    expect(firstResult).toMatchObject({
      ok: true,
      item: {
        sourceType: 'generated',
        difficultyBadge: '중급',
        provenanceLabel: 'Generation request',
      },
    })
    expect(repository.listLibraryItems()).toHaveLength(1)

    const duplicateWarning = await generateHandler(undefined, { topic: 'coffee shop', difficulty: 2 })
    expect(duplicateWarning).toEqual(
      expect.objectContaining({
        ok: false,
        reason: 'duplicate-warning',
      }),
    )

    const confirmedDuplicate = await generateHandler(undefined, {
      topic: 'coffee shop',
      difficulty: 2,
      confirmDuplicate: true,
    })

    expect(confirmedDuplicate).toMatchObject({ ok: true })
    expect(repository.listLibraryItems()).toHaveLength(2)
  })

  it('relabels generated content and preserves requested versus validated difficulty provenance', async () => {
    const database = createSqliteConnection({ databasePath: ':memory:' })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)
    const generator: PracticeSentenceGenerator = {
      async generateSentences() {
        return {
          title: 'Subway Directions Practice',
          sentences: ['시청역으로 가려면 여기에서 2호선으로 갈아타세요.', '출구를 나오면 큰 은행 건물이 바로 보여요.'],
        }
      },
      async validateDifficulty() {
        return {
          validatedDifficulty: 3,
          validationOutcome: 'relabeled',
          explanation: 'Validated difficulty was relabeled to 고급.',
        }
      },
    }

    registerContentHandlers(
      {
        contentRepository: repository,
        generatedContentService: new GeneratedContentService(generator, { now: () => 1_713_640_000_000 }),
      },
      {
        ipcMain: electronMockState.ipcMain,
        dialog: electronMockState.dialog,
        browserWindow: { getFocusedWindow: () => null },
      },
    )

    const generateHandler = electronMockState.ipcMainHandlers.get(CONTENT_CHANNELS.generatePracticeSentences)
    if (!generateHandler) {
      throw new Error('Expected the generate-practice-sentences IPC handler to be registered.')
    }

    const result = await generateHandler(undefined, { topic: 'subway directions', difficulty: 2 })
    expect(result).toMatchObject({
      ok: true,
      item: {
        difficulty: 3,
        difficultyBadge: '고급',
      },
    })

    const savedItem = repository.listLibraryItems()[0]
    expect(savedItem?.provenanceDetail).toContain('requested difficulty: 중급')
    expect(savedItem?.provenanceDetail).toContain('validated difficulty: 고급')
    expect(savedItem?.provenanceDetail).toContain('validation outcome: relabeled')

    const generationRequest = database
      .prepare(
        'SELECT requested_difficulty, validated_difficulty, validation_outcome, topic FROM generation_requests LIMIT 1',
      )
      .get() as {
      requested_difficulty: number
      validated_difficulty: number
      validation_outcome: string
      topic: string
    }

    expect(generationRequest).toEqual({
      requested_difficulty: 2,
      validated_difficulty: 3,
      validation_outcome: 'relabeled',
      topic: 'subway directions',
    })
  })

  it('rejects generated content that fails difficulty validation without saving a partial item', async () => {
    const database = createSqliteConnection({ databasePath: ':memory:' })
    runShellMigrations(database)
    const repository = new SqliteContentLibraryRepository(database)
    const generator: PracticeSentenceGenerator = {
      async generateSentences() {
        return {
          title: 'Debate Club Practice',
          sentences: ['이 제도는 장기적으로 시민 참여를 재구성할 가능성이 있습니다.'],
        }
      },
      async validateDifficulty() {
        return {
          validatedDifficulty: null,
          validationOutcome: 'rejected',
          explanation: 'The generated practice sentences did not match the requested difficulty closely enough to save.',
        }
      },
    }

    registerContentHandlers(
      {
        contentRepository: repository,
        generatedContentService: new GeneratedContentService(generator, { now: () => 1_713_650_000_000 }),
      },
      {
        ipcMain: electronMockState.ipcMain,
        dialog: electronMockState.dialog,
        browserWindow: { getFocusedWindow: () => null },
      },
    )

    const generateHandler = electronMockState.ipcMainHandlers.get(CONTENT_CHANNELS.generatePracticeSentences)
    if (!generateHandler) {
      throw new Error('Expected the generate-practice-sentences IPC handler to be registered.')
    }

    const result = await generateHandler(undefined, { topic: 'debate club', difficulty: 1 })
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        reason: 'validation-rejected',
      }),
    )
    expect(repository.listLibraryItems()).toEqual([])
  })
})