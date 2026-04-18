import { describe, expect, it } from 'vitest'

import { validateTokenizerReport } from '../../packages/domain/src/artifacts/spike-artifact-schema.js'

describe('tokenizer artifact contract', () => {
  it('accepts a valid tokenizer report', () => {
    const report = validateTokenizerReport({
      reportId: 'tokenizer-report-test',
      generatedAt: new Date().toISOString(),
      tracks: ['local-js-segmenter', 'llm-fallback-reference'],
      recommendedTrack: 'local-js-segmenter',
      openRisks: [],
      strata: [
        {
          name: 'article',
          segmentCount: 1,
          accuracyScore: 0.82,
          errorClasses: [],
          learnerImpact: 'Low impact on lookup quality.',
          recommendedDisposition: 'proceed',
        },
      ],
    })

    expect(report.recommendedTrack).toBe('local-js-segmenter')
    expect(report.strata).toHaveLength(1)
  })
})
