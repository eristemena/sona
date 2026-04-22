# Tasks: Daily Vocabulary Review

**Input**: Design documents from `/specs/005-daily-vocabulary-review/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Automated tests are required for this feature because it changes local persistence, review scheduling, onboarding state, known-word suppression, and offline continuity. Manual verification tasks are also included for the learner-visible review and onboarding flows.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add shared review-feature wiring and bundled local assets needed by all stories.

- [X] T001 Add daily-review export wiring and seed-asset packaging in /Volumes/xpro/erisristemena/made-by-ai/sona/package.json, /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/package.json, and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/index.ts
- [X] T002 [P] Add the bundled known-word seed asset set in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/known-word-seeds/topik-i-core.json and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/known-word-seeds/topik-ii-core.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the schema, repository methods, typed review contracts, and service skeletons required before any story can ship.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Create the daily-review migration and register it in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/migrations/005_daily_vocabulary_review_v1.sql and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/migrations/run-migrations.ts
- [X] T004 [P] Define shared review, known-word, and onboarding entities in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/review-card.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/known-word.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/index.ts
- [X] T005 [P] Define the typed review IPC contract and renderer window surface for queue, detail-edit, onboarding, and known-word restore flows in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/contracts/content-review.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/contracts/window-sona.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/app/window.d.ts
- [X] T006 [P] Extend SQLite repositories for review queue, review history, editable card details, known words, and onboarding state in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/content-library-repository.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/settings-repository.ts
- [X] T007 [P] Add main-process review and known-word service skeletons in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/daily-review-service.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/known-word-service.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/known-word-onboarding-service.ts
- [X] T008 Implement review IPC registration and startup wiring in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/ipc/review-handlers.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/index.ts
- [X] T009 Implement the preload bridge for review methods, card-detail repair, known-word restore, and reading eligibility checks in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/preload/index.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/reading-session-service.ts

**Checkpoint**: Foundation ready. The app can migrate the review schema, persist known-word and review state locally, and expose a typed review bridge to the renderer.

---

## Phase 3: User Story 1 - Review Due Vocabulary (Priority: P1) 🎯 MVP

**Goal**: Let learners run a calm daily review session from due cards, flip each card, rate recall, and persist updated FSRS scheduling.

**Independent Test**: Seed due active cards, open Review, confirm the queue loads the oldest due cards first, flip a card, submit ratings, and verify the next due values and history rows update locally.

### Tests for User Story 1 ⚠️

- [X] T010 [P] [US1] Add contract coverage for the review preload surface in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/contract/window-sona-review-contract.test.ts
- [X] T011 [P] [US1] Add schema and scheduler persistence coverage in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/contract/review-schema-contract.test.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/review-fsrs-next-update.test.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/review-history-persistence.test.ts
- [X] T012 [P] [US1] Add queue and UI integration coverage in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/review-queue-limit-and-order.test.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/review-card-flip.test.tsx, and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/review-rating-buttons-layout.test.tsx

### Implementation for User Story 1

- [X] T013 [US1] Implement due-card queue retrieval and FSRS rating application in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/content-library-repository.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/daily-review-service.ts
- [X] T014 [US1] Implement review-event recording and rating-to-grade helpers in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/review-card.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/daily-review-service.ts
- [X] T015 [US1] Wire review queue and rating endpoints through /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/ipc/review-handlers.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/preload/index.ts
- [X] T016 [P] [US1] Build renderer hooks for review queue and session state in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-review-queue.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-review-session.ts
- [X] T017 [US1] Build the review screen, flip card, and four-button rating grid in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/review/review-screen.tsx, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/review/review-card.tsx, and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/review/review-rating-grid.tsx
- [X] T018 [US1] Replace the review placeholder with the live review surface in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/shell/main-content-placeholder.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/app/page.tsx
- [X] T019 [US1] Add manual daily-review validation notes to /Volumes/xpro/erisristemena/made-by-ai/sona/specs/005-daily-vocabulary-review/quickstart.md

**Checkpoint**: User Story 1 should now provide the MVP daily review loop with due-card loading, card flipping, recall ratings, and persisted next-review scheduling.

---

## Phase 4: User Story 2 - Carry Reading Vocabulary Into Review (Priority: P2)

**Goal**: Ensure words captured from reading arrive in Review with saved meaning, grammar details, and inspectable provenance.

**Independent Test**: Add a word from the reading view, open Review, confirm the card back shows the captured detail snapshot, and verify the learner can inspect the source context.

### Tests for User Story 2 ⚠️

- [X] T020 [P] [US2] Add integration coverage for captured card details and provenance in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/reading-capture-review-card-details.test.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/review-card-provenance.test.ts
- [X] T021 [P] [US2] Add integration coverage for incomplete card-detail fallback rendering in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/review-card-missing-details.test.tsx
- [X] T039 [P] [US2] Add integration coverage for card-detail editing and persistence in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/review-card-detail-edit.test.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/review-card-detail-edit-persistence.test.ts

### Implementation for User Story 2

- [X] T022 [US2] Extend review-card storage and row mapping with answer-side detail snapshots in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/content-library-repository.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/review-card.ts
- [X] T023 [US2] Capture lookup-derived meaning, grammar, and provenance snapshots during add-to-deck in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/review-card-service.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/reading-session-service.ts
- [X] T024 [P] [US2] Render card back details and provenance inspection UI in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/review/review-card-back.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/review/review-screen.tsx
- [X] T025 [US2] Keep the reading add-to-deck flow aligned with richer review-card payloads in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-word-lookup.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/reading/word-lookup-popup.tsx
- [X] T040 [US2] Implement learner-editable card-detail updates across the review service, IPC surface, and renderer form in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/daily-review-service.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/ipc/review-handlers.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/preload/index.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/review/review-card-back.tsx
- [X] T026 [US2] Add manual reading-to-review provenance validation notes to /Volumes/xpro/erisristemena/made-by-ai/sona/specs/005-daily-vocabulary-review/quickstart.md

**Checkpoint**: User Stories 1 and 2 should now work together, with reading-captured words appearing in Review as provenance-preserving flashcards.

---

## Phase 5: User Story 3 - Avoid Unnecessary Vocabulary Prompts (Priority: P3)

**Goal**: Seed and manage known words locally so first-launch onboarding and later reading sessions suppress unnecessary add-to-deck prompts.

**Independent Test**: Start from a fresh database, complete onboarding, confirm `known_words` is seeded once, then revisit reading content and verify seeded or explicitly known words are not offered as fresh deck additions.

### Tests for User Story 3 ⚠️

- [X] T027 [P] [US3] Add onboarding coverage for first launch and idempotent completion in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/known-word-onboarding-first-launch.test.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/known-word-onboarding-idempotent.test.ts
- [X] T028 [P] [US3] Add suppression coverage for known and already-in-deck words in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/known-word-reading-suppression.test.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/review-duplicate-or-known-suppression.test.ts
- [X] T041 [P] [US3] Add restore-known coverage for clearing suppression and reactivating cards in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/known-word-clear-status.test.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/review-card-reactivation-from-known.test.ts

### Implementation for User Story 3

- [X] T029 [US3] Implement known-word persistence and onboarding-complete setting helpers in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/content-library-repository.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/settings-repository.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/known-word.ts
- [X] T030 [P] [US3] Implement bundled seed-pack loading and onboarding services in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/known-word-service.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/known-word-onboarding-service.ts
- [X] T031 [US3] Wire onboarding, mark-known, clear-known, and study-status endpoints through /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/ipc/review-handlers.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/preload/index.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/contracts/window-sona.ts
- [X] T032 [P] [US3] Build the full-screen known-word onboarding flow in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/review/known-word-onboarding.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-known-word-onboarding.ts
- [X] T033 [US3] Integrate an optional onboarding entry point and known-word actions into the review shell without blocking already-due cards in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/review/review-screen.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/shell/main-content-placeholder.tsx
- [X] T034 [US3] Implement reading-side suppression checks for known or already-in-deck vocabulary in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/reading-session-service.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-word-lookup.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/reading/word-lookup-popup.tsx
- [X] T042 [US3] Implement known-word clearing and card reactivation flows in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/content-library-repository.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/known-word-service.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/daily-review-service.ts
- [X] T043 [US3] Expose clear-known actions in the review shell and reading-side status UI in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/review/review-screen.tsx, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-word-lookup.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/reading/word-lookup-popup.tsx
- [X] T035 [US3] Add manual onboarding and known-word suppression validation notes to /Volumes/xpro/erisristemena/made-by-ai/sona/specs/005-daily-vocabulary-review/quickstart.md

**Checkpoint**: All three user stories should now be independently testable, with local onboarding and suppression preventing unnecessary review capture prompts.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize offline safety, restart continuity, and overall validation for the full review loop.

- [X] T036 [P] Add offline and restart regression coverage in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/review-offline-continuity.test.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/review-restart-persistence.test.ts
- [X] T037 [P] Add bounded-backlog and recovery coverage in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/review-backlog-recovery.test.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/review-queue-limit-and-order.test.ts
- [X] T038 Run the full daily-review quickstart validation path and capture final copy or fallback fixes in /Volumes/xpro/erisristemena/made-by-ai/sona/specs/005-daily-vocabulary-review/quickstart.md
- [X] T044 [P] Add explicit success-criteria timing and throughput measurement coverage in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/benchmark/review-session-first-answer.benchmark.test.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/tests/benchmark/review-session-throughput.benchmark.test.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/specs/005-daily-vocabulary-review/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. Start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion. Blocks all user stories.
- **User Stories (Phases 3-5)**: All depend on Foundational completion.
- **Polish (Phase 6)**: Depends on the desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational. This is the MVP slice and has no dependency on the reading-capture detail work or known-word onboarding because already-due cards remain accessible even before US3 lands.
- **User Story 2 (P2)**: Starts after Foundational and builds on the existing reading add-to-deck pipeline while remaining independently testable through provenance-rich review cards.
- **User Story 3 (P3)**: Starts after Foundational and reuses the Review and reading surfaces while remaining independently testable through onboarding and suppression flows.

### Within Each User Story

- Contract and integration tests must be written first and fail before implementation.
- Persistence and service work precede IPC completion when a story changes both.
- IPC and preload wiring precede renderer integration.
- Renderer implementation precedes quickstart and manual verification updates.
- Story-specific manual validation should happen at each checkpoint before moving to the next priority.

### Parallel Opportunities

- T002 can run in parallel with T001 after the asset location is agreed.
- T004-T007 can run in parallel after T003 begins, as long as file ownership does not overlap.
- Within US1, T010-T012 and T016 can run in parallel across contract, integration, and renderer-hook files.
- Within US2, T020-T021, T024, and T039 can run in parallel across tests and renderer card-detail files.
- Within US3, T027-T028, T030, T032, and T041 can run in parallel across tests, onboarding services, and renderer onboarding files.
- T036, T037, and T044 can run in parallel during polish.

---

## Parallel Example: User Story 1

```bash
# Launch User Story 1 tests together:
Task: "Add contract coverage for the review preload surface in tests/contract/window-sona-review-contract.test.ts"
Task: "Add schema and scheduler persistence coverage in tests/contract/review-schema-contract.test.ts, tests/integration/review-fsrs-next-update.test.ts, and tests/integration/review-history-persistence.test.ts"
Task: "Add queue and UI integration coverage in tests/integration/review-queue-limit-and-order.test.ts, tests/integration/review-card-flip.test.tsx, and tests/integration/review-rating-buttons-layout.test.tsx"

# Launch User Story 1 implementation work together:
Task: "Build renderer hooks for review queue and session state in apps/renderer/lib/use-review-queue.ts and apps/renderer/lib/use-review-session.ts"
Task: "Build the review screen, flip card, and four-button rating grid in apps/renderer/components/review/review-screen.tsx, apps/renderer/components/review/review-card.tsx, and apps/renderer/components/review/review-rating-grid.tsx"
```

## Parallel Example: User Story 2

```bash
# Launch User Story 2 tests together:
Task: "Add integration coverage for captured card details and provenance in tests/integration/reading-capture-review-card-details.test.ts and tests/integration/review-card-provenance.test.ts"
Task: "Add integration coverage for incomplete card-detail fallback rendering in tests/integration/review-card-missing-details.test.tsx"
Task: "Add integration coverage for card-detail editing and persistence in tests/integration/review-card-detail-edit.test.tsx and tests/integration/review-card-detail-edit-persistence.test.ts"

# Launch User Story 2 implementation work together:
Task: "Render card back details and provenance inspection UI in apps/renderer/components/review/review-card-back.tsx and apps/renderer/components/review/review-screen.tsx"
Task: "Keep the reading add-to-deck flow aligned with richer review-card payloads in apps/renderer/lib/use-word-lookup.ts and apps/renderer/components/reading/word-lookup-popup.tsx"
Task: "Implement learner-editable card-detail updates across the review service, IPC surface, and renderer form in apps/desktop/src/main/content/daily-review-service.ts, apps/desktop/src/main/ipc/review-handlers.ts, apps/desktop/src/preload/index.ts, and apps/renderer/components/review/review-card-back.tsx"
```

## Parallel Example: User Story 3

```bash
# Launch User Story 3 tests together:
Task: "Add onboarding coverage for first launch and idempotent completion in tests/integration/known-word-onboarding-first-launch.test.tsx and tests/integration/known-word-onboarding-idempotent.test.ts"
Task: "Add suppression coverage for known and already-in-deck words in tests/integration/known-word-reading-suppression.test.tsx and tests/integration/review-duplicate-or-known-suppression.test.ts"
Task: "Add restore-known coverage for clearing suppression and reactivating cards in tests/integration/known-word-clear-status.test.ts and tests/integration/review-card-reactivation-from-known.test.ts"

# Launch User Story 3 implementation work together:
Task: "Implement bundled seed-pack loading and onboarding services in apps/desktop/src/main/content/known-word-service.ts and apps/desktop/src/main/content/known-word-onboarding-service.ts"
Task: "Build the full-screen known-word onboarding flow in apps/renderer/components/review/known-word-onboarding.tsx and apps/renderer/lib/use-known-word-onboarding.ts"
Task: "Implement known-word clearing and card reactivation flows in packages/data/src/sqlite/content-library-repository.ts, apps/desktop/src/main/content/known-word-service.ts, and apps/desktop/src/main/content/daily-review-service.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Stop and validate the daily review loop independently before adding provenance enrichment or known-word onboarding.

### Incremental Delivery

1. Setup and foundational work establish the schema, repository methods, typed review bridge, and service skeletons.
2. User Story 1 delivers the MVP daily review surface.
3. User Story 2 enriches review cards with reading-derived detail and provenance.
4. User Story 3 adds first-launch onboarding and reading-side suppression for already-known vocabulary.
5. Phase 6 finishes offline, restart, and bounded-backlog validation.

### Suggested MVP Scope

- Deliver through **Phase 3 / User Story 1** first.
- Treat **User Story 2** and **User Story 3** as follow-on increments once the core review loop is stable.

### Parallel Team Strategy

1. One developer completes Setup and Foundational.
2. After Foundational:
   - Developer A: User Story 1 review queue and rating flow.
   - Developer B: User Story 2 reading-to-review detail and provenance.
   - Developer C: User Story 3 onboarding and known-word suppression.
3. Finish with shared polish and quickstart validation together.

---

## Notes

- `[P]` tasks operate on different files and can run in parallel.
- `[US1]` through `[US3]` map tasks directly to the three user stories in spec.md.
- User Story 1 is the recommended MVP slice.
- Persistence, scheduler updates, learner-editable card repairs, onboarding state, and suppression logic require tests before implementation.
- The feature remains local-first because onboarding, queue retrieval, and rating submission run entirely on local assets and SQLite state.
