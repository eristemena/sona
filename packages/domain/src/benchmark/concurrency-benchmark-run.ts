export interface ConcurrencyBenchmarkRun {
  id: string
  hardwareProfile: string
  databaseMode: string
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

export function createConcurrencyBenchmarkRun(run: ConcurrencyBenchmarkRun): ConcurrencyBenchmarkRun {
  if (!run.hardwareProfile || run.overlappingJobs.length === 0) {
    throw new Error('Concurrency benchmark run requires hardware profile and overlapping jobs')
  }

  return run
}
export interface ConcurrencyBenchmarkRun {
  id: string
  hardwareProfile: string
  databaseMode: string
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

export function createConcurrencyBenchmarkRun(run: ConcurrencyBenchmarkRun): ConcurrencyBenchmarkRun {
  if (!run.hardwareProfile || run.overlappingJobs.length === 0) {
    throw new Error('Concurrency benchmark run requires hardware profile and overlapping jobs')
  }

  return run
}
