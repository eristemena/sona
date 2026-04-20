import { beforeEach, describe, expect, it, vi } from "vitest";

import { GeneratedContentService } from "../../apps/desktop/src/main/content/generated-content-service.js";
import { registerContentHandlers } from "../../apps/desktop/src/main/ipc/content-handlers.js";
import { OpenRouterContentGenerator } from "../../apps/desktop/src/main/providers/openrouter-content-generator.js";
import { createSqliteConnection } from "../../packages/data/src/sqlite/connection.js";
import { SqliteContentLibraryRepository } from "../../packages/data/src/sqlite/content-library-repository.js";
import { runShellMigrations } from "../../packages/data/src/sqlite/migrations/run-migrations.js";
import { CONTENT_CHANNELS } from "../../packages/domain/src/contracts/content-library.js";
import { createLocalOnlyBehavior } from "../../packages/domain/src/fallback/local-only-behavior.js";
import { generateFallbackSpec } from "../../spikes/llm-fallback/src/generate-fallback-spec.js";
import {
  electronMockState,
  resetElectronMock,
} from "../setup/electron-mock.js";

describe("provider fallback no-key behavior", () => {
  beforeEach(() => {
    resetElectronMock();
  });

  it("keeps the session in local-only mode when no credentials are configured", async () => {
    const localOnly = createLocalOnlyBehavior("annotation-help");
    const artifact = await generateFallbackSpec({ writeToDisk: false });

    expect(localOnly.providerType).toBe("none");
    expect(localOnly.noKeyBehavior).toContain("local-only");
    expect(
      artifact.policies.every((policy) => policy.noKeyBehavior.length > 0),
    ).toBe(true);
  });

  it("returns provider-unavailable for generated practice when no OpenRouter key is configured", async () => {
    const database = createSqliteConnection({ databasePath: ":memory:" });
    runShellMigrations(database);
    const repository = new SqliteContentLibraryRepository(database);

    registerContentHandlers(
      {
        contentRepository: repository,
        generatedContentService: new GeneratedContentService(
          new OpenRouterContentGenerator({
            fetch: vi.fn(),
            apiKey: null,
            endpoint: "https://openrouter.ai/api/v1/chat/completions",
            appTitle: "Sona Desktop",
          }),
          { now: () => 1_713_670_000_000 },
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

    if (!generateHandler) {
      throw new Error(
        "Expected the generate-practice-sentences IPC handler to be registered.",
      );
    }

    const result = await generateHandler(undefined, {
      topic: "coffee shop",
      difficulty: 2,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        reason: "provider-unavailable",
      }),
    );
    expect(repository.listLibraryItems()).toEqual([]);
  });
});
