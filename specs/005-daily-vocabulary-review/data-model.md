# Data Model: Daily Vocabulary Review

## ReviewCard

Purpose: The learner-owned spaced-repetition card created from a reading-session word and later consumed by the daily review queue.

Fields:
- `id`: Stable card identifier.
- `canonicalForm`: Duplicate-detection form used across reading, known-word checks, and review queue queries.
- `surface`: Korean prompt shown on the front of the card.
- `meaning`: Learner-visible meaning shown on the back.
- `grammarPattern`: Short grammar label for the word or construction in context.
- `grammarDetails`: Richer grammar note or explanation shown on the back when available.
- `romanization`: Optional pronunciation aid captured at add time.
- `sentenceContext`: Source sentence retained for provenance inspection and later card repair.
- `sentenceTranslation`: Optional natural-language translation of the source sentence.
- `sourceBlockId`: Origin content block identifier.
- `sourceContentItemId`: Origin library item identifier.
- `sentenceContextHash`: Stable context key linking the card to annotation cache entries and provenance.
- `fsrsState`: Scheduler state label stored from `ts-fsrs`.
- `dueAt`: Next due timestamp.
- `stability`: FSRS stability field.
- `difficulty`: FSRS difficulty field.
- `elapsedDays`: FSRS elapsed-day field.
- `scheduledDays`: FSRS scheduled-day field.
- `reps`: FSRS repetition count.
- `lapses`: FSRS lapse count.
- `lastReviewAt`: Nullable timestamp of the latest submitted rating.
- `activationState`: `active`, `deferred`, `duplicate-blocked`, or `known` depending on learner load and later known-word actions.
- `createdAt`: Local creation timestamp.
- `updatedAt`: Last mutation timestamp for scheduling or card-content edits.

Validation rules:
- `canonicalForm` must be normalized and non-empty.
- `surface` must remain the learner-facing Korean prompt even if `canonicalForm` is lemma-like.
- `meaning` may be empty only when the capture happened without lookup detail; the card must still remain reviewable and editable.
- `activationState = active` cards participate in due-card queries.
- `activationState = known` cards are excluded from add-to-deck prompts and normal due-card sessions but keep their history.

Relationships:
- One `ReviewCard` may have many `ReviewEvent` rows.
- One `ReviewCard` may correspond to zero or one `KnownWordRecord` for suppression purposes.
- Many `ReviewCard` rows may reference the same `sourceContentItemId` over time.

State transitions:
- `candidate -> active`
- `candidate -> deferred`
- `active -> known`
- `deferred -> active`
- `known -> active` if the learner later removes known-word status

## ReviewEvent

Purpose: Immutable local history row for each rating submission applied during a review session.

Fields:
- `id`: Stable review-event identifier.
- `reviewCardId`: Parent card identifier.
- `rating`: Learner-selected rating: `again`, `hard`, `good`, or `easy`.
- `fsrsGrade`: Numeric grade written to `ts-fsrs` `next()` as `1`, `2`, `3`, or `4`.
- `reviewedAt`: Timestamp of submission.
- `previousState`: Scheduler state before applying the rating.
- `nextState`: Scheduler state after the update.
- `previousDueAt`: Previous due timestamp.
- `nextDueAt`: New due timestamp.
- `scheduledDays`: Interval chosen by the scheduler for the new state.

Validation rules:
- `fsrsGrade` must match the learner-visible rating mapping.
- Events are append-only and never updated in place.
- `reviewedAt` must be greater than or equal to the card `createdAt`.

Relationships:
- Many `ReviewEvent` rows belong to one `ReviewCard`.

## KnownWordRecord

Purpose: Local record that suppresses unnecessary add-to-deck prompts for words the learner already considers covered.

Fields:
- `canonicalForm`: Primary normalized word key.
- `surface`: Representative learner-visible form.
- `source`: `topik_seed`, `manual`, or `review-promoted`.
- `sourceDetail`: Optional seed pack or learner note.
- `createdAt`: Initial timestamp.
- `updatedAt`: Last status update timestamp.

Validation rules:
- `canonicalForm` is unique.
- `source = topik_seed` rows must record a seed-pack detail so the learner can later inspect what was imported.
- Insertions are idempotent during onboarding bulk seed.

Relationships:
- A `KnownWordRecord` may suppress many later reading capture attempts for the same canonical form.
- A `KnownWordRecord` may correspond to one or more `ReviewCard` rows marked `known`.

## KnownWordOnboardingState

Purpose: Tracks whether the first-launch known-word setup has already been completed.

Fields:
- `settingsKey`: `study.knownWords.onboardingComplete`.
- `completed`: Boolean stored in the existing settings table.
- `completedAt`: Timestamp stored alongside the setting payload.
- `selectedSeedPack`: Optional selected seed level or bundle identifier.

Validation rules:
- First launch is true only when `known_words` is empty and this flag is absent.
- Once completed, the onboarding screen should not reappear automatically unless explicitly reset by a future learner action.

## ReviewQueueSession

Purpose: One bounded review run shown to the learner from the Review destination.

Fields:
- `sessionStartedAt`: Session timestamp.
- `cardLimit`: Maximum cards loaded for the session, default `50`.
- `dueCount`: Total active due cards before the limit is applied.
- `loadedCardIds`: Ordered card identifiers returned for the session.
- `completedCount`: Number of cards rated during the session.
- `remainingCount`: Number of still-loaded cards not yet rated.

Validation rules:
- The queue query is `activation_state = 'active'` and `due_at <= now`, ordered by `due_at ASC`, limited to `50`.
- A session may complete with remaining due cards outside the current 50-card window; those cards remain available for a later session.
