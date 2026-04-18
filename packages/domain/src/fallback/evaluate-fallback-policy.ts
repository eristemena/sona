import type { LlmFallbackArtifact, LlmFallbackPolicyArtifact } from '../artifacts/spike-artifact-schema.js'
import { validateLlmFallbackArtifact } from '../artifacts/spike-artifact-schema.js'
import type { ProviderFallbackPolicy } from './provider-fallback-policy.js'

export function evaluateFallbackPolicies(
  policies: ProviderFallbackPolicy[],
  sessionBudgetMinutes = 30,
): LlmFallbackArtifact {
  const artifactPolicies: LlmFallbackPolicyArtifact[] = policies.map((policy) => ({
    featureArea: policy.featureArea,
    providerOptions: providerOptionsFor(policy.featureArea),
    latencyBudgetMs: policy.latencyBudgetMs,
    sessionUsageCap: policy.sessionUsageCap,
    promptTemplateRef: policy.requestContractRef,
    noKeyBehavior: policy.noKeyBehavior,
    failureBehavior: policy.failureBehavior,
  }))

  return validateLlmFallbackArtifact({
    artifactId: `fallback-artifact-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    policies: artifactPolicies,
    sessionBudgetMinutes,
  })
}

function providerOptionsFor(featureArea: ProviderFallbackPolicy['featureArea']): string[] {
  return featureArea === 'tts'
    ? ['openai', 'google-cloud-tts', 'none']
    : ['openai', 'anthropic', 'none']
}
import type { LlmFallbackArtifact, LlmFallbackPolicyArtifact } from '../artifacts/spike-artifact-schema.js'
import { validateLlmFallbackArtifact } from '../artifacts/spike-artifact-schema.js'
import type { ProviderFallbackPolicy } from './provider-fallback-policy.js'

export function evaluateFallbackPolicies(
  policies: ProviderFallbackPolicy[],
  sessionBudgetMinutes = 30,
): LlmFallbackArtifact {
  const artifactPolicies: LlmFallbackPolicyArtifact[] = policies.map((policy) => ({
    featureArea: policy.featureArea,
    providerOptions: providerOptionsFor(policy.featureArea),
    latencyBudgetMs: policy.latencyBudgetMs,
    sessionUsageCap: policy.sessionUsageCap,
    promptTemplateRef: policy.requestContractRef,
    noKeyBehavior: policy.noKeyBehavior,
    failureBehavior: policy.failureBehavior,
  }))

  return validateLlmFallbackArtifact({
    artifactId: `fallback-artifact-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    policies: artifactPolicies,
    sessionBudgetMinutes,
  })
}

function providerOptionsFor(featureArea: ProviderFallbackPolicy['featureArea']): string[] {
  return featureArea === 'tts'
    ? ['openai', 'google-cloud-tts', 'none']
    : ['openai', 'anthropic', 'none']
}
