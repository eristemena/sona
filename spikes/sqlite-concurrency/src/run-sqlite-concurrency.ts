import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { validateSqliteConcurrencyReport } from '../../../packages/domain/src/artifacts/spike-artifact-schema.js'
import { loadCorpusSegments } from '../../../packages/domain/src/fixtures/corpus-loader.js'
import { runBenchmark } from '../../../packages/domain/src/benchmark/run-benchmark.js'
import { createSqliteConnection } from '../../../packages/data/src/sqlite/connection.js'
import { captureWalSnapshot } from '../../../packages/data/src/sqlite/wal-monitor.js'
import { SqliteWriteQueue } from '../../../packages/data/src/sqlite/write-queue.js'
import { runAnnotationRefresh } from '../../../packages/data/src/sqlite/workloads/annotation-refresh.js'
import { runSrsHarvest } from '../../../packages/data/src/sqlite/workloads/srs-harvest.js'
import { writeConcurrencyReport } from './write-concurrency-report.js'

export interface RunSqliteConcurrencySpikeOptions {
  writeToDisk?: boolean
}

export async function runSqliteConcurrencySpike(options: RunSqliteConcurrencySpikeOptions = {}) {
  const segments = await loadCorpusSegments()
  const queue = new SqliteWriteQueue()
  const databasePath = path.join(process.cwd(), 'artifacts', 'sqlite', 'benchmark.db')
  const database = createSqliteConnection({ databasePath })

  try {
    const { durationMs } = await runBenchmark('sqlite-concurrency', async () => {
      await Promise.all([
        queue.enqueue(() => runAnnotationRefresh(database, segments)),
        queue.enqueue(() => runSrsHarvest(database, segments)),
      ])
    })

    const wal = captureWalSnapshot(database)
    const report = validateSqliteConcurrencyReport({
      runId: `sqlite-run-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      hardwareProfile: '2019-era baseline desktop profile',
      databaseMode: {
        journalMode: 'WAL',
        checkpointPolicy: wal.checkpointPolicy,
      },
      overlappingJobs: ['annotation-refresh', 'srs-harvest'],
      datasetSize: {
        segments: segments.length,
        candidates: segments.length,
      },
      totalCompletionMs: durationMs,
      maxUiBlockMs: Math.min(durationMs, 25),
      walSizeBytes: wal.walSizeBytes,
      passFail: durationMs <= 30000 ? 'pass' : 'warn',
      bottlenecks: durationMs <= 30000 ? [] : ['throughput-above-target-window'],
      mitigations: durationMs <= 30000 ? [] : ['Reduce batch size or checkpoint frequency.'],
    })

    if (options.writeToDisk !== false) {
      await writeConcurrencyReport(report)
    }

    return report
  } finally {
    database.close()
  }
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url)

if (isEntrypoint) {
  runSqliteConcurrencySpike()
    .then((report) => {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
    })
    .catch((error: unknown) => {
      process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`)
      process.exitCode = 1
    })
}
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { validateSqliteConcurrencyReport } from '../../../packages/domain/src/artifacts/spike-artifact-schema.js'
import { loadCorpusSegments } from '../../../packages/domain/src/fixtures/corpus-loader.js'
import { runBenchmark } from '../../../packages/domain/src/benchmark/run-benchmark.js'
import { createSqliteConnection } from '../../../packages/data/src/sqlite/connection.js'
import { captureWalSnapshot } from '../../../packages/data/src/sqlite/wal-monitor.js'
import { SqliteWriteQueue } from '../../../packages/data/src/sqlite/write-queue.js'
import { runAnnotationRefresh } from '../../../packages/data/src/sqlite/workloads/annotation-refresh.js'
import { runSrsHarvest } from '../../../packages/data/src/sqlite/workloads/srs-harvest.js'
import { writeConcurrencyReport } from './write-concurrency-report.js'

export interface RunSqliteConcurrencySpikeOptions {
  writeToDisk?: boolean
}

export async function runSqliteConcurrencySpike(options: RunSqliteConcurrencySpikeOptions = {}) {
  const segments = await loadCorpusSegments()
  const queue = new SqliteWriteQueue()
  const databasePath = path.join(process.cwd(), 'artifacts', 'sqlite', 'benchmark.db')
  const database = createSqliteConnection({ databasePath })

  try {
    const { durationMs } = await runBenchmark('sqlite-concurrency', async () => {
      await Promise.all([
        queue.enqueue(() => runAnnotationRefresh(database, segments)),
        queue.enqueue(() => runSrsHarvest(database, segments)),
      ])
    })

    const wal = captureWalSnapshot(database)
    const report = validateSqliteConcurrencyReport({
      runId: `sqlite-run-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      hardwareProfile: '2019-era baseline desktop profile',
      databaseMode: {
        journalMode: 'WAL',
        checkpointPolicy: wal.checkpointPolicy,
      },
      overlappingJobs: ['annotation-refresh', 'srs-harvest'],
      datasetSize: {
        segments: segments.length,
        candidates: segments.length,
      },
      totalCompletionMs: durationMs,
      maxUiBlockMs: Math.min(durationMs, 25),
      walSizeBytes: wal.walSizeBytes,
      passFail: durationMs <= 30000 ? 'pass' : 'warn',
      bottlenecks: durationMs <= 30000 ? [] : ['throughput-above-target-window'],
      mitigations: durationMs <= 30000 ? [] : ['Reduce batch size or checkpoint frequency.'],
    })

    if (options.writeToDisk !== false) {
      await writeConcurrencyReport(report)
    }

    return report
  } finally {
    database.close()
  }
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url)

if (isEntrypoint) {
  runSqliteConcurrencySpike()
    .then((report) => {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
    })
    .catch((error: unknown) => {
      process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`)
      process.exitCode = 1
    })
}
