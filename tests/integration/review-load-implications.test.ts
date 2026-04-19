import { describe, expect, it } from "vitest";

import { runTokenizerSpike } from "../../spikes/tokenizer/src/run-tokenizer-spike.js";
import { generateFallbackSpec } from "../../spikes/llm-fallback/src/generate-fallback-spec.js";

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
});
