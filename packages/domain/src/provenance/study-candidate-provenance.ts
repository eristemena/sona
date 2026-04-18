export type CandidateType = 'annotation' | 'lookup' | 'review-card-seed' | 'audio-job'

export interface StudyCandidateProvenance {
  id: string
  segmentId: string
  candidateType: CandidateType
  derivationTrack: string
  tokenizationResultId?: string
  providerPolicyId?: string
  createdAt: string
}

export function createStudyCandidateProvenance(input: StudyCandidateProvenance): StudyCandidateProvenance {
  if (!input.segmentId) {
    throw new Error('Study candidate provenance requires segmentId')
  }

  return input
}
