import { describe, expect, it } from 'vitest'

import { loadCorpusSegments } from '../../packages/domain/src/fixtures/corpus-loader.js'
import { createStudyCandidateProvenance } from '../../packages/domain/src/provenance/study-candidate-provenance.js'

describe('provenance artifact integrity', () => {
  it('preserves linkage from fixture segments to derived candidates', async () => {
    const segments = await loadCorpusSegments()
    const provenance = createStudyCandidateProvenance({
      id: 'prov-001',
      segmentId: segments[0]!.id,
      candidateType: 'review-card-seed',
      derivationTrack: 'local-js-segmenter',
      createdAt: new Date().toISOString(),
    })

    expect(provenance.segmentId).toBe(segments[0]!.id)
  })
})
import { describe, expect, it } from 'vitest'

import { loadCorpusSegments } from '../../packages/domain/src/fixtures/corpus-loader.js'
import { createStudyCandidateProvenance } from '../../packages/domain/src/provenance/study-candidate-provenance.js'

describe('provenance artifact integrity', () => {
  it('preserves linkage from fixture segments to derived candidates', async () => {
    const segments = await loadCorpusSegments()
    const provenance = createStudyCandidateProvenance({
      id: 'prov-001',
      segmentId: segments[0]!.id,
      candidateType: 'review-card-seed',
      derivationTrack: 'local-js-segmenter',
      createdAt: new Date().toISOString(),
    })

    expect(provenance.segmentId).toBe(segments[0]!.id)
  })
})
