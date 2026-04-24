# Contract: Home, Library, and Settings Local Schema

## Purpose

Defines the local persistence additions required for dashboard metrics, streak calculation, daily-goal settings, and learner-managed provider configuration.

## Tables

### `study_sessions`

```sql
CREATE TABLE study_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER NOT NULL,
  study_date TEXT NOT NULL,
  cards_reviewed INTEGER NOT NULL CHECK (cards_reviewed >= 0),
  minutes_studied INTEGER NOT NULL CHECK (minutes_studied >= 0),
  source TEXT NOT NULL CHECK (source IN ('review-session'))
)
```

Rules:
- One row is written when a review session ends.
- `study_date` stores the learner’s local day for seven-day activity and streak aggregation.
- Dashboard streaks count consecutive `study_date` values with `cards_reviewed > 0`.

Suggested indexes:

```sql
CREATE INDEX idx_study_sessions_study_date
  ON study_sessions(study_date DESC);

CREATE INDEX idx_study_sessions_ended_at
  ON study_sessions(ended_at DESC);
```

### `review_cards`

Existing table reused for dashboard due-count and recent-vocabulary queries.

Query rules:
- Today’s review count reads active due cards from `review_cards`, not a parallel `srs_cards` table.
- Recent vocabulary reads the five newest review cards ordered by `created_at DESC`.

Example query shapes:

```sql
SELECT COUNT(*)
FROM review_cards
WHERE activation_state = 'active' AND due_at <= @now;

SELECT id, surface, meaning, source_content_item_id, created_at
FROM review_cards
ORDER BY created_at DESC
LIMIT 5;
```

### `reading_progress`

Existing table reused for dashboard resume context.

Query rules:
- Resume context uses the most recently updated reading-progress row joined to `content_library_items`.
- If the referenced content item no longer exists, the dashboard omits resume context rather than returning a broken target.

## `settings` Keys

The existing `settings` table is extended with learner-facing keys for this feature.

### `integrations.openRouterApiKey`

```json
{
  "apiKey": "<redacted>"
}
```

Rules:
- The raw key is stored locally only.
- Renderer contracts return configuration and validation status, not the stored key value.
- Key validation is an explicit optional network action and does not gate local settings persistence.

### `study.dailyGoal`

```json
{
  "target": 20,
  "updatedAt": 1776988800000
}
```

Rules:
- The target is a positive integer.
- Changing the goal affects dashboard progress and pacing display only.

### `study.ttsVoice`

```json
{
  "voice": "alloy",
  "updatedAt": 1776988800000
}
```

Rules:
- Stores the learner’s preferred voice for preview and later listening flows.
- Saving a voice selection must succeed even when preview is unavailable.

## Contract Tests

- Schema contract tests should assert `study_sessions` constraints and indexes.
- Settings repository tests should cover storing, clearing, and reading the OpenRouter key, daily goal, and selected voice.
- Integration tests should verify that ending a review session appends one `study_sessions` row and that dashboard aggregation fills missing days with zeroes.