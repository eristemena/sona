export type SourceType = 'article' | 'subtitle' | 'generated-sentence' | 'other-approved-source'

export interface CorpusSegment {
  id: string
  sourceId: string
  sourceType: SourceType
  stratum: string
  text: string
  startOffset?: number
  endOffset?: number
  learnerApproved: boolean
  capturedAt: string
}

export function validateCorpusSegment(segment: CorpusSegment): CorpusSegment {
  if (!segment.text.trim()) {
    throw new Error(`Corpus segment ${segment.id} has empty text`)
  }

  if (!segment.learnerApproved) {
    throw new Error(`Corpus segment ${segment.id} is not learner approved`)
  }

  if (segment.sourceType === 'subtitle' && (segment.startOffset === undefined || segment.endOffset === undefined)) {
    throw new Error(`Subtitle segment ${segment.id} requires timing offsets`)
  }

  return segment
}
