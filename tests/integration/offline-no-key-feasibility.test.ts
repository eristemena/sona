import { describe, expect, it, vi } from "vitest";

import { ArticleContentService } from "../../apps/desktop/src/main/content/article-content-service.js";
import { GeneratedContentService } from "../../apps/desktop/src/main/content/generated-content-service.js";
import { registerContentHandlers } from "../../apps/desktop/src/main/ipc/content-handlers.js";
import { OpenRouterContentGenerator } from "../../apps/desktop/src/main/providers/openrouter-content-generator.js";
import { createSqliteConnection } from "../../packages/data/src/sqlite/connection.js";
import { SqliteContentLibraryRepository } from "../../packages/data/src/sqlite/content-library-repository.js";
import { runShellMigrations } from "../../packages/data/src/sqlite/migrations/run-migrations.js";
import { CONTENT_CHANNELS } from "../../packages/domain/src/contracts/content-library.js";
import { generateFallbackSpec } from "../../spikes/llm-fallback/src/generate-fallback-spec.js";
import {
  electronMockState,
  resetElectronMock,
} from "../setup/electron-mock.js";

describe("offline and no-key feasibility", () => {
  it("keeps every fallback policy usable without credentials", async () => {
    const artifact = await generateFallbackSpec({ writeToDisk: false });

    expect(
      artifact.policies.every(
        (policy) =>
          policy.noKeyBehavior.includes("local-only") ||
          policy.noKeyBehavior.includes("local-only mode"),
      ),
    ).toBe(true);
  });

  it("keeps local article paste usable when generated practice has no API key", async () => {
    resetElectronMock();
    const database = createSqliteConnection({ databasePath: ":memory:" });
    runShellMigrations(database);
    const repository = new SqliteContentLibraryRepository(database);

    registerContentHandlers(
      {
        articleContentService: new ArticleContentService(),
        contentRepository: repository,
        generatedContentService: new GeneratedContentService(
          new OpenRouterContentGenerator({
            fetch: vi.fn(),
            apiKey: null,
            endpoint: "https://openrouter.ai/api/v1/chat/completions",
            appTitle: "Sona Desktop",
          }),
          { now: () => 1_713_660_000_000 },
        ),
      },
      {
        ipcMain: electronMockState.ipcMain,
        dialog: electronMockState.dialog,
        browserWindow: { getFocusedWindow: () => null },
      },
    );

    const generateHandler = electronMockState.ipcMainHandlers.get(
      CONTENT_CHANNELS.generatePracticeSentences,
    );
    const pasteHandler = electronMockState.ipcMainHandlers.get(
      CONTENT_CHANNELS.createArticleFromPaste,
    );

    if (!generateHandler || !pasteHandler) {
      throw new Error("Expected the content IPC handlers to be registered.");
    }

    const generationFailure = await generateHandler(undefined, {
      topic: "coffee shop",
      difficulty: 2,
    });

    expect(generationFailure).toEqual(
      expect.objectContaining({
        ok: false,
        reason: "provider-unavailable",
      }),
    );

    const pasteSuccess = await pasteHandler(undefined, {
      text: "서울의 늦은 오후에는 작은 카페마다 조용한 대화가 이어진다.",
      difficulty: 2,
    });

    expect(pasteSuccess).toMatchObject({ ok: true });
    expect(repository.listLibraryItems()).toHaveLength(1);
  });
});
