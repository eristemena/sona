import { describe, expect, it } from "vitest";

import { createLocalOnlyBehavior } from "../../packages/domain/src/fallback/local-only-behavior.js";
import { generateFallbackSpec } from "../../spikes/llm-fallback/src/generate-fallback-spec.js";

describe("provider fallback no-key behavior", () => {
  it("keeps the session in local-only mode when no credentials are configured", async () => {
    const localOnly = createLocalOnlyBehavior("annotation-help");
    const artifact = await generateFallbackSpec({ writeToDisk: false });

    expect(localOnly.providerType).toBe("none");
    expect(localOnly.noKeyBehavior).toContain("local-only");
    expect(
      artifact.policies.every((policy) => policy.noKeyBehavior.length > 0),
    ).toBe(true);
  });
});
