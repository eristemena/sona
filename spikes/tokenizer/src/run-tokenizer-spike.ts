import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadCorpusSegments } from '../../../packages/domain/src/fixtures/corpus-loader.js'
import { evaluateTokenizers } from '../../../packages/domain/src/tokenizer/evaluate-tokenizer.js'
import { llmFallbackReference } from '../../../packages/domain/src/tokenizer/llm-fallback-reference.js'
import { localJsSegmenter } from '../../../packages/domain/src/tokenizer/local-js-segmenter.js'
import { writeTokenizerReport } from './write-tokenizer-report.js'

export interface RunTokenizerSpikeOptions {
  corpusRoot?: string
  writeToDisk?: boolean
}

export async function runTokenizerSpike(options: RunTokenizerSpikeOptions = {}) {
  const segments = await loadCorpusSegments(options.corpusRoot)
  const report = evaluateTokenizers(segments, [localJsSegmenter, llmFallbackReference])

  if (options.writeToDisk !== false) {
    await writeTokenizerReport(report)
  }

  return report
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url)

if (isEntrypoint) {
  const corpusRoot = process.argv[2] ? path.resolve(process.argv[2]) : undefined

  runTokenizerSpike({ corpusRoot })
    .then((report) => {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
    })
    .catch((error: unknown) => {
      process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`)
      process.exitCode = 1
    })
}
