CREATE TABLE IF NOT EXISTS block_audio_assets (
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
);

CREATE TABLE IF NOT EXISTS annotations (
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
);

CREATE TABLE IF NOT EXISTS reading_progress (
  content_item_id TEXT PRIMARY KEY NOT NULL REFERENCES content_library_items(id) ON DELETE CASCADE,
  active_block_id TEXT REFERENCES content_blocks(id) ON DELETE SET NULL,
  playback_state TEXT NOT NULL CHECK (playback_state IN ('idle', 'buffering', 'playing', 'paused', 'ended')),
  playback_rate REAL NOT NULL,
  current_time_ms INTEGER NOT NULL,
  highlighted_token_index INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS exposure_log (
  block_id TEXT NOT NULL REFERENCES content_blocks(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  seen_at INTEGER NOT NULL,
  PRIMARY KEY (block_id, token, seen_at)
);

CREATE TABLE IF NOT EXISTS review_cards (
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
);

CREATE INDEX IF NOT EXISTS idx_block_audio_assets_block_id_last_accessed
  ON block_audio_assets(block_id, last_accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_annotations_surface_context
  ON annotations(surface, sentence_context_hash);

CREATE INDEX IF NOT EXISTS idx_annotations_refresh_state
  ON annotations(refresh_state, stale_after);

CREATE INDEX IF NOT EXISTS idx_exposure_log_block_seen_at
  ON exposure_log(block_id, seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_cards_canonical_activation
  ON review_cards(canonical_form, activation_state, created_at DESC);