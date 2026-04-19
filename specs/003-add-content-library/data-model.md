# Data Model: Add Content Library

## Content Library Item

Purpose: Represents one learner-visible card in the Content Library, grouping the sentence-level blocks that came from one import, paste, scrape, or generation event.

Fields:
- `id`: Stable structural source identifier, derived from `source_type` plus `file_path` or `session_id`.
- `title`: Learner-visible label used in the library grid.
- `sourceType`: One of `srt`, `article`, or `generated`.
- `difficulty`: Nullable integer difficulty level, stored as `1`, `2`, `3`, or `null`.
- `difficultyLabel`: Derived badge label: `초급`, `중급`, `고급`, or empty when difficulty is `null`.
- `sourceLocator`: File path for SRT imports, URL for scraped articles, or session identifier for pasted/generated content.
- `searchText`: Normalized text used by the library search input.
- `createdAt`: Unix timestamp in milliseconds.
- `deletedAt`: Nullable Unix timestamp in milliseconds used for deletion bookkeeping or hard-delete orchestration.

Validation rules:
- `id` must be unique.
- `sourceType` must match the originating ingestion flow.
- `difficulty`, when present, must be one of `1`, `2`, or `3`.
- `title` must not be empty.

State transitions:
- `pending-ingestion` -> `saved`
- `saved` -> `deleted`
- `pending-ingestion` must never transition directly to `saved` if block creation fails

## ContentBlock

Purpose: Stores the sentence-level Korean text units backing a library item and future reading, lookup, or review features.

Fields:
- `id`: Structural identifier in the format `(source_type, file_path|session_id, sentence_ordinal)`.
- `contentItemId`: Parent `Content Library Item` identifier.
- `korean`: Sentence text shown to the learner.
- `romanization`: Nullable romanization text.
- `tokens`: Nullable token array, stored as JSON.
- `annotations`: Record of annotation entries keyed by annotation name, stored as nullable JSON values.
- `difficulty`: Nullable integer difficulty level for the block.
- `sourceType`: One of `generated`, `article`, or `srt`.
- `audioOffset`: Nullable numeric subtitle start offset for listening alignment.
- `sentenceOrdinal`: Stable 1-based sequence within the source item.
- `createdAt`: Unix timestamp in milliseconds.

Validation rules:
- `korean` must not be empty.
- `sentenceOrdinal` must be positive and unique within a given source item.
- `audioOffset` is required only for subtitle-derived blocks and must be `null` otherwise.
- `sourceType` must match the parent item’s source type.

Relationships:
- Many `ContentBlock` rows belong to one `Content Library Item`.

## Content Source Record

Purpose: Preserves learner-visible provenance about how a library item entered Sona.

Fields:
- `contentItemId`: Parent item identifier.
- `sourceType`: `srt`, `article`, or `generated`.
- `originMode`: `file-import`, `article-paste`, `article-scrape`, or `generation-request`.
- `filePath`: Nullable absolute file path for SRT imports.
- `url`: Nullable source URL for scraped articles.
- `sessionId`: Nullable session identifier for pasted or generated content.
- `displaySource`: Learner-visible provenance summary.
- `capturedAt`: Unix timestamp in milliseconds.

Validation rules:
- At least one of `filePath`, `url`, or `sessionId` must be present.
- `originMode` must be compatible with `sourceType`.
- `displaySource` must remain non-empty so provenance is always inspectable.

Relationships:
- One `Content Source Record` belongs to one `Content Library Item`.

## Generation Request

Purpose: Captures the learner’s request for AI-generated practice sentences and the validation outcome that determines whether the result is saved.

Fields:
- `sessionId`: Stable generation session identifier.
- `topic`: Learner-requested topic.
- `requestedDifficulty`: Integer `1`, `2`, or `3`.
- `generatorModel`: Constant `anthropic/claude-3-5-haiku` for this feature slice.
- `validatorModel`: Constant `openai/gpt-4o-mini` for this feature slice.
- `validatedDifficulty`: Integer `1`, `2`, `3`, or `null` when validation failed.
- `validationOutcome`: `accepted`, `relabeled`, or `rejected`.
- `createdAt`: Unix timestamp in milliseconds.

Validation rules:
- `topic` must not be empty.
- `requestedDifficulty` must be one of `1`, `2`, or `3`.
- `validatedDifficulty` is required when `validationOutcome` is `accepted` or `relabeled`.

State transitions:
- `requested` -> `accepted`
- `requested` -> `relabeled`
- `requested` -> `rejected`

## Library Query State

Purpose: Represents the UI state needed to browse the Content Library card grid.

Fields:
- `filter`: One of `all`, `article`, `srt`, or `generated`.
- `search`: Learner-entered search string.
- `resultCount`: Derived count of visible library items.

Validation rules:
- `filter` must always have a valid tab value.
- `search` may be empty.

Relationships:
- Applied against many `Content Library Item` rows.