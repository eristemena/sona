import { describe, expect, it } from "vitest";

import { runSqliteConcurrencySpike } from "../../spikes/sqlite-concurrency/src/run-sqlite-concurrency.js";

describe("sqlite concurrency spike", () => {
  it("produces a concurrency report", async () => {
    const report = await runSqliteConcurrencySpike({ writeToDisk: false });

    expect(report.overlappingJobs).toEqual([
      "annotation-refresh",
      "srs-harvest",
    ]);
    expect(report.totalCompletionMs).toBeGreaterThanOrEqual(0);
  });
});
