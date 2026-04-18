export type Disposition = 'proceed' | 'revise' | 'defer' | 'fallback-only'

export interface TokenizerStratumResult {
  name: string
  segmentCount: number
  accuracyScore: number
  errorClasses: string[]
  learnerImpact: string
  recommendedDisposition: Disposition
}

export interface TokenizerReport {
  reportId: string
  generatedAt: string
  tracks: string[]
  strata: TokenizerStratumResult[]
  recommendedTrack: string
  openRisks: string[]
}

export interface SessionUsageCap {
  maxCalls: number
  maxEstimatedCostUsd: number
}

export interface LlmFallbackPolicyArtifact {
  featureArea: string
  providerOptions: string[]
  latencyBudgetMs: number
  sessionUsageCap: SessionUsageCap
  promptTemplateRef: string
  noKeyBehavior: string
  failureBehavior: string
}

export interface LlmFallbackArtifact {
  artifactId: string
  generatedAt: string
  policies: LlmFallbackPolicyArtifact[]
  sessionBudgetMinutes: number
}

export interface SqliteConcurrencyReport {
  runId: string
  generatedAt: string
  hardwareProfile: string
  databaseMode: {
    journalMode: 'WAL'
    checkpointPolicy: string
  }
  overlappingJobs: string[]
  datasetSize: {
    segments: number
    candidates: number
  }
  totalCompletionMs: number
  maxUiBlockMs: number
  walSizeBytes: number
  passFail: 'pass' | 'warn' | 'fail'
  bottlenecks: string[]
  mitigations: string[]
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

export function validateTokenizerReport(report: TokenizerReport): TokenizerReport {
  assert(report.reportId.length > 0, 'Tokenizer report requires reportId')
  assert(report.generatedAt.length > 0, 'Tokenizer report requires generatedAt')
  assert(report.tracks.length > 0, 'Tokenizer report requires at least one track')
  assert(report.strata.length > 0, 'Tokenizer report requires at least one stratum result')
  return report
}

export function validateLlmFallbackArtifact(artifact: LlmFallbackArtifact): LlmFallbackArtifact {
  assert(artifact.artifactId.length > 0, 'Fallback artifact requires artifactId')
  assert(artifact.sessionBudgetMinutes > 0, 'Fallback artifact requires sessionBudgetMinutes > 0')
  assert(artifact.policies.length > 0, 'Fallback artifact requires at least one policy')
  return artifact
}

export function validateSqliteConcurrencyReport(report: SqliteConcurrencyReport): SqliteConcurrencyReport {
  assert(report.runId.length > 0, 'Concurrency report requires runId')
  assert(report.overlappingJobs.length > 0, 'Concurrency report requires overlapping jobs')
  assert(report.totalCompletionMs >= 0, 'Concurrency report requires totalCompletionMs')
  return report
}
