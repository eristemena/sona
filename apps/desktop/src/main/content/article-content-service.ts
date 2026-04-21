import type { SaveContentDraft } from '@sona/data/sqlite/content-library-repository'
import {
  buildContentBlockId,
  buildContentItemId,
  createArticleDuplicateCheckText,
  createArticleSearchText,
  deriveArticleTitle,
  normalizeArticleText,
  splitKoreanArticleSentences,
  toDifficultyBadge,
} from '@sona/domain/content'
import { localJsSegmenter } from "@sona/domain/tokenizer/local-js-segmenter";
import type { CreateArticleFromPasteInput, CreateArticleFromUrlInput } from '@sona/domain/contracts/content-library'
import { validateCorpusSegment } from '@sona/domain/provenance/corpus-segment'

import { ArticleScraper } from '../providers/article-scraper.js'

interface ArticleContentServiceRuntime {
  now: () => number
}

export class ArticleContentService {
  private lastIssuedTimestamp = 0

  constructor(
    private readonly articleScraper: ArticleScraper = new ArticleScraper(),
    private readonly runtime: ArticleContentServiceRuntime = { now: () => Date.now() },
  ) {}

  private getCreatedAtTimestamp() {
    const nextTimestamp = this.runtime.now()
    const createdAt = nextTimestamp > this.lastIssuedTimestamp ? nextTimestamp : this.lastIssuedTimestamp + 1
    this.lastIssuedTimestamp = createdAt
    return createdAt
  }

  createFromPaste(input: CreateArticleFromPasteInput): SaveContentDraft {
    const createdAt = this.getCreatedAtTimestamp()
    const sessionId = `article-paste:${createdAt}`

    return this.createDraft({
      text: input.text,
      difficulty: input.difficulty,
      createdAt,
      sourceLocator: sessionId,
      provenanceLabel: 'Article paste',
      provenanceDetail: 'Pasted from the learner clipboard.',
      originMode: 'article-paste',
      sessionId,
      url: null,
      ...(input.title !== undefined ? { providedTitle: input.title } : {}),
      ...(input.confirmDuplicate !== undefined ? { confirmDuplicate: input.confirmDuplicate } : {}),
    })
  }

  async createFromUrl(input: CreateArticleFromUrlInput): Promise<SaveContentDraft> {
    const scrapedArticle = await this.articleScraper.scrape(input.url)
    const createdAt = this.getCreatedAtTimestamp()

    return this.createDraft({
      text: scrapedArticle.text,
      difficulty: input.difficulty,
      createdAt,
      sourceLocator: scrapedArticle.url,
      provenanceLabel: 'Article scrape',
      provenanceDetail: scrapedArticle.url,
      originMode: 'article-scrape',
      sessionId: null,
      url: scrapedArticle.url,
      ...(input.title !== undefined ? { providedTitle: input.title } : {}),
      ...(scrapedArticle.title !== null ? { scrapedTitle: scrapedArticle.title } : {}),
      ...(input.confirmDuplicate !== undefined ? { confirmDuplicate: input.confirmDuplicate } : {}),
    })
  }

  private createDraft(input: {
    text: string
    providedTitle?: string
    scrapedTitle?: string | null
    difficulty: CreateArticleFromPasteInput['difficulty']
    createdAt: number
    sourceLocator: string
    provenanceLabel: string
    provenanceDetail: string
    originMode: 'article-paste' | 'article-scrape'
    sessionId: string | null
    url: string | null
    confirmDuplicate?: boolean
  }): SaveContentDraft {
    const normalizedText = normalizeArticleText(input.text)
    if (!normalizedText) {
      throw new Error('Paste Korean article text to continue.')
    }

    const sentences = splitKoreanArticleSentences(normalizedText)
    if (sentences.length === 0) {
      throw new Error('The article did not contain any usable Korean sentences.')
    }

    const title = deriveArticleTitle({
      ...(input.providedTitle !== undefined ? { providedTitle: input.providedTitle } : {}),
      ...(input.scrapedTitle !== undefined ? { scrapedTitle: input.scrapedTitle } : {}),
      ...(input.url !== null ? { url: input.url } : {}),
      text: normalizedText,
    })
    const contentItemId = buildContentItemId({
      sourceType: 'article',
      sourceLocator: input.sourceLocator,
      createdAt: input.createdAt,
    })

    const blocks = sentences.map((sentence, index) => {
      const sentenceOrdinal = index + 1
      const segment = validateCorpusSegment({
        id: `${contentItemId}:${sentenceOrdinal}`,
        sourceId: input.sourceLocator,
        sourceType: 'article',
        stratum: 'article',
        text: sentence,
        learnerApproved: true,
        capturedAt: new Date(input.createdAt).toISOString(),
      })

      return {
        id: buildContentBlockId({
          sourceType: "article",
          sourceLocator: input.sourceLocator,
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
        difficulty: input.difficulty,
        sourceType: "article" as const,
        audioOffset: null,
        sentenceOrdinal,
        createdAt: input.createdAt,
      };
    })

    return {
      item: {
        id: contentItemId,
        title,
        sourceType: 'article',
        difficulty: input.difficulty,
        difficultyLabel: toDifficultyBadge(input.difficulty),
        provenanceLabel: input.provenanceLabel,
        sourceLocator: input.sourceLocator,
        provenanceDetail: input.provenanceDetail,
        searchText: createArticleSearchText(title, sentences, input.provenanceDetail),
        duplicateCheckText: createArticleDuplicateCheckText(sentences),
        createdAt: input.createdAt,
      },
      blocks,
      sourceRecord: {
        contentItemId,
        originMode: input.originMode,
        filePath: null,
        url: input.url,
        sessionId: input.sessionId,
        displaySource: input.provenanceDetail,
        requestedDifficulty: null,
        validatedDifficulty: null,
        capturedAt: input.createdAt,
      },
      ...(input.confirmDuplicate !== undefined ? { confirmDuplicate: input.confirmDuplicate } : {}),
    }
  }
}