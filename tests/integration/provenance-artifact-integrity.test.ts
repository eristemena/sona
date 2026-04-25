import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { ArticleContentService } from "../../apps/desktop/src/main/content/article-content-service.js";
import { GeneratedContentService } from "../../apps/desktop/src/main/content/generated-content-service.js";
import { createSqliteConnection } from "../../packages/data/src/sqlite/connection.js";
import { SqliteContentLibraryRepository } from "../../packages/data/src/sqlite/content-library-repository.js";
import { runShellMigrations } from "../../packages/data/src/sqlite/migrations/run-migrations.js";
import { SrtImportService } from "../../apps/desktop/src/main/content/srt-import-service.js";
import { loadCorpusSegments } from "../../packages/domain/src/fixtures/corpus-loader.js";
import { createStudyCandidateProvenance } from "../../packages/domain/src/provenance/study-candidate-provenance.js";
import type { PracticeSentenceGenerator } from "../../apps/desktop/src/main/providers/openrouter-content-generator.js";

const tempDirectories: string[] = [];

afterEach(() => {
  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop()!, { force: true, recursive: true });
  }
});

function createTestRepository(prefix: string) {
  const directory = mkdtempSync(path.join(tmpdir(), prefix));
  tempDirectories.push(directory);

  const database = createSqliteConnection({
    databasePath: path.join(directory, "sona.db"),
  });
  runShellMigrations(database);

  return {
    database,
    directory,
    repository: new SqliteContentLibraryRepository(database),
  };
}

describe("provenance artifact integrity", () => {
  it("preserves linkage from fixture segments to derived candidates", async () => {
    const segments = await loadCorpusSegments();
    const provenance = createStudyCandidateProvenance({
      id: "prov-001",
      segmentId: segments[0]!.id,
      candidateType: "review-card-seed",
      derivationTrack: "local-js-segmenter",
      createdAt: new Date().toISOString(),
    });

    expect(provenance.segmentId).toBe(segments[0]!.id);
  });

  it("retains subtitle file provenance and timing offsets after import", async () => {
    const { database, directory, repository } = createTestRepository(
      "sona-provenance-subtitle-",
    );
    const sourcePath = path.join(directory, "sample-drama.srt");
    writeFileSync(
      sourcePath,
      readFileSync(
        path.join(process.cwd(), "fixtures/corpus/sample-drama.srt"),
        "utf8",
      ),
    );

    const service = new SrtImportService({
      now: () => 1_713_600_000_000,
      readFile: async (filePath, encoding) =>
        (await import("node:fs/promises")).readFile(filePath, encoding),
    });

    const result = repository.saveContent(
      await service.importFromFile({ filePath: sourcePath, difficulty: 1 }),
    );
    expect(result).toMatchObject({ ok: true });

    const sourceRecord = database
      .prepare(
        "SELECT file_path, display_source FROM content_source_records LIMIT 1",
      )
      .get() as { file_path: string; display_source: string };
    const blockRows = database
      .prepare(
        "SELECT audio_offset FROM content_blocks ORDER BY sentence_ordinal ASC",
      )
      .all() as Array<{ audio_offset: number | null }>;

    expect(sourceRecord).toEqual({
      file_path: sourcePath,
      display_source: sourcePath,
    });
    expect(blockRows.map((row) => row.audio_offset)).toEqual([1.2, 4.5, 8.1]);
  });

  it("retains learner-visible article paste provenance without fabricating URL metadata", async () => {
    const { database, repository } = createTestRepository(
      "sona-provenance-article-",
    );
    const service = new ArticleContentService(undefined, {
      now: () => 1_713_680_000_000,
    });

    const result = repository.saveContent(
      service.createFromPaste({
        title: "Market Walk",
        text: "서울의 골목 시장은 이른 아침부터 분주하다. 상인들은 계절 과일을 가장 먼저 내놓는다.",
        difficulty: 2,
      }),
    );

    expect(result).toMatchObject({ ok: true });

    const sourceRecord = database
      .prepare(
        "SELECT origin_mode, url, session_id, display_source, requested_difficulty, validated_difficulty FROM content_source_records LIMIT 1",
      )
      .get() as {
      origin_mode: string;
      url: string | null;
      session_id: string | null;
      display_source: string;
      requested_difficulty: number | null;
      validated_difficulty: number | null;
    };
    const itemRow = database
      .prepare(
        "SELECT title, provenance_label, provenance_detail, source_locator FROM content_library_items LIMIT 1",
      )
      .get() as {
      title: string;
      provenance_label: string;
      provenance_detail: string;
      source_locator: string;
    };

    expect(itemRow).toEqual({
      title: "Market Walk",
      provenance_label: "Article paste",
      provenance_detail: "Pasted from the learner clipboard.",
      source_locator: sourceRecord.session_id ?? "",
    });
    expect(sourceRecord).toEqual({
      origin_mode: "article-paste",
      url: null,
      session_id: expect.stringMatching(/^article-paste:/),
      display_source: "Pasted from the learner clipboard.",
      requested_difficulty: null,
      validated_difficulty: null,
    });
  });

  it("retains requested versus validated difficulty provenance for generated content", async () => {
    const { database, repository } = createTestRepository(
      "sona-provenance-generated-",
    );
    const generator: PracticeSentenceGenerator = {
      async generateSentences() {
        return {
          sentences: [
            "이번 역에서 내려서 오른쪽 출구로 나가세요.",
            "출구 앞에서 바로 버스를 갈아타면 돼요.",
          ],
        };
      },
      async validateDifficulty() {
        return {
          validatedDifficulty: 3,
          validationOutcome: "relabeled",
          explanation: "Validated difficulty was relabeled to 고급.",
        };
      },
    };

    const result = repository.saveContent(
      await new GeneratedContentService(generator, {
        now: () => 1_713_690_000_000,
      }).createFromTopic({
        topic: "station directions",
        sentenceCount: 10,
        difficulty: 2,
      }),
    );

    expect(result).toMatchObject({
      ok: true,
      item: {
        sourceType: "generated",
        difficulty: 3,
        provenanceLabel: "Generation request",
      },
    });

    const sourceRecord = database
      .prepare(
        "SELECT origin_mode, session_id, display_source, requested_difficulty, validated_difficulty FROM content_source_records LIMIT 1",
      )
      .get() as {
      origin_mode: string;
      session_id: string;
      display_source: string;
      requested_difficulty: number;
      validated_difficulty: number;
    };
    const generationRequest = database
      .prepare(
        "SELECT topic, requested_difficulty, validated_difficulty, validation_outcome, generator_model, validator_model FROM generation_requests LIMIT 1",
      )
      .get() as {
      topic: string;
      requested_difficulty: number;
      validated_difficulty: number;
      validation_outcome: string;
      generator_model: string;
      validator_model: string;
    };

    expect(sourceRecord.origin_mode).toBe("generation-request");
    expect(sourceRecord.session_id).toMatch(/^generation-request:/);
    expect(sourceRecord.display_source).toContain("Topic: station directions");
    expect(sourceRecord.display_source).toContain("requested difficulty: 중급");
    expect(sourceRecord.display_source).toContain("validated difficulty: 고급");
    expect(sourceRecord.display_source).toContain(
      "validation outcome: relabeled",
    );
    expect(sourceRecord.requested_difficulty).toBe(2);
    expect(sourceRecord.validated_difficulty).toBe(3);
    expect(generationRequest).toEqual({
      topic: "station directions",
      requested_difficulty: 2,
      validated_difficulty: 3,
      validation_outcome: "relabeled",
      generator_model: "anthropic/claude-3-5-haiku",
      validator_model: "openai/gpt-4o-mini",
    });
  });
});
