import path from "node:path";
import { fileURLToPath } from "node:url";

import { evaluateFallbackPolicies } from "../../../packages/domain/src/fallback/evaluate-fallback-policy.js";
import { createLocalOnlyBehavior } from "../../../packages/domain/src/fallback/local-only-behavior.js";
import { createProviderFallbackPolicy } from "../../../packages/domain/src/fallback/provider-fallback-policy.js";
import { writeFallbackArtifact } from "./write-fallback-artifact.js";

export interface GenerateFallbackSpecOptions {
  writeToDisk?: boolean;
}

export async function generateFallbackSpec(
  options: GenerateFallbackSpecOptions = {},
) {
  const policies = [
    createProviderFallbackPolicy({
      id: "annotation-help-online",
      featureArea: "annotation-help",
      providerType: "openai",
      eligibilityRule:
        "Use only when the learner requests inline annotation help and credentials are configured.",
      requestContractRef: "spikes/llm-fallback/prompts/annotation-help.md",
      latencyBudgetMs: 3000,
      sessionUsageCap: { maxCalls: 8, maxEstimatedCostUsd: 1.5 },
      costModel: "Short text prompt plus concise completion.",
      noKeyBehavior: createLocalOnlyBehavior("annotation-help").noKeyBehavior,
      failureBehavior:
        "Return to local-only annotation flow with a visible degraded state.",
    }),
    createProviderFallbackPolicy({
      id: "translation-help-online",
      featureArea: "translation-help",
      providerType: "anthropic",
      eligibilityRule:
        "Use only when the learner opts into translation support and credentials are configured.",
      requestContractRef: "spikes/llm-fallback/prompts/translation-help.md",
      latencyBudgetMs: 3000,
      sessionUsageCap: { maxCalls: 8, maxEstimatedCostUsd: 1.5 },
      costModel: "Short translation request with bounded completion length.",
      noKeyBehavior: createLocalOnlyBehavior("translation-help").noKeyBehavior,
      failureBehavior:
        "Fallback to text-only study with no blocked progression.",
    }),
    createProviderFallbackPolicy({
      id: "tts-online",
      featureArea: "tts",
      providerType: "google-cloud-tts",
      eligibilityRule:
        "Use only for optional audio generation when the learner requests pronunciation support.",
      requestContractRef: "spikes/llm-fallback/prompts/tts.md",
      latencyBudgetMs: 10000,
      sessionUsageCap: { maxCalls: 5, maxEstimatedCostUsd: 2 },
      costModel: "Short utterance synthesis with bounded session spend.",
      noKeyBehavior: createLocalOnlyBehavior("tts").noKeyBehavior,
      failureBehavior:
        "Mark audio unavailable and continue with reading and review continuity.",
    }),
  ];

  const artifact = evaluateFallbackPolicies(policies);
  if (options.writeToDisk !== false) {
    await writeFallbackArtifact(artifact);
  }

  return artifact;
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  generateFallbackSpec()
    .then((artifact) => {
      process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
    })
    .catch((error: unknown) => {
      process.stderr.write(
        `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
