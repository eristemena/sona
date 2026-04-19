# Contract: Content Library SQLite Schema

## Purpose

Defines the local SQLite schema additions required for Content Library item storage, sentence-level `ContentBlock` persistence, provenance tracking, and safe deletion.

## Table: `content_library_items`

Columns:
- `id TEXT PRIMARY KEY NOT NULL`
- `title TEXT NOT NULL`
- `source_type TEXT NOT NULL CHECK (source_type IN ('generated', 'article', 'srt'))`
- `difficulty INTEGER CHECK (difficulty IN (1, 2, 3) OR difficulty IS NULL)`
- `source_locator TEXT NOT NULL`
- `provenance_label TEXT NOT NULL`
- `provenance_detail TEXT NOT NULL`
- `search_text TEXT NOT NULL`
- `duplicate_check_text TEXT NOT NULL`
- `created_at INTEGER NOT NULL`

Behavior:
- One row represents one library card.
- `search_text` stores normalized searchable content derived from the title and source text.
- `duplicate_check_text` stores normalized text used to warn on likely duplicates before save.
- No partial row may remain if block persistence fails.

## Table: `content_blocks`

Columns:
- `id TEXT PRIMARY KEY NOT NULL`
- `content_item_id TEXT NOT NULL REFERENCES content_library_items(id) ON DELETE CASCADE`
- `sentence_ordinal INTEGER NOT NULL`
- `korean TEXT NOT NULL`
- `romanization TEXT`
- `tokens_json TEXT`
- `annotations_json TEXT NOT NULL DEFAULT '{}'`
- `difficulty INTEGER CHECK (difficulty IN (1, 2, 3) OR difficulty IS NULL)`
- `source_type TEXT NOT NULL CHECK (source_type IN ('generated', 'article', 'srt'))`
- `audio_offset REAL`
- `created_at INTEGER NOT NULL`

Behavior:
- `id` uses the structural format `(source_type, file_path|session_id, sentence_ordinal)`.
- `sentence_ordinal` must be unique per `content_item_id`.
- `audio_offset` is nullable and only populated for subtitle-derived blocks.

## Table: `content_source_records`

Columns:
- `content_item_id TEXT PRIMARY KEY NOT NULL REFERENCES content_library_items(id) ON DELETE CASCADE`
- `origin_mode TEXT NOT NULL CHECK (origin_mode IN ('file-import', 'article-paste', 'article-scrape', 'generation-request'))`
- `file_path TEXT`
- `url TEXT`
- `session_id TEXT`
- `raw_source_text TEXT`
- `captured_at INTEGER NOT NULL`

Behavior:
- Stores learner-visible provenance and the source locator used to build structural IDs.
- At least one of `file_path`, `url`, or `session_id` must be present.
- Generated-content rows preserve both requested and validated difficulty when they differ.

## Table: `generation_requests`

Columns:
- `session_id TEXT PRIMARY KEY NOT NULL`
- `topic TEXT NOT NULL`
- `requested_difficulty INTEGER NOT NULL CHECK (requested_difficulty IN (1, 2, 3))`
- `validated_difficulty INTEGER CHECK (validated_difficulty IN (1, 2, 3) OR validated_difficulty IS NULL)`
- `validation_outcome TEXT NOT NULL CHECK (validation_outcome IN ('accepted', 'relabeled', 'rejected'))`
- `generator_model TEXT NOT NULL`
- `validator_model TEXT NOT NULL`
- `created_at INTEGER NOT NULL`

Behavior:
- Written only for generation attempts.
- A rejected request may exist without a saved library item.

## Migration Rules

- Content-library migrations execute after the existing shell schema migration path and remain idempotent.
- Item rows, block rows, source records, and generation records for a single save operation are written transactionally.
- Deleting a library item cascades to its blocks and provenance record.
- Duplicate detection happens before insert and must not persist a new item until the learner explicitly confirms continuation.
- Future schema changes must add new migrations instead of editing applied migrations in place.