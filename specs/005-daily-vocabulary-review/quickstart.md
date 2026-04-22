# Quickstart: Daily Vocabulary Review

This feature is planned as Sona’s first full daily-review loop on top of reading-captured vocabulary. The validation path below covers known-word onboarding, queue retrieval, FSRS rating updates, card flip interaction, card-detail correction, and reading-side suppression for already-known vocabulary. User Story 1 remains independently valid without onboarding by testing with onboarding absent or already completed.

## 1. Prerequisites

- Node.js 20 LTS or newer.
- npm available locally.
- A desktop environment supported by the Electron workflow.
- At least one saved content item available for reading-based word capture.
- No network dependency is required for core onboarding, queue loading, or rating submission.

## 2. Install Dependencies

```bash
npm install
```

If the local Node.js runtime changes and SQLite-backed tests fail with a `better-sqlite3` module-version mismatch, rebuild the native module before continuing:

```bash
npm rebuild better-sqlite3
```

## 3. Core Validation Commands

Run the automated suite:

```bash
npm test
```

Run workspace typechecks:

```bash
npm run typecheck
```

Build the workspaces:

```bash
npm run build
```

Start the desktop app for manual validation:

```bash
npm run dev:desktop
```

## 4. Validate First-Launch Known-Word Onboarding

Manual checks:

- Start from a fresh local database where `known_words` is empty and no `study.knownWords.onboardingComplete` setting exists.
- Launch the app and confirm a full-screen onboarding step is available as part of the Review shell without blocking access to already-due cards.
- Select one bundled seed pack and complete onboarding.
- Confirm the selected words are inserted into `known_words` with `source = 'topik_seed'`.
- Relaunch the app and confirm onboarding does not reappear automatically.

Expected automated coverage:

- `tests/integration/known-word-onboarding-first-launch.test.tsx`
- `tests/integration/known-word-onboarding-idempotent.test.ts`
- `tests/contract/review-schema-contract.test.ts`

## 5. Validate Review Queue Retrieval

Manual checks:

- Seed more than 50 active due cards.
- Open Review and confirm cards are ordered by the oldest `due_at` value first.
- Confirm only 50 cards are loaded into one session snapshot.
- Finish part of the queue, leave Review, and confirm remaining due cards are still available for a later session.

Expected automated coverage:

- `tests/integration/review-queue-limit-and-order.test.ts`
- `tests/contract/window-sona-review-contract.test.ts`

## 6. Validate Card Faces And Rating Actions

Manual checks:

- Open a due review card and confirm the front shows only the Korean prompt.
- Flip the card and confirm the back shows meaning and grammar details from locally stored card data.
- Confirm the card uses a 3D flip interaction with hidden backfaces rather than replacing the DOM abruptly.
- Confirm the four rating buttons render in a full-width four-column grid below the card.
- Navigate the rating buttons by keyboard and confirm visible focus remains clear.

Expected automated coverage:

- `tests/integration/review-card-flip.test.tsx`
- `tests/integration/review-rating-buttons-layout.test.tsx`

## 7. Validate FSRS Rating Updates

Manual checks:

- Review the same card with `Again`, `Hard`, `Good`, and `Easy` in controlled test data.
- Confirm the implementation maps those ratings to FSRS grades `1`, `2`, `3`, and `4`.
- Confirm the updated scheduler state writes back to the same card row.
- Confirm a history row is appended for every rating submission.
- Confirm weaker ratings schedule the card sooner than stronger ratings.

Expected automated coverage:

- `tests/integration/review-fsrs-next-update.test.ts`
- `tests/integration/review-history-persistence.test.ts`

## 8. Validate Reading-To-Review Continuity

Manual checks:

- Add a word from the reading view with available lookup detail.
- Open Review and confirm the resulting card shows the captured meaning and grammar details from the reading lookup snapshot, including the saved sentence translation when present.
- Inspect the `Captured from reading` panel and confirm it preserves the source sentence context from the originating reading block.
- Add a word without richer lookup detail and confirm the card remains reviewable with the fallback message `No saved meaning yet. Add one so this card stays useful offline.`
- Choose `Edit details`, save corrected meaning or grammar fields, and confirm the updated card stays flipped, refreshes in place, and still shows its provenance panel.
- Restart the app and confirm the corrected detail fields persist on the same review card.

Expected automated coverage:

- `tests/integration/reading-capture-review-card-details.test.ts`
- `tests/integration/review-card-provenance.test.ts`
- `tests/integration/review-card-missing-details.test.tsx`
- `tests/integration/review-card-detail-edit.test.tsx`
- `tests/integration/review-card-detail-edit-persistence.test.ts`

## 9. Validate Known-Word Suppression In Reading

Manual checks:

- Mark a word as known through onboarding or an explicit known-word action.
- Encounter the same word in the reading view.
- Confirm the reading surface does not present it as a fresh add-to-deck candidate.
- Confirm a word that is already an active review card also appears suppressed.
- Use `Clear known status` from the reading popup and confirm the word returns to normal capture eligibility without reopening the reading session.
- Mark a due review card as known from the revealed answer side, confirm it leaves the queue, then use `Undo known word` from the review banner and confirm the same card returns to the review session.
- Clear known-word status for that canonical form and confirm the reading surface returns the word to normal eligibility while preserving prior review history.

Expected automated coverage:

- `tests/integration/known-word-reading-suppression.test.tsx`
- `tests/integration/review-duplicate-or-known-suppression.test.ts`
- `tests/integration/known-word-clear-status.test.ts`
- `tests/integration/review-card-reactivation-from-known.test.ts`

## 10. Validate Offline And Restart Safety

Manual checks:

- Launch the app offline after completing onboarding and capturing several cards.
- Confirm Review still loads due cards from local data.
- Submit ratings offline and confirm both card updates and review history persist across restart.
- Confirm no known-word onboarding step reappears unexpectedly after a clean completed launch.

Expected automated coverage:

- `tests/integration/review-offline-continuity.test.tsx`
- `tests/integration/review-restart-persistence.test.ts`

## 11. Measure Success Criteria

- Record time to first due-card answer submission across 5 runs and confirm it stays within 30 seconds.
- Confirm at least 95% of due cards render a usable front and back from locally stored data while offline.
- Confirm a 20-card session can be completed in under 6 minutes without optional detours.
- Confirm at least 90% of words already seeded or marked known are no longer offered as new reading captures.
- Capture these measurements in benchmark or manual validation records tied to the review quickstart before sign-off.

Expected automated coverage:

- `tests/benchmark/review-session-first-answer.benchmark.test.ts`
- `tests/benchmark/review-session-throughput.benchmark.test.ts`
