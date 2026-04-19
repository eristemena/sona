export type ProviderType = "openai" | "anthropic" | "google-cloud-tts" | "none";

export interface ProviderFallbackPolicy {
  id: string;
  featureArea:
    | "tokenization-help"
    | "annotation-help"
    | "translation-help"
    | "tts";
  providerType: ProviderType;
  eligibilityRule: string;
  requestContractRef: string;
  latencyBudgetMs: number;
  sessionUsageCap: {
    maxCalls: number;
    maxEstimatedCostUsd: number;
  };
  costModel: string;
  noKeyBehavior: string;
  failureBehavior: string;
}

export function createProviderFallbackPolicy(
  policy: ProviderFallbackPolicy,
): ProviderFallbackPolicy {
  if (!policy.featureArea || !policy.noKeyBehavior || !policy.failureBehavior) {
    throw new Error("Provider fallback policy is missing required fields");
  }

  return policy;
}
