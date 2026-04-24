import type Database from "better-sqlite3";
import { localJsSegmenter } from "@sona/domain/tokenizer/local-js-segmenter";
import type { HomeDashboardSnapshot } from '@sona/domain/content/home-dashboard'

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
  type KnownWordRecord,
  type LibraryFilter,
  type PersistedReadingAudioAsset,
  type ReadingAudioAsset,
  type ReadingBlock,
  type ReviewEventRecord,
  type ReadingSessionSnapshot,
  type ReviewCardActivationState,
  type ReviewCardRecord,
  type RequiredDifficultyLevel,
  type SaveReadingProgressInput,
  type UpdateReviewCardDetailsInput,
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
  meaning: string | null;
  grammar_pattern: string | null;
  grammar_details: string | null;
  romanization: string | null;
  sentence_context: string | null;
  sentence_translation: string | null;
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
  updated_at: number;
}

interface KnownWordRow {
  canonical_form: string;
  surface: string;
  source: KnownWordRecord["source"];
  source_detail: string | null;
  created_at: number;
  updated_at: number;
}

interface StudySessionRow {
  study_date: string
  cards_reviewed: number
  minutes_studied: number
}

interface ResumeContextRow {
  content_item_id: string
  title: string
  provenance_label: string
  active_block_id: string | null
  updated_at: number
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
            meaning,
            grammar_pattern,
            grammar_details,
            romanization,
            sentence_context,
            sentence_translation,
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
            created_at,
            updated_at
          ) VALUES (
            @id,
            @canonical_form,
            @surface,
            @meaning,
            @grammar_pattern,
            @grammar_details,
            @romanization,
            @sentence_context,
            @sentence_translation,
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
            @created_at,
            @updated_at
          )
        `,
      )
      .run({
        id: card.id,
        canonical_form: card.canonicalForm,
        surface: card.surface,
        meaning: card.meaning,
        grammar_pattern: card.grammarPattern,
        grammar_details: card.grammarDetails,
        romanization: card.romanization,
        sentence_context: card.sentenceContext,
        sentence_translation: card.sentenceTranslation,
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
        updated_at: card.updatedAt,
      });
  }

  saveReviewEvent(event: ReviewEventRecord): void {
    this.database
      .prepare(
        `
        INSERT INTO review_events (
          id,
          review_card_id,
          rating,
          fsrs_grade,
          reviewed_at,
          previous_state,
          next_state,
          previous_due_at,
          next_due_at,
          scheduled_days
        ) VALUES (
          @id,
          @review_card_id,
          @rating,
          @fsrs_grade,
          @reviewed_at,
          @previous_state,
          @next_state,
          @previous_due_at,
          @next_due_at,
          @scheduled_days
        )
      `,
      )
      .run({
        id: event.id,
        review_card_id: event.reviewCardId,
        rating: event.rating,
        fsrs_grade: event.fsrsGrade,
        reviewed_at: event.reviewedAt,
        previous_state: event.previousState,
        next_state: event.nextState,
        previous_due_at: event.previousDueAt,
        next_due_at: event.nextDueAt,
        scheduled_days: event.scheduledDays,
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
            meaning,
            grammar_pattern,
            grammar_details,
            romanization,
            sentence_context,
            sentence_translation,
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
            created_at,
            updated_at
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
            meaning,
            grammar_pattern,
            grammar_details,
            romanization,
            sentence_context,
            sentence_translation,
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
            created_at,
            updated_at
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

  countDueReviewCards(now: number): number {
    const row = this.database
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM review_cards
        WHERE activation_state = 'active'
          AND due_at <= ?
      `,
      )
      .get(now) as { total: number };

    return row.total;
  }

  getHomeDashboardSnapshot(input: {
    now: number
    dailyGoal: number
  }): HomeDashboardSnapshot {
    const generatedAt = input.now
    const todayKey = toLocalDateKey(generatedAt)
    const weeklyKeys = buildRollingDateKeys(todayKey, 7)
    const weeklyRows = this.database
      .prepare(
        `
          SELECT
            study_date,
            SUM(cards_reviewed) AS cards_reviewed,
            SUM(minutes_studied) AS minutes_studied
          FROM study_sessions
          WHERE study_date BETWEEN ? AND ?
          GROUP BY study_date
          ORDER BY study_date ASC
        `,
      )
      .all(weeklyKeys[0], weeklyKeys[weeklyKeys.length - 1]) as StudySessionRow[]
    const weeklyByDate = new Map(weeklyRows.map((row) => [row.study_date, row]))

    const recentVocabulary = this.database
      .prepare(
        `
          SELECT id, surface, meaning, source_content_item_id, created_at
          FROM review_cards
          ORDER BY created_at DESC
          LIMIT 5
        `,
      )
      .all() as Array<{
      id: string
      surface: string
      meaning: string | null
      source_content_item_id: string
      created_at: number
    }>

    const resumeRow = this.database
      .prepare(
        `
          SELECT
            reading_progress.content_item_id,
            content_library_items.title,
            content_library_items.provenance_label,
            reading_progress.active_block_id,
            reading_progress.updated_at
          FROM reading_progress
          INNER JOIN content_library_items
            ON content_library_items.id = reading_progress.content_item_id
          ORDER BY reading_progress.updated_at DESC
          LIMIT 1
        `,
      )
      .get() as ResumeContextRow | undefined

    const streakRows = this.database
      .prepare(
        `
          SELECT DISTINCT study_date
          FROM study_sessions
          WHERE cards_reviewed > 0
          ORDER BY study_date DESC
        `,
      )
      .all() as Array<{ study_date: string }>
    const studyDays = new Set(streakRows.map((row) => row.study_date))

    return {
      generatedAt,
      todayDueCount: this.countDueReviewCards(generatedAt),
      streakDays: countStudyStreak(studyDays, todayKey),
      dailyGoal: input.dailyGoal,
      recentVocabulary: recentVocabulary.map((row) => ({
        reviewCardId: row.id,
        surface: row.surface,
        meaning: row.meaning,
        createdAt: row.created_at,
        sourceContentItemId: row.source_content_item_id,
      })),
      weeklyActivity: weeklyKeys.map((date) => {
        const row = weeklyByDate.get(date)

        return {
          date,
          cardsReviewed: row?.cards_reviewed ?? 0,
          minutesStudied: row?.minutes_studied ?? 0,
          isToday: date === todayKey,
        }
      }),
      resumeContext: resumeRow
        ? {
            contentItemId: resumeRow.content_item_id,
            title: resumeRow.title,
            provenanceLabel: resumeRow.provenance_label,
            activeBlockId: resumeRow.active_block_id,
            updatedAt: resumeRow.updated_at,
          }
        : null,
    }
  }

  recordStudySession(input: {
    id: string
    startedAt: number
    endedAt: number
    cardsReviewed: number
    minutesStudied: number
    source: 'review-session'
  }): void {
    this.database
      .prepare(
        `
          INSERT INTO study_sessions (
            id,
            started_at,
            ended_at,
            study_date,
            cards_reviewed,
            minutes_studied,
            source
          ) VALUES (
            @id,
            @started_at,
            @ended_at,
            @study_date,
            @cards_reviewed,
            @minutes_studied,
            @source
          )
        `,
      )
      .run({
        id: input.id,
        started_at: input.startedAt,
        ended_at: input.endedAt,
        study_date: toLocalDateKey(input.endedAt),
        cards_reviewed: Math.max(0, Math.trunc(input.cardsReviewed)),
        minutes_studied: Math.max(0, Math.trunc(input.minutesStudied)),
        source: input.source,
      })
  }

  listDueReviewCards(now: number, limit: number): ReviewCardRecord[] {
    const rows = this.database
      .prepare(
        `
        SELECT
          id,
          canonical_form,
          surface,
          meaning,
          grammar_pattern,
          grammar_details,
          romanization,
          sentence_context,
          sentence_translation,
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
          created_at,
          updated_at
        FROM review_cards
        WHERE activation_state = 'active'
          AND due_at <= ?
        ORDER BY due_at ASC
        LIMIT ?
      `,
      )
      .all(now, limit) as ReviewCardRow[];

    return rows.map(mapReviewCardRow);
  }

  updateReviewCardDetails(
    input: UpdateReviewCardDetailsInput,
    updatedAt: number,
  ): void {
    this.database
      .prepare(
        `
        UPDATE review_cards
        SET meaning = @meaning,
            grammar_pattern = @grammar_pattern,
            grammar_details = @grammar_details,
            updated_at = @updated_at
        WHERE id = @id
      `,
      )
      .run({
        id: input.reviewCardId,
        meaning: input.meaning,
        grammar_pattern: input.grammarPattern,
        grammar_details: input.grammarDetails,
        updated_at: updatedAt,
      });
  }

  getKnownWord(canonicalForm: string): KnownWordRecord | null {
    const row = this.database
      .prepare(
        `
        SELECT canonical_form, surface, source, source_detail, created_at, updated_at
        FROM known_words
        WHERE canonical_form = ?
        LIMIT 1
      `,
      )
      .get(canonicalForm) as KnownWordRow | undefined;

    return row ? mapKnownWordRow(row) : null;
  }

  countKnownWords(): number {
    const row = this.database
      .prepare("SELECT COUNT(*) AS total FROM known_words")
      .get() as { total: number };
    return row.total;
  }

  saveKnownWord(record: KnownWordRecord): void {
    this.database
      .prepare(
        `
        INSERT INTO known_words (
          canonical_form,
          surface,
          source,
          source_detail,
          created_at,
          updated_at
        ) VALUES (
          @canonical_form,
          @surface,
          @source,
          @source_detail,
          @created_at,
          @updated_at
        )
        ON CONFLICT(canonical_form) DO UPDATE SET
          surface = excluded.surface,
          source = excluded.source,
          source_detail = excluded.source_detail,
          updated_at = excluded.updated_at
      `,
      )
      .run({
        canonical_form: record.canonicalForm,
        surface: record.surface,
        source: record.source,
        source_detail: record.sourceDetail,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      });
  }

  deleteKnownWord(canonicalForm: string): void {
    this.database
      .prepare("DELETE FROM known_words WHERE canonical_form = ?")
      .run(canonicalForm);
  }

  findReviewCardByCanonical(
    canonicalForm: string,
    activationStates?: ReviewCardActivationState[],
  ): ReviewCardRecord | null {
    const states =
      activationStates && activationStates.length > 0 ? activationStates : null;
    const stateClause = states
      ? `AND activation_state IN (${states.map(() => "?").join(", ")})`
      : "";
    const row = this.database
      .prepare(
        `
        SELECT
          id,
          canonical_form,
          surface,
          meaning,
          grammar_pattern,
          grammar_details,
          romanization,
          sentence_context,
          sentence_translation,
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
          created_at,
          updated_at
        FROM review_cards
        WHERE canonical_form = ?
          ${stateClause}
        ORDER BY created_at DESC
        LIMIT 1
      `,
      )
      .get(canonicalForm, ...(states ?? [])) as ReviewCardRow | undefined;

    return row ? mapReviewCardRow(row) : null;
  }

  setReviewCardActivationState(
    reviewCardId: string,
    activationState: ReviewCardActivationState,
    updatedAt: number,
  ): void {
    this.database
      .prepare(
        `
        UPDATE review_cards
        SET activation_state = @activation_state,
            updated_at = @updated_at
        WHERE id = @id
      `,
      )
      .run({
        id: reviewCardId,
        activation_state: activationState,
        updated_at: updatedAt,
      });
  }

  applyReviewUpdate(card: ReviewCardRecord, event: ReviewEventRecord): void {
    const transaction = this.database.transaction(() => {
      this.saveReviewCard(card);
      this.saveReviewEvent(event);
    });

    transaction();
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
    meaning: row.meaning,
    grammarPattern: row.grammar_pattern,
    grammarDetails: row.grammar_details,
    romanization: row.romanization,
    sentenceContext: row.sentence_context,
    sentenceTranslation: row.sentence_translation,
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
    updatedAt: row.updated_at,
  };
}

function mapKnownWordRow(row: KnownWordRow): KnownWordRecord {
  return {
    canonicalForm: row.canonical_form,
    surface: row.surface,
    source: row.source,
    sourceDetail: row.source_detail,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toLocalDateKey(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function buildRollingDateKeys(todayKey: string, days: number): string[] {
  const { year, month, day } = parseDateKey(todayKey)
  const anchor = new Date(year, month - 1, day)
  const keys: string[] = []

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(anchor)
    date.setDate(anchor.getDate() - offset)
    keys.push(toLocalDateKey(date.getTime()))
  }

  return keys
}

function countStudyStreak(studyDays: Set<string>, todayKey: string): number {
  if (studyDays.size === 0) {
    return 0
  }

  const { year, month, day } = parseDateKey(todayKey)
  const today = new Date(year, month - 1, day)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const anchor = studyDays.has(todayKey)
    ? today
    : studyDays.has(toLocalDateKey(yesterday.getTime()))
      ? yesterday
      : null

  if (!anchor) {
    return 0
  }

  let streakDays = 0
  const cursor = new Date(anchor)

  while (studyDays.has(toLocalDateKey(cursor.getTime()))) {
    streakDays += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streakDays
}

function parseDateKey(dateKey: string): {
  year: number
  month: number
  day: number
} {
  const [yearText = '1970', monthText = '01', dayText = '01'] = dateKey.split('-')

  return {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
  }
}
