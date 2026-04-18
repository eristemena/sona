import type { TokenizerReport } from '../../../packages/domain/src/artifacts/spike-artifact-schema.js'
import { writeArtifact } from '../../../packages/domain/src/artifacts/write-artifact.js'

export async function writeTokenizerReport(report: TokenizerReport): Promise<string> {
  return writeArtifact('tokenizer/report.json', report)
}
