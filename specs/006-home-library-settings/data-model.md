# Data Model: Home, Library, and Settings Hub

## HomeDashboardSnapshot

Purpose: Local snapshot returned to the renderer when the learner opens the dashboard.

Fields:
- `generatedAt`: Timestamp when the snapshot was assembled.
- `todayDueCount`: Number of active review cards due at snapshot time.
- `recentVocabulary`: Up to five most recently created review cards for quick recency context.
- `weeklyActivity`: Exactly seven day buckets covering the current day and previous six local calendar days.
- `streakDays`: Consecutive days ending today or yesterday with at least one reviewed card recorded in `study_sessions`.
- `resumeContext`: Nullable reading resume summary for the most recently updated reading session.
- `dailyGoal`: Current locally stored daily study goal.

Validation rules:
- `todayDueCount` is derived from active due review cards and is never negative.
- `recentVocabulary` contains at most five items ordered newest first.
- `weeklyActivity` always contains seven entries even when all values are zero.
- `streakDays` is `0` when no qualifying study day exists.
- `resumeContext` is `null` when no saved reading progress exists.

Relationships:
- Composes `RecentVocabularyItem`, `WeeklyActivityPoint`, and `ResumeContext`.

## RecentVocabularyItem

Purpose: Compact dashboard representation of a recently added review term.

Fields:
- `reviewCardId`: Stable review-card identifier.
- `surface`: Learner-visible Korean prompt.
- `meaning`: Optional saved meaning for the card.
- `createdAt`: Creation timestamp.
- `sourceContentItemId`: Provenance link back to the source library item.

Validation rules:
- `surface` is required and non-empty.
- `meaning` may be `null` if the card was captured without saved detail.

## WeeklyActivityPoint

Purpose: One bar in the seven-day dashboard activity chart.

Fields:
- `date`: Local calendar date in `YYYY-MM-DD` form.
- `cardsReviewed`: Number of reviewed cards recorded for that day.
- `minutesStudied`: Total minutes studied for that day.
- `isToday`: Whether the point represents the current local day.

Validation rules:
- Exactly seven points are returned for dashboard rendering.
- Missing days are represented with zero-valued points instead of being omitted.

## StudySession

Purpose: Append-only summary row written when a review session ends.

Fields:
- `id`: Stable study-session identifier.
- `startedAt`: Session start timestamp.
- `endedAt`: Session end timestamp.
- `studyDate`: Local calendar date assigned from session end.
- `cardsReviewed`: Number of cards rated during the session.
- `minutesStudied`: Rounded number of minutes spent in the session.
- `source`: Fixed source label for this feature, `review-session`.

Validation rules:
- `endedAt` must be greater than or equal to `startedAt`.
- `cardsReviewed` and `minutesStudied` are non-negative integers.
- Rows are append-only and never updated in place after completion.

Relationships:
- Aggregates into `WeeklyActivityPoint` and `streakDays` calculations.

State transitions:
- `in-progress -> completed`

## ResumeContext

Purpose: Minimal dashboard payload for continuing the learner’s most recent reading session.

Fields:
- `contentItemId`: Identifier of the resumable library item.
- `title`: Library item title.
- `provenanceLabel`: Human-readable source label.
- `activeBlockId`: Nullable current block identifier.
- `updatedAt`: Timestamp of the latest saved reading progress.

Validation rules:
- Present only when both a reading-progress row and source library item exist.
- `contentItemId` must reference an existing library item.

## LibraryCatalogSnapshot

Purpose: Full locally loaded catalog used for client-side search, filter, and sort.

Fields:
- `items`: All saved library items returned by the initial IPC load.
- `loadedAt`: Timestamp of the initial catalog fetch.
- `selectedItemId`: Nullable currently selected library item.
- `queryState`: Client-only state for `search`, `filter`, and `sort`.

Validation rules:
- After initial load, search, filter, and sort mutate only renderer state until the learner triggers a content-changing action.
- Generated and imported items remain distinguishable by `sourceType` and provenance fields.

## StudyPreferences

Purpose: Learner-owned settings managed from the settings screen.

Fields:
- `openRouterApiKeyConfigured`: Boolean status derived from the stored OpenRouter key.
- `preferredTtsVoice`: Current saved TTS voice identifier.
- `dailyStudyGoal`: Positive integer target used by dashboard progress displays.
- `themePreference`: Existing theme selection retained in the same settings surface.

Validation rules:
- `dailyStudyGoal` must be a positive integer within the supported range chosen by implementation.
- The stored API key value is never returned to the renderer after save; only configured status and validation result are exposed.
- `preferredTtsVoice` must be one of the supported voice options returned by the settings domain.

## VoicePreviewRequest

Purpose: Explicit settings action to preview the selected voice.

Fields:
- `voice`: Requested voice identifier.
- `sampleText`: Fixed phrase `안녕하세요, 소나입니다.`

Validation rules:
- `sampleText` is fixed by the application, not learner-editable.
- Failure to preview does not clear or invalidate the saved voice selection.