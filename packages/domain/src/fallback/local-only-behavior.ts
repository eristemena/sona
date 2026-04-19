import { createProviderFallbackPolicy } from "./provider-fallback-policy.js";

export function createLocalOnlyBehavior(
  featureArea:
    | "tokenization-help"
    | "annotation-help"
    | "translation-help"
    | "tts",
) {
  return createProviderFallbackPolicy({
    id: `${featureArea}-local-only`,
    featureArea,
    providerType: "none",
    eligibilityRule:
      "Only use this path when credentials are unavailable or disabled.",
    requestContractRef: `local-only:${featureArea}`,
    latencyBudgetMs: featureArea === "tts" ? 10000 : 3000,
    sessionUsageCap: {
      maxCalls: 0,
      maxEstimatedCostUsd: 0,
    },
    costModel: "No provider cost in local-only mode.",
    noKeyBehavior:
      "Remain in local-only mode and keep the learner flow usable without blocking.",
    failureBehavior:
      "Surface an explicit unavailable state and continue with text-first study behavior.",
  });
}
