import { describe, expect, it } from 'vitest'

import { validateLlmFallbackArtifact } from '../../packages/domain/src/artifacts/spike-artifact-schema.js'

describe('provider fallback contract', () => {
  it('accepts a valid fallback artifact', () => {
    const artifact = validateLlmFallbackArtifact({
      artifactId: 'fallback-artifact-test',
      generatedAt: new Date().toISOString(),
      sessionBudgetMinutes: 30,
      policies: [
        {
          featureArea: 'annotation-help',
          providerOptions: ['openai', 'anthropic', 'none'],
          latencyBudgetMs: 3000,
          sessionUsageCap: {
            maxCalls: 6,
            maxEstimatedCostUsd: 1.5,
          },
          promptTemplateRef: 'annotation-help.md',
          noKeyBehavior: 'Remain in local-only mode.',
          failureBehavior: 'Degrade to local-only mode.',
        },
      ],
    })

    expect(artifact.sessionBudgetMinutes).toBe(30)
    expect(artifact.policies).toHaveLength(1)
  })
})
import { describe, expect, it } from 'vitest'

import { validateLlmFallbackArtifact } from '../../packages/domain/src/artifacts/spike-artifact-schema.js'

describe('provider fallback contract', () => {
  it('accepts a valid fallback artifact', () => {
    const artifact = validateLlmFallbackArtifact({
      artifactId: 'fallback-artifact-test',
      generatedAt: new Date().toISOString(),
      sessionBudgetMinutes: 30,
      policies: [
        {
          featureArea: 'annotation-help',
          providerOptions: ['openai', 'anthropic', 'none'],
          latencyBudgetMs: 3000,
          sessionUsageCap: {
            maxCalls: 6,
            maxEstimatedCostUsd: 1.5,
          },
          promptTemplateRef: 'annotation-help.md',
          noKeyBehavior: 'Remain in local-only mode.',
          failureBehavior: 'Degrade to local-only mode.',
        },
      ],
    })

    expect(artifact.sessionBudgetMinutes).toBe(30)
    expect(artifact.policies).toHaveLength(1)
  })
})
