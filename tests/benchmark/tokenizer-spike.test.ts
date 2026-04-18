import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { runTokenizerSpike } from '../../spikes/tokenizer/src/run-tokenizer-spike.js'

describe('tokenizer spike', () => {
  it('produces a tokenizer report for the fixture corpus', async () => {
    const report = await runTokenizerSpike({
      corpusRoot: path.join(process.cwd(), 'fixtures', 'corpus'),
      writeToDisk: false,
    })

    expect(report.tracks).toContain('local-js-segmenter')
    expect(report.strata.length).toBeGreaterThan(0)
    expect(report.recommendedTrack.length).toBeGreaterThan(0)
  })
})
