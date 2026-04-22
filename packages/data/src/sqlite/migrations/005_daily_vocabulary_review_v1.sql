DROP INDEX IF EXISTS idx_review_cards_canonical_activation;

ALTER TABLE review_cards RENAME TO review_cards_legacy;

CREATE TABLE review_cards (
  id TEXT PRIMARY KEY NOT NULL,
  canonical_form TEXT NOT NULL,
  surface TEXT NOT NULL,
  meaning TEXT,
  grammar_pattern TEXT,
  grammar_details TEXT,
  romanization TEXT,
  sentence_context TEXT,
  sentence_translation TEXT,
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
  activation_state TEXT NOT NULL CHECK (activation_state IN ('active', 'deferred', 'duplicate-blocked', 'known')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

INSERT INTO review_cards (
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
)
SELECT
  id,
  canonical_form,
  surface,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
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
  created_at
FROM review_cards_legacy;

DROP TABLE review_cards_legacy;

CREATE TABLE review_events (
  id TEXT PRIMARY KEY NOT NULL,
  review_card_id TEXT NOT NULL REFERENCES review_cards(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('again', 'hard', 'good', 'easy')),
  fsrs_grade INTEGER NOT NULL CHECK (fsrs_grade IN (1, 2, 3, 4)),
  reviewed_at INTEGER NOT NULL,
  previous_state TEXT NOT NULL,
  next_state TEXT NOT NULL,
  previous_due_at INTEGER NOT NULL,
  next_due_at INTEGER NOT NULL,
  scheduled_days INTEGER NOT NULL
);

CREATE TABLE known_words (
  canonical_form TEXT PRIMARY KEY NOT NULL,
  surface TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('topik_seed', 'manual', 'review-promoted')),
  source_detail TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_review_cards_due_active
  ON review_cards(activation_state, due_at ASC);

CREATE INDEX idx_review_cards_canonical_activation
  ON review_cards(canonical_form, activation_state, created_at DESC);

CREATE INDEX idx_review_events_card_reviewed_at
  ON review_events(review_card_id, reviewed_at DESC);