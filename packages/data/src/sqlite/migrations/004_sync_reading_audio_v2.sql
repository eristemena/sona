DROP INDEX IF EXISTS idx_block_audio_assets_block_id_last_accessed;

ALTER TABLE block_audio_assets RENAME TO block_audio_assets_legacy;

CREATE TABLE block_audio_assets (
  id TEXT PRIMARY KEY NOT NULL,
  block_id TEXT NOT NULL REFERENCES content_blocks(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openai')),
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
)
SELECT
  id,
  block_id,
  'openai',
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
FROM block_audio_assets_legacy;

DROP TABLE block_audio_assets_legacy;

CREATE INDEX IF NOT EXISTS idx_block_audio_assets_block_id_last_accessed
  ON block_audio_assets(block_id, last_accessed_at DESC);