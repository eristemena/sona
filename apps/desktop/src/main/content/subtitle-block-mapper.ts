import type { SaveContentDraft } from '@sona/data/sqlite/content-library-repository'
import {
  buildContentBlockId,
  buildContentItemId,
  createSubtitleDuplicateCheckText,
  createSubtitleSearchText,
  deriveSubtitleTitle,
  hasUsableKoreanSubtitleText,
  splitSubtitleCueText,
  toDifficultyBadge,
  type ParsedSubtitleCue,
} from '@sona/domain/content'
import type { ImportSrtInput } from '@sona/domain/contracts/content-library'
import { createSubtitleCorpusSegment } from '@sona/domain/provenance/corpus-segment'

export function mapSubtitleImportToDraft(input: {
  sourceReference: string
  filePath: string | null
  cues: ParsedSubtitleCue[]
  importInput: ImportSrtInput
  createdAt: number
}): SaveContentDraft {
  const usableCues = input.cues
    .map((cue) => ({
      ...cue,
      sentences: splitSubtitleCueText(cue.text).filter(hasUsableKoreanSubtitleText),
    }))
    .filter((cue) => cue.sentences.length > 0)

  if (usableCues.length === 0) {
    throw new Error('The subtitle file did not contain any usable Korean subtitle lines.')
  }

  const title = deriveSubtitleTitle(input.sourceReference, input.importInput.title)
  const sourceLocator = input.sourceReference
  const contentItemId = buildContentItemId({
    sourceType: 'srt',
    sourceLocator,
    createdAt: input.createdAt,
  })

  const subtitleLines = usableCues.flatMap((cue) => cue.sentences)
  let sentenceOrdinal = 0
  const blocks = usableCues.flatMap((cue) =>
    cue.sentences.map((sentence) => {
      sentenceOrdinal += 1

      const segment = createSubtitleCorpusSegment({
        id: `${contentItemId}:${sentenceOrdinal}`,
        sourceId: cue.id,
        text: sentence,
        startOffset: Math.round(cue.startSeconds * 1000),
        endOffset: Math.round(cue.endSeconds * 1000),
        capturedAt: new Date(input.createdAt).toISOString(),
      })

      return {
        id: buildContentBlockId({
          sourceType: 'srt',
          sourceLocator,
          contentItemCreatedAt: input.createdAt,
          sentenceOrdinal,
        }),
        contentItemId,
        korean: segment.text,
        romanization: null,
        tokens: null,
        annotations: {},
        difficulty: input.importInput.difficulty,
        sourceType: 'srt' as const,
        audioOffset: cue.startSeconds,
        sentenceOrdinal,
        createdAt: input.createdAt,
      }
    }),
  )

  return {
    item: {
      id: contentItemId,
      title,
      sourceType: 'srt',
      difficulty: input.importInput.difficulty,
      difficultyLabel: toDifficultyBadge(input.importInput.difficulty),
      provenanceLabel: 'Subtitle import',
      sourceLocator,
      provenanceDetail: input.filePath ?? input.sourceReference,
      searchText: createSubtitleSearchText(title, subtitleLines),
      duplicateCheckText: createSubtitleDuplicateCheckText(subtitleLines),
      createdAt: input.createdAt,
    },
    blocks,
    sourceRecord: {
      contentItemId,
      originMode: 'file-import',
      filePath: input.filePath ?? input.sourceReference,
      url: null,
      sessionId: null,
      displaySource: input.filePath ?? input.sourceReference,
      requestedDifficulty: null,
      validatedDifficulty: null,
      capturedAt: input.createdAt,
    },
    ...(input.importInput.confirmDuplicate !== undefined
      ? { confirmDuplicate: input.importInput.confirmDuplicate }
      : {}),
  }
}