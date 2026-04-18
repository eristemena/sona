import type { LlmFallbackArtifact } from '../../../packages/domain/src/artifacts/spike-artifact-schema.js'
import { writeArtifact } from '../../../packages/domain/src/artifacts/write-artifact.js'

export async function writeFallbackArtifact(artifact: LlmFallbackArtifact): Promise<string> {
  return writeArtifact('llm-fallback/policy.json', artifact)
}
import type { LlmFallbackArtifact } from '../../../packages/domain/src/artifacts/spike-artifact-schema.js'
import { writeArtifact } from '../../../packages/domain/src/artifacts/write-artifact.js'

export async function writeFallbackArtifact(artifact: LlmFallbackArtifact): Promise<string> {
  return writeArtifact('llm-fallback/policy.json', artifact)
}
