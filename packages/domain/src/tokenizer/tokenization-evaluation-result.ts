import type { Disposition } from '../artifacts/spike-artifact-schema.js'

export interface TokenizationEvaluationResult {
  id: string
  segmentId: string
  track: string
  granularity: 'segment' | 'batch' | 'stratum'
  accuracyScore: number
  errorClasses: string[]
  learnerImpact: string
  recommendedDisposition: Disposition
  notes: string
}

export function createTokenizationEvaluationResult(
  input: TokenizationEvaluationResult,
): TokenizationEvaluationResult {
  if (!input.segmentId || !input.track) {
    throw new Error('Tokenization evaluation result requires segmentId and track')
  }

  return input
}
