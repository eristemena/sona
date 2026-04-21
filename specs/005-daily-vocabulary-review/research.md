# Research: Daily Vocabulary Review

## Decision: Use `ts-fsrs` FSRS-5 `next()` updates against persisted card state in `review_cards`

Rationale: The repository already seeds `review_cards` with `ts-fsrs` `createEmptyCard()` and persists the full scheduler state fields needed for later review. Extending that path with `fsrs().next(card, now, rating)` keeps scheduling logic in one library-backed flow instead of inventing a custom interval system. Rating buttons map directly to FSRS grades: `Again -> 1`, `Hard -> 2`, `Good -> 3`, `Easy -> 4`. The resulting `due`, `stability`, `difficulty`, `elapsed_days`, `scheduled_days`, `reps`, `lapses`, `state`, and `last_review` values can be written back into the same card row after every review action.

Alternatives considered: A custom spaced-repetition algorithm was rejected because it would duplicate proven scheduler behavior and make later tuning harder. Using `repeat()` for every review was rejected because the review flow only needs the learner’s chosen rating, not the full preview table of all four outcomes.

## Decision: Keep review cards in the existing `review_cards` table but evolve the contract to support review-session reads and writes

Rationale: The current schema already stores provenance, activation state, and the FSRS state fields the feature needs. Adding a separate `srs_cards` table would fragment the reading-to-review path that already writes cards from `ReviewCardService`. The implementation should instead treat `review_cards` as the durable SRS card store, add any missing display or queue fields there, and expose queue and review-update repository methods around that single source of truth.

Alternatives considered: Introducing a parallel review-only table was rejected because it would require synchronization between reading-capture cards and daily-review cards. Keeping review state only in memory until session completion was rejected because offline-first review must survive app restarts and partial sessions.

## Decision: Build the daily review queue from active due cards ordered by oldest due date, capped to 50 cards per session

Rationale: The product needs a calm, bounded daily review loop. Querying active cards where `due_at <= now()` ordered by `due_at ASC` ensures overdue cards surface first, while `LIMIT 50` prevents one session from expanding into an unbounded catch-up wall. Any remaining due cards stay available for a later session the same day instead of being silently discarded.

Alternatives considered: Loading all due cards at once was rejected because it would amplify skipped-day backlog into a single overwhelming session. Randomizing due cards was rejected because it weakens learner expectations and makes debugging scheduler output harder.

## Decision: Preserve explicit new-card activation limits from reading capture and use review-session limits only for retrieval, not card creation

Rationale: The current reading flow already enforces a cap on active newly added cards. Daily review should not introduce hidden new-card creation rules. The review session simply consumes due active cards in bounded slices of up to 50, while add-to-deck continues to respect duplicate blocking, known-word suppression, and explicit learner action.

Alternatives considered: Promoting deferred cards automatically when a review session starts was rejected because it could create surprise workload. Removing the active-card cap was rejected because it violates the bounded-review principle already established in the reading feature.

## Decision: Add a first-launch known-word onboarding step gated by `known_words` emptiness plus a persisted `onboarding_complete` setting

Rationale: The feature needs a low-friction way to suppress obvious known vocabulary before learners start reading and adding cards. First launch is reliably detectable by checking that the `known_words` table is empty and that the `settings` table has no `onboarding_complete` key. Persisting the completion flag in the existing settings store keeps the logic local-first and idempotent even if the learner later edits their known-word list.

Alternatives considered: Inferring onboarding completion from deck size alone was rejected because a learner may have zero cards but still already completed onboarding. Re-running onboarding whenever `known_words` becomes empty was rejected because deliberate cleanup should not trap the learner in repeated setup flows.

## Decision: Seed known words from bundled open-licensed Korean frequency data instead of redistributing official TOPIK lists

Rationale: The user explicitly ruled out redistributing the official NIIED TOPIK list. Bundling a static JSON frequency corpus with open redistribution rights preserves offline-first onboarding, avoids legal ambiguity, and still gives learners a practical proficiency-based seed set. Seeded rows should be bulk inserted into `known_words` with `source = 'topik_seed'` so they remain inspectable and reversible.

Alternatives considered: Downloading the seed list on first launch was rejected because onboarding must work offline. Shipping the official TOPIK list was rejected due to redistribution concerns.

## Decision: Reuse the existing renderer stack with `motion/react` and the shared variant-based `Button` component for the review UI

Rationale: The renderer already ships `motion/react` and a shared button component modeled on shadcn-style variants. The card face flip can therefore use a `rotateY` animation with `backface-visibility: hidden` on both faces without introducing a second animation system. Rating controls should be rendered as four full-width buttons in a fixed grid below the card to minimize hesitation and support consistent keyboard traversal.

Alternatives considered: Adding a second card-animation library was rejected because the existing motion stack already covers the required interaction. Plain CSS transitions alone were rejected because the feature already uses Motion and needs coordinated presence and flip state handling.

## Decision: Keep known-word suppression and deck-duplicate suppression in the same eligibility check used by reading lookup actions

Rationale: The learner should see one consistent answer to “should this word be offered for deck capture?” regardless of whether the word was seeded, explicitly marked known, or already exists as an active review card. A shared eligibility check in the main-process reading/review boundary avoids conflicting renderer-side heuristics and keeps provenance-aware decisions near the repository data.

Alternatives considered: Renderer-only suppression logic was rejected because it would duplicate repository rules and drift from persisted truth. Suppressing only deck duplicates but ignoring known words was rejected because it would continue prompting learners with common vocabulary they already consider covered.