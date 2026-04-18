import type { SqliteConcurrencyReport } from '../../../packages/domain/src/artifacts/spike-artifact-schema.js'
import { writeArtifact } from '../../../packages/domain/src/artifacts/write-artifact.js'

export async function writeConcurrencyReport(report: SqliteConcurrencyReport): Promise<string> {
  return writeArtifact('sqlite-concurrency/report.json', report)
}
import type { SqliteConcurrencyReport } from '../../../packages/domain/src/artifacts/spike-artifact-schema.js'
import { writeArtifact } from '../../../packages/domain/src/artifacts/write-artifact.js'

export async function writeConcurrencyReport(report: SqliteConcurrencyReport): Promise<string> {
  return writeArtifact('sqlite-concurrency/report.json', report)
}
