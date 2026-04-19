import { describe, expect, it } from "vitest";

import { validateSqliteConcurrencyReport } from "../../packages/domain/src/artifacts/spike-artifact-schema.js";

describe("sqlite concurrency artifact contract", () => {
  it("accepts a valid sqlite concurrency artifact", () => {
    const report = validateSqliteConcurrencyReport({
      runId: "sqlite-run-test",
      generatedAt: new Date().toISOString(),
      hardwareProfile: "2019 baseline test machine",
      databaseMode: {
        journalMode: "WAL",
        checkpointPolicy: "PASSIVE",
      },
      overlappingJobs: ["annotation-refresh", "srs-harvest"],
      datasetSize: { segments: 3, candidates: 3 },
      totalCompletionMs: 42,
      maxUiBlockMs: 8,
      walSizeBytes: 0,
      passFail: "pass",
      bottlenecks: [],
      mitigations: [],
    });

    expect(report.passFail).toBe("pass");
  });
});
