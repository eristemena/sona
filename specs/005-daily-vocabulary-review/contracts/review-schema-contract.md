# Contract: Daily Review Local Schema

## Purpose

Defines the local persistence contract for daily review queue retrieval, FSRS rating updates, review history, known-word suppression, and first-launch onboarding state.

## Tables

### `review_cards`

```sql
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
)
```

Rules:
- Due-queue reads use `activation_state = 'active'` and `due_at <= now`.
- The table remains the single durable SRS card store for both reading capture and daily review.
- New cards are persisted directly as `active` or `deferred`; there is no stored `candidate` activation state.
- Display-side meaning and grammar fields are snapshots from the learner-visible context at capture time and remain editable later.

Suggested indexes:

```sql
CREATE INDEX idx_review_cards_due_active
  ON review_cards(activation_state, due_at ASC);

CREATE INDEX idx_review_cards_canonical_activation
  ON review_cards(canonical_form, activation_state, created_at DESC);
```

### `review_events`

```sql
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
)
```

Rules:
- Review events are append-only.
- Every successful rating submission writes one event row in the same transaction as the parent card update.

Suggested index:

```sql
CREATE INDEX idx_review_events_card_reviewed_at
  ON review_events(review_card_id, reviewed_at DESC);
```

### `known_words`

```sql
CREATE TABLE known_words (
  canonical_form TEXT PRIMARY KEY NOT NULL,
  surface TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('topik_seed', 'manual', 'review-promoted')),
  source_detail TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)
```

Rules:
- Inserts are idempotent by `canonical_form`.
- `source = 'topik_seed'` rows identify the bundled onboarding seed selection.
- Reading capture suppression checks this table before offering new add-to-deck prompts.

### `settings`

Existing table reused with a new key:

```sql
key = 'study.knownWords.onboardingComplete'
value_json = {
  "completed": true,
  "completedAt": 1713744000000,
  "selectedSeedPack": "topik-i-core"
}
```

Rules:
- First launch requires both an empty `known_words` table and no onboarding-complete setting.
- The setting is written atomically with the onboarding seed insert transaction.

## File-System Artifacts

- Known-word seed packs are bundled as static JSON under a renderer- or domain-accessible local asset path.
- Seed packs must come from an open-licensed Korean frequency corpus and must not redistribute the official NIIED TOPIK list.

## Contract Tests

- Schema contract tests should assert queue indexes, activation-state constraints, and the `known_words` uniqueness rule.
- Integration tests should verify 50-card queue limiting, `ts-fsrs` grade mapping, onboarding idempotency, and reading-side suppression for seeded or manually marked known words.
