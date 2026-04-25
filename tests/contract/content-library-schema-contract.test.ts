import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'

const tempDirectories: string[] = []

afterEach(() => {
  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop()!, { force: true, recursive: true })
  }
})

function createTestDatabase() {
  const directory = mkdtempSync(path.join(tmpdir(), 'sona-content-schema-'))
  tempDirectories.push(directory)

  const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
  runShellMigrations(database)

  return database
}

describe('content library schema contract', () => {
  it('creates the content-library tables and applies the content migration', () => {
    const database = createTestDatabase()

    const tableNames = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>

    const appliedMigrations = database
      .prepare('SELECT version, name FROM schema_migrations ORDER BY version ASC')
      .all() as Array<{ version: number; name: string }>

    expect(tableNames.map((row) => row.name)).toEqual(
      expect.arrayContaining([
        'content_library_items',
        'content_blocks',
        'content_source_records',
        'generation_requests',
      ]),
    )

    expect(appliedMigrations).toEqual(
      expect.arrayContaining([
        { version: 2, name: "002_content_library_v1" },
        { version: 7, name: "007_content_library_v2" },
      ]),
    );
  })

  it("backfills generated titles from stored topics and uses a fallback when the topic is missing", async () => {
    const {
      buildContentBlockId,
      buildContentItemId,
      normalizeSearchText,
      toDifficultyBadge,
    } = await import("../../packages/domain/src/content/index.js");
    const { SqliteContentLibraryRepository } =
      await import("../../packages/data/src/sqlite/content-library-repository.js");

    const database = createTestDatabase();
    const repository = new SqliteContentLibraryRepository(database);

    const topicBackfilledCreatedAt = 1_713_571_200_010;
    const topicBackfilledSourceLocator =
      "generation-request:legacy-korean-title";
    const topicBackfilledContentItemId = buildContentItemId({
      sourceType: "generated",
      sourceLocator: topicBackfilledSourceLocator,
      createdAt: topicBackfilledCreatedAt,
    });

    repository.saveContent({
      item: {
        id: topicBackfilledContentItemId,
        title: "커피 주문 연습",
        sourceType: "generated",
        difficulty: 2,
        difficultyLabel: toDifficultyBadge(2),
        provenanceLabel: "Generation request",
        sourceLocator: topicBackfilledSourceLocator,
        provenanceDetail:
          "Topic: ordering coffee · requested difficulty: 중급 · validated difficulty: 중급",
        searchText: normalizeSearchText(
          "커피 주문 연습 ordering coffee 따뜻한 커피 한 잔 주세요",
        ),
        duplicateCheckText: normalizeSearchText("따뜻한 커피 한 잔 주세요"),
        createdAt: topicBackfilledCreatedAt,
      },
      blocks: [
        {
          id: buildContentBlockId({
            sourceType: "generated",
            sourceLocator: topicBackfilledSourceLocator,
            contentItemCreatedAt: topicBackfilledCreatedAt,
            sentenceOrdinal: 1,
          }),
          contentItemId: topicBackfilledContentItemId,
          korean: "따뜻한 커피 한 잔 주세요.",
          romanization: null,
          tokens: null,
          annotations: {},
          difficulty: 2,
          sourceType: "generated",
          audioOffset: null,
          sentenceOrdinal: 1,
          createdAt: topicBackfilledCreatedAt,
        },
      ],
      sourceRecord: {
        contentItemId: topicBackfilledContentItemId,
        originMode: "generation-request",
        filePath: null,
        url: null,
        sessionId: topicBackfilledSourceLocator,
        displaySource:
          "Topic: ordering coffee · requested difficulty: 중급 · validated difficulty: 중급",
        requestedDifficulty: 2,
        validatedDifficulty: 2,
        capturedAt: topicBackfilledCreatedAt,
      },
      generationRequest: {
        sessionId: topicBackfilledSourceLocator,
        topic: "ordering coffee",
        requestedDifficulty: 2,
        validatedDifficulty: 2,
        validationOutcome: "accepted",
        generatorModel: "anthropic/claude-3-5-haiku",
        validatorModel: "openai/gpt-4o-mini",
        createdAt: topicBackfilledCreatedAt,
      },
    });

    const fallbackCreatedAt = 1_713_571_200_011;
    const fallbackSourceLocator = "generation-request:missing-topic";
    const fallbackContentItemId = buildContentItemId({
      sourceType: "generated",
      sourceLocator: fallbackSourceLocator,
      createdAt: fallbackCreatedAt,
    });

    repository.saveContent({
      item: {
        id: fallbackContentItemId,
        title: "길 찾기 연습",
        sourceType: "generated",
        difficulty: 1,
        difficultyLabel: toDifficultyBadge(1),
        provenanceLabel: "Generation request",
        sourceLocator: fallbackSourceLocator,
        provenanceDetail: "Legacy generated content without a stored topic.",
        searchText: normalizeSearchText(
          "길 찾기 연습 길을 건너면 바로 역이 보여요",
        ),
        duplicateCheckText: normalizeSearchText("길을 건너면 바로 역이 보여요"),
        createdAt: fallbackCreatedAt,
      },
      blocks: [
        {
          id: buildContentBlockId({
            sourceType: "generated",
            sourceLocator: fallbackSourceLocator,
            contentItemCreatedAt: fallbackCreatedAt,
            sentenceOrdinal: 1,
          }),
          contentItemId: fallbackContentItemId,
          korean: "길을 건너면 바로 역이 보여요.",
          romanization: null,
          tokens: null,
          annotations: {},
          difficulty: 1,
          sourceType: "generated",
          audioOffset: null,
          sentenceOrdinal: 1,
          createdAt: fallbackCreatedAt,
        },
      ],
      sourceRecord: {
        contentItemId: fallbackContentItemId,
        originMode: "generation-request",
        filePath: null,
        url: null,
        sessionId: fallbackSourceLocator,
        displaySource: "Legacy generated content without a stored topic.",
        requestedDifficulty: 1,
        validatedDifficulty: 1,
        capturedAt: fallbackCreatedAt,
      },
    });

    database.prepare("DELETE FROM schema_migrations WHERE version = 7").run();
    database
      .prepare("UPDATE content_library_items SET title = ? WHERE id = ?")
      .run("커피 주문 연습", topicBackfilledContentItemId);
    database
      .prepare("UPDATE content_library_items SET title = ? WHERE id = ?")
      .run("길 찾기 연습", fallbackContentItemId);

    runShellMigrations(database);

    const migratedTitles = database
      .prepare(
        "SELECT id, title FROM content_library_items WHERE id IN (?, ?) ORDER BY id ASC",
      )
      .all(fallbackContentItemId, topicBackfilledContentItemId) as Array<{
      id: string;
      title: string;
    }>;

    expect(migratedTitles).toEqual([
      { id: topicBackfilledContentItemId, title: "Ordering coffee" },
      { id: fallbackContentItemId, title: "Generated content" },
    ]);
  });

  it('persists and cascades content-library records transactionally', async () => {
    const { buildContentBlockId, buildContentItemId, normalizeSearchText, toDifficultyBadge } = await import(
      '../../packages/domain/src/content/index.js'
    )
    const { SqliteContentLibraryRepository } = await import(
      '../../packages/data/src/sqlite/content-library-repository.js'
    )

    const database = createTestDatabase()
    const repository = new SqliteContentLibraryRepository(database)
    const createdAt = 1_713_571_200_000
    const sourceLocator = '/fixtures/sample.srt'
    const contentItemId = buildContentItemId({ sourceType: 'srt', sourceLocator, createdAt })

    const result = repository.saveContent({
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
          id: buildContentBlockId({
            sourceType: 'srt',
            sourceLocator,
            contentItemCreatedAt: createdAt,
            sentenceOrdinal: 1,
          }),
          contentItemId,
          korean: '안녕하세요',
          romanization: 'annyeonghaseyo',
          tokens: null,
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

    expect(result.ok).toBe(true)
    expect(repository.listLibraryItems()).toHaveLength(1)
    expect(repository.getContentBlocks(contentItemId)).toHaveLength(1)

    repository.deleteContent(contentItemId)

    expect(repository.listLibraryItems()).toHaveLength(0)
    expect(repository.getContentBlocks(contentItemId)).toHaveLength(0)
  })

  it("derives reading tokens for legacy content blocks that were saved without tokens_json", async () => {
    const {
      buildContentBlockId,
      buildContentItemId,
      normalizeSearchText,
      toDifficultyBadge,
    } = await import("../../packages/domain/src/content/index.js");
    const { SqliteContentLibraryRepository } =
      await import("../../packages/data/src/sqlite/content-library-repository.js");

    const database = createTestDatabase();
    const repository = new SqliteContentLibraryRepository(database);
    const createdAt = 1_713_571_200_001;
    const sourceLocator = "generation-request:legacy-no-tokens";
    const contentItemId = buildContentItemId({
      sourceType: "generated",
      sourceLocator,
      createdAt,
    });

    repository.saveContent({
      item: {
        id: contentItemId,
        title: "Legacy token fallback",
        sourceType: "generated",
        difficulty: 1,
        difficultyLabel: toDifficultyBadge(1),
        provenanceLabel: "Generation request",
        sourceLocator,
        provenanceDetail: "Legacy generated content without persisted tokens.",
        searchText: normalizeSearchText(
          "Legacy token fallback 아메리카노 주세요",
        ),
        duplicateCheckText: normalizeSearchText("아메리카노 주세요"),
        createdAt,
      },
      blocks: [
        {
          id: buildContentBlockId({
            sourceType: "generated",
            sourceLocator,
            contentItemCreatedAt: createdAt,
            sentenceOrdinal: 1,
          }),
          contentItemId,
          korean: "아메리카노 주세요.",
          romanization: null,
          tokens: null,
          annotations: {},
          difficulty: 1,
          sourceType: "generated",
          audioOffset: null,
          sentenceOrdinal: 1,
          createdAt,
        },
      ],
      sourceRecord: {
        contentItemId,
        originMode: "generation-request",
        filePath: null,
        url: null,
        sessionId: sourceLocator,
        displaySource: "Legacy generated content without persisted tokens.",
        requestedDifficulty: 1,
        validatedDifficulty: 1,
        capturedAt: createdAt,
      },
    });

    const session = repository.getReadingSession(contentItemId);

    expect(session?.blocks[0]?.tokens.map((token) => token.surface)).toEqual([
      "아메리카노",
      "주세요",
    ]);
  });
})