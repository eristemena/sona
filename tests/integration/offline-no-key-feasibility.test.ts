import { describe, expect, it } from "vitest";

import { generateFallbackSpec } from "../../spikes/llm-fallback/src/generate-fallback-spec.js";

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
});
