import type { SaveContentDraft } from '@sona/data/sqlite/content-library-repository'
import {
  buildContentBlockId,
  buildContentItemId,
  createGeneratedDuplicateCheckText,
  createGeneratedSearchText,
  deriveGeneratedTitle,
  formatGenerationProvenanceDetail,
  normalizeGeneratedSentences,
  PRACTICE_SENTENCE_MODELS,
  toDifficultyBadge,
  type RequiredDifficultyLevel,
} from '@sona/domain/content'
import { localJsSegmenter } from "@sona/domain/tokenizer/local-js-segmenter";
import type { GeneratePracticeSentencesInput } from '@sona/domain/contracts/content-library'
import { validateCorpusSegment } from '@sona/domain/provenance/corpus-segment'

import {
  OpenRouterContentGenerator,
  OpenRouterProviderUnavailableError,
  type PracticeSentenceGenerator,
} from '../providers/openrouter-content-generator.js'

interface GeneratedContentServiceRuntime {
  now: () => number
}

export class GeneratedContentProviderUnavailableError extends Error {}

export class GeneratedContentValidationRejectedError extends Error {}

export class GeneratedContentService {
  private lastIssuedTimestamp = 0

  constructor(
    private readonly generator: PracticeSentenceGenerator = new OpenRouterContentGenerator(),
    private readonly runtime: GeneratedContentServiceRuntime = { now: () => Date.now() },
  ) {}

  async createFromTopic(input: GeneratePracticeSentencesInput): Promise<SaveContentDraft> {
    const createdAt = this.getCreatedAtTimestamp()
    const sessionId = `generation-request:${createdAt}`

    try {
      const generated = await this.generator.generateSentences({
        topic: input.topic,
        difficulty: input.difficulty,
      })
      const validation = await this.generator.validateDifficulty({
        topic: input.topic,
        requestedDifficulty: input.difficulty,
        sentences: generated.sentences,
      })

      if (validation.validationOutcome === 'rejected' || validation.validatedDifficulty === null) {
        throw new GeneratedContentValidationRejectedError(validation.explanation)
      }

      return this.createDraft({
        topic: input.topic,
        title: generated.title,
        sentences: generated.sentences,
        requestedDifficulty: input.difficulty,
        validatedDifficulty: validation.validatedDifficulty,
        validationOutcome: validation.validationOutcome,
        createdAt,
        sessionId,
        ...(input.confirmDuplicate !== undefined ? { confirmDuplicate: input.confirmDuplicate } : {}),
      })
    } catch (error) {
      if (error instanceof OpenRouterProviderUnavailableError) {
        throw new GeneratedContentProviderUnavailableError(error.message)
      }

      throw error
    }
  }

  private getCreatedAtTimestamp() {
    const nextTimestamp = this.runtime.now()
    const createdAt = nextTimestamp > this.lastIssuedTimestamp ? nextTimestamp : this.lastIssuedTimestamp + 1
    this.lastIssuedTimestamp = createdAt
    return createdAt
  }

  private createDraft(input: {
    topic: string
    title: string
    sentences: string[]
    requestedDifficulty: RequiredDifficultyLevel
    validatedDifficulty: RequiredDifficultyLevel
    validationOutcome: 'accepted' | 'relabeled'
    createdAt: number
    sessionId: string
    confirmDuplicate?: boolean
  }): SaveContentDraft {
    const normalizedSentences = normalizeGeneratedSentences(input.sentences)
    if (normalizedSentences.length === 0) {
      throw new Error('Generated content did not contain any usable Korean sentences.')
    }

    const title = input.title.trim().length > 0 ? input.title.trim() : deriveGeneratedTitle(input.topic)
    const contentItemId = buildContentItemId({
      sourceType: 'generated',
      sourceLocator: input.sessionId,
      createdAt: input.createdAt,
    })

    const blocks = normalizedSentences.map((sentence, index) => {
      const sentenceOrdinal = index + 1
      const segment = validateCorpusSegment({
        id: `${contentItemId}:${sentenceOrdinal}`,
        sourceId: input.sessionId,
        sourceType: 'generated-sentence',
        stratum: 'generated',
        text: sentence,
        learnerApproved: true,
        capturedAt: new Date(input.createdAt).toISOString(),
      })

      return {
        id: buildContentBlockId({
          sourceType: "generated",
          sourceLocator: input.sessionId,
          contentItemCreatedAt: input.createdAt,
          sentenceOrdinal,
        }),
        contentItemId,
        korean: segment.text,
        romanization: null,
        tokens: localJsSegmenter
          .tokenize(segment.text)
          .map((surface) => ({ surface, normalized: surface })),
        annotations: {},
        difficulty: input.validatedDifficulty,
        sourceType: "generated" as const,
        audioOffset: null,
        sentenceOrdinal,
        createdAt: input.createdAt,
      };
    })

    const provenanceDetail = formatGenerationProvenanceDetail({
      topic: input.topic,
      requestedDifficulty: input.requestedDifficulty,
      validatedDifficulty: input.validatedDifficulty,
      validationOutcome: input.validationOutcome,
      requestedDifficultyBadge: toDifficultyBadge(input.requestedDifficulty),
      validatedDifficultyBadge: toDifficultyBadge(input.validatedDifficulty),
    })

    return {
      item: {
        id: contentItemId,
        title,
        sourceType: 'generated',
        difficulty: input.validatedDifficulty,
        difficultyLabel: toDifficultyBadge(input.validatedDifficulty),
        provenanceLabel: 'Generation request',
        sourceLocator: input.sessionId,
        provenanceDetail,
        searchText: createGeneratedSearchText(title, input.topic, normalizedSentences),
        duplicateCheckText: createGeneratedDuplicateCheckText(normalizedSentences),
        createdAt: input.createdAt,
      },
      blocks,
      sourceRecord: {
        contentItemId,
        originMode: 'generation-request',
        filePath: null,
        url: null,
        sessionId: input.sessionId,
        displaySource: provenanceDetail,
        requestedDifficulty: input.requestedDifficulty,
        validatedDifficulty: input.validatedDifficulty,
        capturedAt: input.createdAt,
      },
      generationRequest: {
        sessionId: input.sessionId,
        topic: input.topic.trim(),
        requestedDifficulty: input.requestedDifficulty,
        generatorModel: PRACTICE_SENTENCE_MODELS.generator,
        validatorModel: PRACTICE_SENTENCE_MODELS.validator,
        validatedDifficulty: input.validatedDifficulty,
        validationOutcome: input.validationOutcome,
        createdAt: input.createdAt,
      },
      ...(input.confirmDuplicate !== undefined ? { confirmDuplicate: input.confirmDuplicate } : {}),
    }
  }
}