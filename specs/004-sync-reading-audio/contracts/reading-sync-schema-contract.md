# Contract: Reading Sync Local Schema

## Purpose

Defines the local persistence contract for synced reading audio, annotation caching, passive exposure batching, and direct review-card creation from the reading view.

## Tables

### `block_audio_assets`

```sql
CREATE TABLE block_audio_assets (
  id TEXT PRIMARY KEY NOT NULL,
  block_id TEXT NOT NULL REFERENCES content_blocks(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openrouter')),
  model_id TEXT NOT NULL,
  voice TEXT NOT NULL,
  text_hash TEXT NOT NULL,
  audio_file_path TEXT,
  timing_format TEXT NOT NULL CHECK (timing_format IN ('verbose_json')),
  timings_json TEXT,
  duration_ms INTEGER,
  generation_state TEXT NOT NULL CHECK (generation_state IN ('pending', 'ready', 'failed', 'unavailable')),
  failure_reason TEXT,
  generated_at INTEGER,
  last_accessed_at INTEGER NOT NULL,
  UNIQUE(block_id, model_id, voice, text_hash)
)
```

Rules:
- `audio_file_path`, `timings_json`, and `duration_ms` are required when `generation_state = 'ready'`.
- `failure_reason` is required when `generation_state = 'failed'`.
- Cache invalidation occurs by changing `text_hash`, `voice`, or `model_id`, not by mutating old rows in place.

### `annotations`

```sql
CREATE TABLE annotations (
  id TEXT PRIMARY KEY NOT NULL,
  canonical_form TEXT NOT NULL,
  sentence_context_hash TEXT NOT NULL,
  surface TEXT NOT NULL,
  part_of_speech TEXT NOT NULL,
  english_gloss TEXT NOT NULL,
  romanization TEXT NOT NULL,
  grammar_note TEXT NOT NULL,
  grammar_explanation TEXT,
  model_id TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  refreshed_at INTEGER NOT NULL,
  stale_after INTEGER NOT NULL,
  last_served_at INTEGER NOT NULL,
  refresh_state TEXT NOT NULL CHECK (refresh_state IN ('fresh', 'stale', 'refreshing')),
  UNIQUE(canonical_form, sentence_context_hash)
)
```

Rules:
- Cache reads use `(canonical_form, sentence_context_hash)`.
- Entries older than 30 days or with a mismatched `model_id` are served immediately as stale and queued for refresh.
- `response_json` remains the inspectable source of truth for derived annotation payloads.

### `reading_progress`

```sql
CREATE TABLE reading_progress (
  content_item_id TEXT PRIMARY KEY NOT NULL REFERENCES content_library_items(id) ON DELETE CASCADE,
  active_block_id TEXT REFERENCES content_blocks(id) ON DELETE SET NULL,
  playback_state TEXT NOT NULL CHECK (playback_state IN ('idle', 'buffering', 'playing', 'paused', 'ended')),
  playback_rate REAL NOT NULL,
  current_time_ms INTEGER NOT NULL,
  highlighted_token_index INTEGER,
  updated_at INTEGER NOT NULL
)
```

Rules:
- One row exists per content item, overwritten on explicit progress save.
- `highlighted_token_index` must be null or a valid token index for the referenced block.

### `exposure_log`

```sql
CREATE TABLE exposure_log (
  block_id TEXT NOT NULL REFERENCES content_blocks(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  seen_at INTEGER NOT NULL,
  PRIMARY KEY (block_id, token, seen_at)
)
```

Rules:
- Inserts are batch-oriented and idempotent.
- This table does not record every playback tick, only finalized exposures flushed from session memory.

### `review_cards`

```sql
CREATE TABLE review_cards (
  id TEXT PRIMARY KEY NOT NULL,
  canonical_form TEXT NOT NULL,
  surface TEXT NOT NULL,
  source_block_id TEXT NOT NULL REFERENCES content_blocks(id) ON DELETE RESTRICT,
  source_content_item_id TEXT NOT NULL REFERENCES content_library_items(id) ON DELETE RESTRICT,
  sentence_context_hash TEXT NOT NULL,
  fsrs_state TEXT NOT NULL,
  due_at INTEGER NOT NULL,
  stability REAL NOT NULL,
  difficulty REAL NOT NULL,
  elapsed_days INTEGER NOT NULL,
  scheduled_days INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  lapses INTEGER NOT NULL,
  last_review_at INTEGER,
  activation_state TEXT NOT NULL CHECK (activation_state IN ('active', 'deferred', 'duplicate-blocked')),
  created_at INTEGER NOT NULL
)
```

Rules:
- New cards originate from `ts-fsrs` `createEmptyCard()` defaults and therefore begin in the new-card state.
- Duplicate prevention and pacing are enforced before inserting an `active` card.
- `deferred` rows preserve learner intent without immediately increasing active daily workload.

## File-System Artifacts

- Audio binary files are stored under an app-data cache directory scoped to Sona, outside the SQLite database.
- Cache cleanup must remove the local file when its owning `block_audio_assets` row is deleted or invalidated.
- Timing metadata is duplicated in SQLite rather than requiring the renderer to parse sidecar files.

## Contract Tests

- Schema contract tests should assert table shapes, key uniqueness, and state constraints.
- Integration tests should verify that deleting a content block cascades local cache cleanup and that stale annotations are served before background refresh completes.