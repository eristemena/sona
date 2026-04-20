CREATE TABLE IF NOT EXISTS content_library_items (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('generated', 'article', 'srt')),
  difficulty INTEGER NOT NULL CHECK (difficulty IN (1, 2, 3)),
  source_locator TEXT NOT NULL,
  provenance_label TEXT NOT NULL,
  provenance_detail TEXT NOT NULL,
  search_text TEXT NOT NULL,
  duplicate_check_text TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS content_blocks (
  id TEXT PRIMARY KEY NOT NULL,
  content_item_id TEXT NOT NULL REFERENCES content_library_items(id) ON DELETE CASCADE,
  sentence_ordinal INTEGER NOT NULL,
  korean TEXT NOT NULL,
  romanization TEXT,
  tokens_json TEXT,
  annotations_json TEXT NOT NULL DEFAULT '{}',
  difficulty INTEGER NOT NULL CHECK (difficulty IN (1, 2, 3)),
  source_type TEXT NOT NULL CHECK (source_type IN ('generated', 'article', 'srt')),
  audio_offset REAL,
  created_at INTEGER NOT NULL,
  UNIQUE(content_item_id, sentence_ordinal)
);

CREATE TABLE IF NOT EXISTS content_source_records (
  content_item_id TEXT PRIMARY KEY NOT NULL REFERENCES content_library_items(id) ON DELETE CASCADE,
  origin_mode TEXT NOT NULL CHECK (origin_mode IN ('file-import', 'article-paste', 'article-scrape', 'generation-request')),
  file_path TEXT,
  url TEXT,
  session_id TEXT,
  display_source TEXT NOT NULL,
  requested_difficulty INTEGER CHECK (requested_difficulty IN (1, 2, 3) OR requested_difficulty IS NULL),
  validated_difficulty INTEGER CHECK (validated_difficulty IN (1, 2, 3) OR validated_difficulty IS NULL),
  captured_at INTEGER NOT NULL,
  CHECK (file_path IS NOT NULL OR url IS NOT NULL OR session_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS generation_requests (
  session_id TEXT PRIMARY KEY NOT NULL,
  topic TEXT NOT NULL,
  requested_difficulty INTEGER NOT NULL CHECK (requested_difficulty IN (1, 2, 3)),
  validated_difficulty INTEGER CHECK (validated_difficulty IN (1, 2, 3) OR validated_difficulty IS NULL),
  validation_outcome TEXT NOT NULL CHECK (validation_outcome IN ('accepted', 'relabeled', 'rejected')),
  generator_model TEXT NOT NULL,
  validator_model TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_content_library_items_source_type_created_at
  ON content_library_items(source_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_library_items_search_text
  ON content_library_items(search_text);

CREATE INDEX IF NOT EXISTS idx_content_library_items_duplicate_check_text
  ON content_library_items(duplicate_check_text);

CREATE INDEX IF NOT EXISTS idx_content_blocks_content_item_id_sentence_ordinal
  ON content_blocks(content_item_id, sentence_ordinal);