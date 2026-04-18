export interface BenchmarkResult<T> {
  label: string
  durationMs: number
  result: T
}

export async function runBenchmark<T>(label: string, operation: () => Promise<T> | T): Promise<BenchmarkResult<T>> {
  const startedAt = performance.now()
  const result = await operation()
  const durationMs = Math.round(performance.now() - startedAt)

  return {
    label,
    durationMs,
    result,
  }
}
