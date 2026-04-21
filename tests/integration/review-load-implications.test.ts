import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createSqliteConnection } from "../../packages/data/src/sqlite/connection.js";
import { runShellMigrations } from "../../packages/data/src/sqlite/migrations/run-migrations.js";
import { SqliteContentLibraryRepository } from "../../packages/data/src/sqlite/content-library-repository.js";
import {
  buildContentBlockId,
  buildContentItemId,
  normalizeSearchText,
  toDifficultyBadge,
} from "../../packages/domain/src/content/index.js";
import { runTokenizerSpike } from "../../spikes/tokenizer/src/run-tokenizer-spike.js";
import { generateFallbackSpec } from "../../spikes/llm-fallback/src/generate-fallback-spec.js";

const tempDirectories: string[] = [];

afterEach(() => {
  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop()!, { force: true, recursive: true });
  }
});

function createTestDatabase() {
  const directory = mkdtempSync(path.join(tmpdir(), "sona-review-load-"));
  tempDirectories.push(directory);

  const database = createSqliteConnection({
    databasePath: path.join(directory, "sona.db"),
  });
  runShellMigrations(database);

  return database;
}

describe("review-load implications", () => {
  it("surfaces risks when tokenizer strata degrade or fallback caps are low", async () => {
    const tokenizerReport = await runTokenizerSpike({ writeToDisk: false });
    const fallbackArtifact = await generateFallbackSpec({ writeToDisk: false });

    expect(tokenizerReport.openRisks.length).toBeGreaterThanOrEqual(0);
    expect(
      fallbackArtifact.policies.every(
        (policy) => policy.sessionUsageCap.maxCalls >= 0,
      ),
    ).toBe(true);
  });

  it("keeps content-library save and delete flows outside review scheduling", () => {
    const database = createTestDatabase();
    const repository = new SqliteContentLibraryRepository(database);
    const createdAt = 1_713_571_200_000;
    const sourceLocator = "/fixtures/drama-episode-1.srt";
    const contentItemId = buildContentItemId({
      sourceType: "srt",
      sourceLocator,
      createdAt,
    });

    repository.saveContent({
      item: {
        id: contentItemId,
        title: "Drama Episode 1",
        sourceType: "srt",
        difficulty: 1,
        difficultyLabel: toDifficultyBadge(1),
        provenanceLabel: "Subtitle import",
        sourceLocator,
        provenanceDetail: sourceLocator,
        searchText: normalizeSearchText(
          "Drama Episode 1 지금 가면 늦지 않을까",
        ),
        duplicateCheckText: normalizeSearchText("지금 가면 늦지 않을까"),
        createdAt,
      },
      blocks: [
        {
          id: buildContentBlockId({
            sourceType: "srt",
            sourceLocator,
            contentItemCreatedAt: createdAt,
            sentenceOrdinal: 1,
          }),
          contentItemId,
          korean: "지금 가면 늦지 않을까?",
          romanization: "jigeum gamyeon neutji aneulkka?",
          tokens: null,
          annotations: {},
          difficulty: 1,
          sourceType: "srt",
          audioOffset: 1.25,
          sentenceOrdinal: 1,
          createdAt,
        },
      ],
      sourceRecord: {
        contentItemId,
        originMode: "file-import",
        filePath: sourceLocator,
        url: null,
        sessionId: null,
        displaySource: sourceLocator,
        requestedDifficulty: null,
        validatedDifficulty: null,
        capturedAt: createdAt,
      },
    });

    repository.deleteContent(contentItemId);

    const reviewCardCount = database
      .prepare("SELECT COUNT(*) as total FROM review_cards")
      .get() as { total: number };

    expect(reviewCardCount.total).toBe(0);
    expect(repository.listLibraryItems()).toEqual([]);
  });
});
