import type Database from 'better-sqlite3'

import {
  normalizeSearchText,
  toDifficultyBadge,
  type Annotation,
  type ContentBlock,
  type ContentLibraryItem,
  type ContentSourceRecord,
  type DuplicateCheckResult,
  type GenerationRequest,
  type LibraryFilter,
  type RequiredDifficultyLevel,
  type Token,
} from '@sona/domain/content'
import type {
  DeleteContentResult,
  DuplicateWarningResult,
  ListLibraryItemsInput,
  SaveContentFailure,
  SaveContentResult,
  SaveContentSuccess,
} from '@sona/domain/contracts/content-library'

interface ContentLibraryItemRow {
  id: string
  title: string
  source_type: ContentLibraryItem['sourceType']
  difficulty: RequiredDifficultyLevel
  provenance_label: string
  provenance_detail: string
  created_at: number
}

interface ContentBlockRow {
  id: string
  content_item_id: string
  korean: string
  romanization: string | null
  tokens_json: string | null
  annotations_json: string
  difficulty: RequiredDifficultyLevel
  source_type: ContentBlock['sourceType']
  audio_offset: number | null
  sentence_ordinal: number
  created_at: number
}

export interface SaveContentDraft {
  item: ContentLibraryItem
  blocks: ContentBlock[]
  sourceRecord: ContentSourceRecord
  generationRequest?: GenerationRequest
  confirmDuplicate?: boolean
}

export class SqliteContentLibraryRepository {
  constructor(private readonly database: Database.Database) {}

  listLibraryItems(input: ListLibraryItemsInput = {}): SaveContentSuccess['item'][] {
    const clauses: string[] = []
    const params: Record<string, unknown> = {}

    if (input.filter && input.filter !== 'all') {
      clauses.push('source_type = @filter')
      params.filter = input.filter
    }

    const normalizedSearch = input.search ? normalizeSearchText(input.search) : ''
    if (normalizedSearch) {
      clauses.push('search_text LIKE @search')
      params.search = `%${normalizedSearch}%`
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''
    const rows = this.database
      .prepare(
        `
          SELECT
            id,
            title,
            source_type,
            difficulty,
            provenance_label,
            provenance_detail,
            created_at,
            (
              SELECT COUNT(*) FROM content_blocks WHERE content_item_id = content_library_items.id
            ) AS block_count
          FROM content_library_items
          ${whereClause}
          ORDER BY created_at DESC
        `,
      )
      .all(params) as Array<ContentLibraryItemRow & { block_count: number }>

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      sourceType: row.source_type,
      difficulty: row.difficulty,
      difficultyBadge: toDifficultyBadge(row.difficulty),
      provenanceLabel: row.provenance_label,
      provenanceDetail: row.provenance_detail,
      createdAt: row.created_at,
      blockCount: row.block_count,
    }))
  }

  getContentBlocks(contentItemId: string): Array<SaveContentSuccess['blocks'][number]> {
    const rows = this.database
      .prepare(
        `
          SELECT
            id,
            content_item_id,
            korean,
            romanization,
            tokens_json,
            annotations_json,
            difficulty,
            source_type,
            audio_offset,
            sentence_ordinal,
            created_at
          FROM content_blocks
          WHERE content_item_id = ?
          ORDER BY sentence_ordinal ASC
        `,
      )
      .all(contentItemId) as ContentBlockRow[]

    return rows.map(mapBlockRow)
  }

  deleteContent(contentItemId: string): DeleteContentResult {
    this.database.prepare('DELETE FROM content_library_items WHERE id = ?').run(contentItemId)
    return { deletedId: contentItemId }
  }

  findDuplicateCandidates(duplicateCheckText: string): DuplicateCheckResult {
    const normalized = normalizeSearchText(duplicateCheckText)
    if (!normalized) {
      return {
        isDuplicateCandidate: false,
        matchingItemIds: [],
        requiresConfirmation: false,
      }
    }

    const rows = this.database
      .prepare('SELECT id FROM content_library_items WHERE duplicate_check_text = ? ORDER BY created_at DESC')
      .all(normalized) as Array<{ id: string }>

    return {
      isDuplicateCandidate: rows.length > 0,
      matchingItemIds: rows.map((row) => row.id),
      requiresConfirmation: rows.length > 0,
    }
  }

  saveContent(input: SaveContentDraft): SaveContentResult {
    const duplicateCheck = this.findDuplicateCandidates(input.item.duplicateCheckText)
    if (duplicateCheck.requiresConfirmation && !input.confirmDuplicate) {
      const warning: DuplicateWarningResult = {
        ok: false,
        reason: 'duplicate-warning',
        message: 'Similar content already exists in the library. Confirm save to continue.',
        matchingItemIds: duplicateCheck.matchingItemIds,
      }

      return warning
    }

    if (input.blocks.length === 0) {
      const failure: SaveContentFailure = {
        ok: false,
        reason: 'invalid-input',
        message: 'At least one sentence block is required to save content.',
      }

      return failure
    }

    const insertItem = this.database.prepare(
      `
        INSERT INTO content_library_items (
          id,
          title,
          source_type,
          difficulty,
          source_locator,
          provenance_label,
          provenance_detail,
          search_text,
          duplicate_check_text,
          created_at
        ) VALUES (
          @id,
          @title,
          @source_type,
          @difficulty,
          @source_locator,
          @provenance_label,
          @provenance_detail,
          @search_text,
          @duplicate_check_text,
          @created_at
        )
      `,
    )

    const insertBlock = this.database.prepare(
      `
        INSERT INTO content_blocks (
          id,
          content_item_id,
          sentence_ordinal,
          korean,
          romanization,
          tokens_json,
          annotations_json,
          difficulty,
          source_type,
          audio_offset,
          created_at
        ) VALUES (
          @id,
          @content_item_id,
          @sentence_ordinal,
          @korean,
          @romanization,
          @tokens_json,
          @annotations_json,
          @difficulty,
          @source_type,
          @audio_offset,
          @created_at
        )
      `,
    )

    const insertSourceRecord = this.database.prepare(
      `
        INSERT INTO content_source_records (
          content_item_id,
          origin_mode,
          file_path,
          url,
          session_id,
          display_source,
          requested_difficulty,
          validated_difficulty,
          captured_at
        ) VALUES (
          @content_item_id,
          @origin_mode,
          @file_path,
          @url,
          @session_id,
          @display_source,
          @requested_difficulty,
          @validated_difficulty,
          @captured_at
        )
      `,
    )

    const insertGenerationRequest = this.database.prepare(
      `
        INSERT INTO generation_requests (
          session_id,
          topic,
          requested_difficulty,
          validated_difficulty,
          validation_outcome,
          generator_model,
          validator_model,
          created_at
        ) VALUES (
          @session_id,
          @topic,
          @requested_difficulty,
          @validated_difficulty,
          @validation_outcome,
          @generator_model,
          @validator_model,
          @created_at
        )
      `,
    )

    const transaction = this.database.transaction(() => {
      insertItem.run({
        id: input.item.id,
        title: input.item.title,
        source_type: input.item.sourceType,
        difficulty: input.item.difficulty,
        source_locator: input.item.sourceLocator,
        provenance_label: input.item.provenanceLabel,
        provenance_detail: input.item.provenanceDetail,
        search_text: input.item.searchText,
        duplicate_check_text: input.item.duplicateCheckText,
        created_at: input.item.createdAt,
      })

      for (const block of input.blocks) {
        insertBlock.run({
          id: block.id,
          content_item_id: block.contentItemId,
          sentence_ordinal: block.sentenceOrdinal,
          korean: block.korean,
          romanization: block.romanization,
          tokens_json: block.tokens ? JSON.stringify(block.tokens) : null,
          annotations_json: JSON.stringify(block.annotations),
          difficulty: block.difficulty,
          source_type: block.sourceType,
          audio_offset: block.audioOffset,
          created_at: block.createdAt,
        })
      }

      insertSourceRecord.run({
        content_item_id: input.sourceRecord.contentItemId,
        origin_mode: input.sourceRecord.originMode,
        file_path: input.sourceRecord.filePath,
        url: input.sourceRecord.url,
        session_id: input.sourceRecord.sessionId,
        display_source: input.sourceRecord.displaySource,
        requested_difficulty: input.sourceRecord.requestedDifficulty,
        validated_difficulty: input.sourceRecord.validatedDifficulty,
        captured_at: input.sourceRecord.capturedAt,
      })

      if (input.generationRequest) {
        insertGenerationRequest.run({
          session_id: input.generationRequest.sessionId,
          topic: input.generationRequest.topic,
          requested_difficulty: input.generationRequest.requestedDifficulty,
          validated_difficulty: input.generationRequest.validatedDifficulty,
          validation_outcome: input.generationRequest.validationOutcome,
          generator_model: input.generationRequest.generatorModel,
          validator_model: input.generationRequest.validatorModel,
          created_at: input.generationRequest.createdAt,
        })
      }
    })

    transaction()

    return {
      ok: true,
      item: {
        id: input.item.id,
        title: input.item.title,
        sourceType: input.item.sourceType,
        difficulty: input.item.difficulty,
        difficultyBadge: input.item.difficultyLabel,
        provenanceLabel: input.item.provenanceLabel,
        provenanceDetail: input.item.provenanceDetail,
        createdAt: input.item.createdAt,
        blockCount: input.blocks.length,
      },
      blocks: input.blocks.map((block) => ({
        id: block.id,
        korean: block.korean,
        romanization: block.romanization,
        tokens: block.tokens,
        annotations: block.annotations,
        difficulty: block.difficulty,
        sourceType: block.sourceType,
        audioOffset: block.audioOffset,
        sentenceOrdinal: block.sentenceOrdinal,
        createdAt: block.createdAt,
      })),
    }
  }
}

function mapBlockRow(row: ContentBlockRow): SaveContentSuccess['blocks'][number] {
  return {
    id: row.id,
    korean: row.korean,
    romanization: row.romanization,
    tokens: row.tokens_json ? (JSON.parse(row.tokens_json) as Token[]) : null,
    annotations: JSON.parse(row.annotations_json) as Record<string, Annotation | null>,
    difficulty: row.difficulty,
    sourceType: row.source_type,
    audioOffset: row.audio_offset,
    sentenceOrdinal: row.sentence_ordinal,
    createdAt: row.created_at,
  }
}