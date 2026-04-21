import type Database from "better-sqlite3";
import { localJsSegmenter } from "@sona/domain/tokenizer/local-js-segmenter";

import {
  createDefaultReadingProgress,
  normalizeSearchText,
  toDifficultyBadge,
  type Annotation,
  type AnnotationCacheEntry,
  type ContentBlock,
  type ContentLibraryItem,
  type ContentSourceRecord,
  type DuplicateCheckResult,
  type ExposureLogEntry,
  type GenerationRequest,
  type LibraryFilter,
  type PersistedReadingAudioAsset,
  type ReadingAudioAsset,
  type ReadingBlock,
  type ReadingSessionSnapshot,
  type ReviewCardActivationState,
  type ReviewCardRecord,
  type RequiredDifficultyLevel,
  type SaveReadingProgressInput,
  type Token,
  type WordTiming,
} from "@sona/domain/content";
import type {
  DeleteContentResult,
  DuplicateWarningResult,
  ListLibraryItemsInput,
  SaveContentFailure,
  SaveContentResult,
  SaveContentSuccess,
} from "@sona/domain/contracts/content-library";

interface ContentLibraryItemRow {
  id: string;
  title: string;
  source_type: ContentLibraryItem["sourceType"];
  difficulty: RequiredDifficultyLevel;
  provenance_label: string;
  provenance_detail: string;
  created_at: number;
}

interface ContentBlockRow {
  id: string;
  content_item_id: string;
  korean: string;
  romanization: string | null;
  tokens_json: string | null;
  annotations_json: string;
  difficulty: RequiredDifficultyLevel;
  source_type: ContentBlock["sourceType"];
  audio_offset: number | null;
  sentence_ordinal: number;
  created_at: number;
}

interface ReadingProgressRow {
  content_item_id: string;
  active_block_id: string | null;
  playback_state: NonNullable<
    ReadingSessionSnapshot["progress"]["playbackState"]
  >;
  playback_rate: number;
  current_time_ms: number;
  highlighted_token_index: number | null;
  updated_at: number;
}

interface BlockAudioAssetRow {
  id: string;
  block_id: string;
  provider: PersistedReadingAudioAsset["provider"];
  model_id: string;
  voice: string;
  text_hash: string;
  audio_file_path: string | null;
  timing_format: PersistedReadingAudioAsset["timingFormat"];
  timings_json: string | null;
  duration_ms: number | null;
  generation_state: PersistedReadingAudioAsset["state"];
  failure_reason: string | null;
  generated_at: number | null;
  last_accessed_at: number;
}

interface AnnotationCacheRow {
  id: string;
  canonical_form: string;
  sentence_context_hash: string;
  surface: string;
  part_of_speech: string;
  english_gloss: string;
  romanization: string;
  grammar_note: string;
  grammar_explanation: string | null;
  model_id: string;
  response_json: string;
  created_at: number;
  refreshed_at: number;
  stale_after: number;
  last_served_at: number;
  refresh_state: AnnotationCacheEntry["refreshState"];
}

interface AnnotationResponseJson {
  register?: unknown;
  sentenceTranslation?: unknown;
  sentence_translation?: unknown;
  surface?: unknown;
  meaning?: unknown;
  pattern?: unknown;
}

interface ReviewCardRow {
  id: string;
  canonical_form: string;
  surface: string;
  source_block_id: string;
  source_content_item_id: string;
  sentence_context_hash: string;
  fsrs_state: string;
  due_at: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  last_review_at: number | null;
  activation_state: ReviewCardRecord["activationState"];
  created_at: number;
}

export interface SaveContentDraft {
  item: ContentLibraryItem;
  blocks: ContentBlock[];
  sourceRecord: ContentSourceRecord;
  generationRequest?: GenerationRequest;
  confirmDuplicate?: boolean;
}

export class SqliteContentLibraryRepository {
  constructor(private readonly database: Database.Database) {}

  listLibraryItems(
    input: ListLibraryItemsInput = {},
  ): SaveContentSuccess["item"][] {
    const clauses: string[] = [];
    const params: Record<string, unknown> = {};

    if (input.filter && input.filter !== "all") {
      clauses.push("source_type = @filter");
      params.filter = input.filter;
    }

    const normalizedSearch = input.search
      ? normalizeSearchText(input.search)
      : "";
    if (normalizedSearch) {
      clauses.push("search_text LIKE @search");
      params.search = `%${normalizedSearch}%`;
    }

    const whereClause =
      clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
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
      .all(params) as Array<ContentLibraryItemRow & { block_count: number }>;

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
    }));
  }

  getContentBlocks(
    contentItemId: string,
  ): Array<SaveContentSuccess["blocks"][number]> {
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
      .all(contentItemId) as ContentBlockRow[];

    return rows.map(mapBlockRow);
  }

  deleteContent(contentItemId: string): DeleteContentResult {
    this.database
      .prepare("DELETE FROM content_library_items WHERE id = ?")
      .run(contentItemId);
    return { deletedId: contentItemId };
  }

  getReadingSession(contentItemId: string): ReadingSessionSnapshot | null {
    const item = this.database
      .prepare(
        `
          SELECT id, title, provenance_label, provenance_detail
          FROM content_library_items
          WHERE id = ?
        `,
      )
      .get(contentItemId) as
      | {
          id: string;
          title: string;
          provenance_label: string;
          provenance_detail: string;
        }
      | undefined;

    if (!item) {
      return null;
    }

    const blocks = this.database
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
      .all(contentItemId) as ContentBlockRow[];

    const progress = this.database
      .prepare(
        `
          SELECT
            content_item_id,
            active_block_id,
            playback_state,
            playback_rate,
            current_time_ms,
            highlighted_token_index,
            updated_at
          FROM reading_progress
          WHERE content_item_id = ?
        `,
      )
      .get(contentItemId) as ReadingProgressRow | undefined;

    return {
      contentItemId: item.id,
      itemTitle: item.title,
      provenanceLabel: item.provenance_label,
      provenanceDetail: item.provenance_detail,
      blocks: blocks.map(mapReadingBlockRow),
      progress: progress
        ? {
            activeBlockId: progress.active_block_id,
            playbackState: progress.playback_state,
            playbackRate: progress.playback_rate,
            currentTimeMs: progress.current_time_ms,
            highlightedTokenIndex: progress.highlighted_token_index,
          }
        : createDefaultReadingProgress(),
    };
  }

  getReadingBlock(blockId: string): ReadingBlock | null {
    const row = this.database
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
          WHERE id = ?
        `,
      )
      .get(blockId) as ContentBlockRow | undefined;

    return row ? mapReadingBlockRow(row) : null;
  }

  saveReadingProgress(input: SaveReadingProgressInput): void {
    this.database
      .prepare(
        `
          INSERT INTO reading_progress (
            content_item_id,
            active_block_id,
            playback_state,
            playback_rate,
            current_time_ms,
            highlighted_token_index,
            updated_at
          ) VALUES (
            @content_item_id,
            @active_block_id,
            @playback_state,
            @playback_rate,
            @current_time_ms,
            @highlighted_token_index,
            @updated_at
          )
          ON CONFLICT(content_item_id) DO UPDATE SET
            active_block_id = excluded.active_block_id,
            playback_state = excluded.playback_state,
            playback_rate = excluded.playback_rate,
            current_time_ms = excluded.current_time_ms,
            highlighted_token_index = excluded.highlighted_token_index,
            updated_at = excluded.updated_at
        `,
      )
      .run({
        content_item_id: input.contentItemId,
        active_block_id: input.activeBlockId,
        playback_state: input.playbackState,
        playback_rate: input.playbackRate,
        current_time_ms: input.currentTimeMs,
        highlighted_token_index: input.highlightedTokenIndex,
        updated_at: Date.now(),
      });
  }

  getBlockAudioAsset(blockId: string): ReadingAudioAsset | null {
    const row = this.database
      .prepare(
        `
          SELECT
            id,
            block_id,
            provider,
            model_id,
            voice,
            text_hash,
            audio_file_path,
            timing_format,
            timings_json,
            duration_ms,
            generation_state,
            failure_reason,
            generated_at,
            last_accessed_at
          FROM block_audio_assets
          WHERE block_id = ?
          ORDER BY last_accessed_at DESC
          LIMIT 1
        `,
      )
      .get(blockId) as BlockAudioAssetRow | undefined;

    return row ? mapReadingAudioAssetRow(row) : null;
  }

  getBlockAudioAssetForCacheKey(
    blockId: string,
    modelId: string,
    voice: string,
    textHash: string,
  ): ReadingAudioAsset | null {
    const row = this.database
      .prepare(
        `
          SELECT
            id,
            block_id,
            provider,
            model_id,
            voice,
            text_hash,
            audio_file_path,
            timing_format,
            timings_json,
            duration_ms,
            generation_state,
            failure_reason,
            generated_at,
            last_accessed_at
          FROM block_audio_assets
          WHERE block_id = ?
            AND model_id = ?
            AND voice = ?
            AND text_hash = ?
          LIMIT 1
        `,
      )
      .get(blockId, modelId, voice, textHash) as BlockAudioAssetRow | undefined;

    return row ? mapReadingAudioAssetRow(row) : null;
  }

  listPersistedBlockAudioAssets(blockId: string): PersistedReadingAudioAsset[] {
    const rows = this.database
      .prepare(
        `
          SELECT
            id,
            block_id,
            provider,
            model_id,
            voice,
            text_hash,
            audio_file_path,
            timing_format,
            timings_json,
            duration_ms,
            generation_state,
            failure_reason,
            generated_at,
            last_accessed_at
          FROM block_audio_assets
          WHERE block_id = ?
          ORDER BY last_accessed_at DESC
        `,
      )
      .all(blockId) as BlockAudioAssetRow[];

    return rows.map(mapPersistedReadingAudioAssetRow);
  }

  markBlockAudioAssetAccessed(
    blockId: string,
    modelId: string,
    voice: string,
    textHash: string,
    lastAccessedAt: number,
  ): void {
    this.database
      .prepare(
        `
          UPDATE block_audio_assets
          SET last_accessed_at = ?
          WHERE block_id = ?
            AND model_id = ?
            AND voice = ?
            AND text_hash = ?
        `,
      )
      .run(lastAccessedAt, blockId, modelId, voice, textHash);
  }

  deleteBlockAudioAssetsForBlockExcept(
    blockId: string,
    modelId: string,
    voice: string,
    textHash: string,
  ): void {
    this.database
      .prepare(
        `
          DELETE FROM block_audio_assets
          WHERE block_id = ?
            AND NOT (
              model_id = ?
              AND voice = ?
              AND text_hash = ?
            )
        `,
      )
      .run(blockId, modelId, voice, textHash);
  }

  saveBlockAudioAsset(asset: PersistedReadingAudioAsset): void {
    this.database
      .prepare(
        `
          INSERT INTO block_audio_assets (
            id,
            block_id,
            provider,
            model_id,
            voice,
            text_hash,
            audio_file_path,
            timing_format,
            timings_json,
            duration_ms,
            generation_state,
            failure_reason,
            generated_at,
            last_accessed_at
          ) VALUES (
            @id,
            @block_id,
            @provider,
            @model_id,
            @voice,
            @text_hash,
            @audio_file_path,
            @timing_format,
            @timings_json,
            @duration_ms,
            @generation_state,
            @failure_reason,
            @generated_at,
            @last_accessed_at
          )
          ON CONFLICT(block_id, model_id, voice, text_hash) DO UPDATE SET
            audio_file_path = excluded.audio_file_path,
            timings_json = excluded.timings_json,
            duration_ms = excluded.duration_ms,
            generation_state = excluded.generation_state,
            failure_reason = excluded.failure_reason,
            generated_at = excluded.generated_at,
            last_accessed_at = excluded.last_accessed_at
        `,
      )
      .run({
        id: asset.id,
        block_id: asset.blockId,
        provider: asset.provider,
        model_id: asset.modelId,
        voice: asset.voice,
        text_hash: asset.textHash,
        audio_file_path: asset.audioFilePath,
        timing_format: asset.timingFormat,
        timings_json: JSON.stringify(asset.timings),
        duration_ms: asset.durationMs,
        generation_state: asset.state,
        failure_reason: asset.failureReason,
        generated_at: asset.generatedAt,
        last_accessed_at: asset.lastAccessedAt,
      });
  }

  findAnnotationForLookup(input: {
    surface: string;
    canonicalForm?: string | null;
    sentenceContextHash: string;
  }): AnnotationCacheEntry | null {
    const row = this.database
      .prepare(
        `
          SELECT
            id,
            canonical_form,
            sentence_context_hash,
            surface,
            part_of_speech,
            english_gloss,
            romanization,
            grammar_note,
            grammar_explanation,
            model_id,
            response_json,
            created_at,
            refreshed_at,
            stale_after,
            last_served_at,
            refresh_state
          FROM annotations
          WHERE sentence_context_hash = @sentence_context_hash
            AND (
              surface = @surface
              OR canonical_form = @surface
              OR (@canonical_form IS NOT NULL AND canonical_form = @canonical_form)
            )
          ORDER BY
            CASE
              WHEN @canonical_form IS NOT NULL AND canonical_form = @canonical_form THEN 0
              WHEN surface = @surface THEN 1
              ELSE 2
            END,
            refreshed_at DESC
          LIMIT 1
        `,
      )
      .get({
        sentence_context_hash: input.sentenceContextHash,
        surface: input.surface,
        canonical_form: input.canonicalForm ?? null,
      }) as AnnotationCacheRow | undefined;

    return row ? mapAnnotationCacheRow(row) : null;
  }

  saveAnnotationCacheEntry(entry: AnnotationCacheEntry): void {
    this.database
      .prepare(
        `
          INSERT INTO annotations (
            id,
            canonical_form,
            sentence_context_hash,
            surface,
            part_of_speech,
            english_gloss,
            romanization,
            grammar_note,
            grammar_explanation,
            model_id,
            response_json,
            created_at,
            refreshed_at,
            stale_after,
            last_served_at,
            refresh_state
          ) VALUES (
            @id,
            @canonical_form,
            @sentence_context_hash,
            @surface,
            @part_of_speech,
            @english_gloss,
            @romanization,
            @grammar_note,
            @grammar_explanation,
            @model_id,
            @response_json,
            @created_at,
            @refreshed_at,
            @stale_after,
            @last_served_at,
            @refresh_state
          )
          ON CONFLICT(canonical_form, sentence_context_hash) DO UPDATE SET
            surface = excluded.surface,
            part_of_speech = excluded.part_of_speech,
            english_gloss = excluded.english_gloss,
            romanization = excluded.romanization,
            grammar_note = excluded.grammar_note,
            grammar_explanation = excluded.grammar_explanation,
            model_id = excluded.model_id,
            response_json = excluded.response_json,
            refreshed_at = excluded.refreshed_at,
            stale_after = excluded.stale_after,
            last_served_at = excluded.last_served_at,
            refresh_state = excluded.refresh_state
        `,
      )
      .run({
        id: entry.id,
        canonical_form: entry.canonicalForm,
        sentence_context_hash: entry.sentenceContextHash,
        surface: entry.surface,
        part_of_speech: entry.pattern,
        english_gloss: entry.meaning,
        romanization: entry.romanization,
        grammar_note: entry.sentenceTranslation,
        grammar_explanation: entry.grammarExplanation,
        model_id: entry.modelId,
        response_json: entry.responseJson,
        created_at: entry.createdAt,
        refreshed_at: entry.refreshedAt,
        stale_after: entry.staleAfter,
        last_served_at: entry.lastServedAt,
        refresh_state: entry.refreshState,
      });
  }

  saveReviewCard(card: ReviewCardRecord): void {
    this.database
      .prepare(
        `
          INSERT OR REPLACE INTO review_cards (
            id,
            canonical_form,
            surface,
            source_block_id,
            source_content_item_id,
            sentence_context_hash,
            fsrs_state,
            due_at,
            stability,
            difficulty,
            elapsed_days,
            scheduled_days,
            reps,
            lapses,
            last_review_at,
            activation_state,
            created_at
          ) VALUES (
            @id,
            @canonical_form,
            @surface,
            @source_block_id,
            @source_content_item_id,
            @sentence_context_hash,
            @fsrs_state,
            @due_at,
            @stability,
            @difficulty,
            @elapsed_days,
            @scheduled_days,
            @reps,
            @lapses,
            @last_review_at,
            @activation_state,
            @created_at
          )
        `,
      )
      .run({
        id: card.id,
        canonical_form: card.canonicalForm,
        surface: card.surface,
        source_block_id: card.sourceBlockId,
        source_content_item_id: card.sourceContentItemId,
        sentence_context_hash: card.sentenceContextHash,
        fsrs_state: card.fsrsState,
        due_at: card.dueAt,
        stability: card.stability,
        difficulty: card.difficulty,
        elapsed_days: card.elapsedDays,
        scheduled_days: card.scheduledDays,
        reps: card.reps,
        lapses: card.lapses,
        last_review_at: card.lastReviewAt,
        activation_state: card.activationState,
        created_at: card.createdAt,
      });
  }

  findActiveReviewCard(canonicalForm: string): ReviewCardRecord | null {
    const row = this.database
      .prepare(
        `
          SELECT
            id,
            canonical_form,
            surface,
            source_block_id,
            source_content_item_id,
            sentence_context_hash,
            fsrs_state,
            due_at,
            stability,
            difficulty,
            elapsed_days,
            scheduled_days,
            reps,
            lapses,
            last_review_at,
            activation_state,
            created_at
          FROM review_cards
          WHERE canonical_form = ?
            AND activation_state = 'active'
          ORDER BY created_at DESC
          LIMIT 1
        `,
      )
      .get(canonicalForm) as ReviewCardRow | undefined;

    return row ? mapReviewCardRow(row) : null;
  }

  getReviewCard(reviewCardId: string): ReviewCardRecord | null {
    const row = this.database
      .prepare(
        `
          SELECT
            id,
            canonical_form,
            surface,
            source_block_id,
            source_content_item_id,
            sentence_context_hash,
            fsrs_state,
            due_at,
            stability,
            difficulty,
            elapsed_days,
            scheduled_days,
            reps,
            lapses,
            last_review_at,
            activation_state,
            created_at
          FROM review_cards
          WHERE id = ?
          LIMIT 1
        `,
      )
      .get(reviewCardId) as ReviewCardRow | undefined;

    return row ? mapReviewCardRow(row) : null;
  }

  countReviewCards(
    activationStates: ReviewCardActivationState[] = ["active"],
  ): number {
    if (activationStates.length === 0) {
      return 0;
    }

    const placeholders = activationStates.map(() => "?").join(", ");
    const row = this.database
      .prepare(
        `
          SELECT COUNT(*) AS total
          FROM review_cards
          WHERE activation_state IN (${placeholders})
        `,
      )
      .get(...activationStates) as { total: number };

    return row.total;
  }

  flushExposureLog(entries: ExposureLogEntry[]): number {
    if (entries.length === 0) {
      return 0;
    }

    const insertEntry = this.database.prepare(
      `
        INSERT OR IGNORE INTO exposure_log (
          block_id,
          token,
          seen_at
        ) VALUES (?, ?, ?)
      `,
    );

    const transaction = this.database.transaction(
      (items: ExposureLogEntry[]) => {
        let written = 0;

        for (const entry of items) {
          const result = insertEntry.run(
            entry.blockId,
            entry.token,
            entry.seenAt,
          );
          written += result.changes;
        }

        return written;
      },
    );

    return transaction(entries);
  }

  findDuplicateCandidates(duplicateCheckText: string): DuplicateCheckResult {
    const normalized = normalizeSearchText(duplicateCheckText);
    if (!normalized) {
      return {
        isDuplicateCandidate: false,
        matchingItemIds: [],
        requiresConfirmation: false,
      };
    }

    const rows = this.database
      .prepare(
        "SELECT id FROM content_library_items WHERE duplicate_check_text = ? ORDER BY created_at DESC",
      )
      .all(normalized) as Array<{ id: string }>;

    return {
      isDuplicateCandidate: rows.length > 0,
      matchingItemIds: rows.map((row) => row.id),
      requiresConfirmation: rows.length > 0,
    };
  }

  saveContent(input: SaveContentDraft): SaveContentResult {
    const duplicateCheck = this.findDuplicateCandidates(
      input.item.duplicateCheckText,
    );
    if (duplicateCheck.requiresConfirmation && !input.confirmDuplicate) {
      const warning: DuplicateWarningResult = {
        ok: false,
        reason: "duplicate-warning",
        message:
          "Similar content already exists in the library. Confirm save to continue.",
        matchingItemIds: duplicateCheck.matchingItemIds,
      };

      return warning;
    }

    if (input.blocks.length === 0) {
      const failure: SaveContentFailure = {
        ok: false,
        reason: "invalid-input",
        message: "At least one sentence block is required to save content.",
      };

      return failure;
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
    );

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
    );

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
    );

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
    );

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
      });

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
        });
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
      });

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
        });
      }
    });

    transaction();

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
    };
  }
}

function mapBlockRow(
  row: ContentBlockRow,
): SaveContentSuccess["blocks"][number] {
  return {
    id: row.id,
    korean: row.korean,
    romanization: row.romanization,
    tokens: row.tokens_json ? (JSON.parse(row.tokens_json) as Token[]) : null,
    annotations: JSON.parse(row.annotations_json) as Record<
      string,
      Annotation | null
    >,
    difficulty: row.difficulty,
    sourceType: row.source_type,
    audioOffset: row.audio_offset,
    sentenceOrdinal: row.sentence_ordinal,
    createdAt: row.created_at,
  };
}

function mapReadingBlockRow(row: ContentBlockRow): ReadingBlock {
  const tokens = row.tokens_json
    ? (JSON.parse(row.tokens_json) as Token[])
    : createDerivedTokens(row.korean);

  return {
    id: row.id,
    contentItemId: row.content_item_id,
    korean: row.korean,
    romanization: row.romanization,
    tokens: tokens.map((token, index) => {
      const readingToken: ReadingBlock["tokens"][number] = {
        index,
        surface: token.surface,
      };

      if (typeof token.normalized === "string") {
        readingToken.normalized = token.normalized;
      }

      if (typeof token.start === "number") {
        readingToken.start = token.start;
      }

      if (typeof token.end === "number") {
        readingToken.end = token.end;
      }

      return readingToken;
    }),
    audioOffset: row.audio_offset,
    sentenceOrdinal: row.sentence_ordinal,
  };
}

function createDerivedTokens(text: string): Token[] {
  return localJsSegmenter.tokenize(text).map((surface) => ({
    surface,
    normalized: surface,
  }));
}

function mapReadingAudioAssetRow(row: BlockAudioAssetRow): ReadingAudioAsset {
  const asset: ReadingAudioAsset = {
    blockId: row.block_id,
    state: row.generation_state,
    audioFilePath: row.audio_file_path,
    durationMs: row.duration_ms,
    modelId: row.model_id,
    voice: row.voice,
    timings: row.timings_json
      ? (JSON.parse(row.timings_json) as WordTiming[])
      : [],
    fromCache: true,
  };

  if (row.failure_reason) {
    asset.failureMessage = row.failure_reason;
  }

  return asset;
}

function mapPersistedReadingAudioAssetRow(
  row: BlockAudioAssetRow,
): PersistedReadingAudioAsset {
  return {
    id: row.id,
    blockId: row.block_id,
    provider: row.provider,
    modelId: row.model_id,
    voice: row.voice,
    textHash: row.text_hash,
    audioFilePath: row.audio_file_path,
    timingFormat: row.timing_format,
    timings: row.timings_json
      ? (JSON.parse(row.timings_json) as WordTiming[])
      : [],
    durationMs: row.duration_ms,
    state: row.generation_state,
    failureReason: row.failure_reason,
    generatedAt: row.generated_at,
    lastAccessedAt: row.last_accessed_at,
  };
}

function mapAnnotationCacheRow(row: AnnotationCacheRow): AnnotationCacheEntry {
  const response = parseAnnotationResponseJson(row.response_json);

  return {
    id: row.id,
    canonicalForm: row.canonical_form,
    sentenceContextHash: row.sentence_context_hash,
    surface: normalizeCachedField(response.surface, row.surface),
    meaning: normalizeCachedField(response.meaning, row.english_gloss),
    romanization: row.romanization,
    pattern: normalizeCachedField(response.pattern, row.part_of_speech),
    register: normalizeCachedField(response.register, "Unknown register"),
    sentenceTranslation: normalizeCachedField(
      response.sentenceTranslation ?? response.sentence_translation,
      row.grammar_note,
    ),
    grammarExplanation: row.grammar_explanation,
    modelId: row.model_id,
    responseJson: row.response_json,
    createdAt: row.created_at,
    refreshedAt: row.refreshed_at,
    staleAfter: row.stale_after,
    lastServedAt: row.last_served_at,
    refreshState: row.refresh_state,
  };
}

function parseAnnotationResponseJson(value: string): AnnotationResponseJson {
  try {
    return JSON.parse(value) as AnnotationResponseJson;
  } catch {
    return {};
  }
}

function normalizeCachedField(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function mapReviewCardRow(row: ReviewCardRow): ReviewCardRecord {
  return {
    id: row.id,
    canonicalForm: row.canonical_form,
    surface: row.surface,
    sourceBlockId: row.source_block_id,
    sourceContentItemId: row.source_content_item_id,
    sentenceContextHash: row.sentence_context_hash,
    fsrsState: row.fsrs_state,
    dueAt: row.due_at,
    stability: row.stability,
    difficulty: row.difficulty,
    elapsedDays: row.elapsed_days,
    scheduledDays: row.scheduled_days,
    reps: row.reps,
    lapses: row.lapses,
    lastReviewAt: row.last_review_at,
    activationState: row.activation_state,
    createdAt: row.created_at,
  };
}
