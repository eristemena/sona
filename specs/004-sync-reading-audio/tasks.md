# Tasks: Sync Reading Audio

**Input**: Design documents from `/specs/004-sync-reading-audio/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Automated tests are required for this feature because it changes local persistence, provider-backed TTS and lookup behavior, reading-session progress, review scheduling, and offline fallback behavior. Manual verification tasks are also included for the learner-visible reading flow.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the shared dependencies and package wiring needed by all reading-sync flows.

- [ ] T001 Update reading-feature dependencies and workspace manifests in /Volumes/xpro/erisristemena/made-by-ai/sona/package.json, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/package.json, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/package.json, and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/integrations/package.json
- [ ] T002 [P] Add reading-module export wiring for shared contracts and content helpers in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/package.json, /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/index.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/contracts/window-sona.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the schema, repository, typed IPC surface, and service skeletons that all reading stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Create the synced-reading migration SQL and register it in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/migrations/003_sync_reading_audio_v1.sql and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/migrations/run-migrations.ts
- [ ] T004 [P] Define shared reading entities and helper types in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/reading-session.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/reading-audio.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/annotation-cache.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/review-card.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/index.ts
- [ ] T005 [P] Define the typed reading IPC contract and renderer window surface in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/contracts/content-reading.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/contracts/window-sona.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/app/window.d.ts
- [ ] T006 [P] Extend the SQLite repository with reading-progress, annotation-cache, audio-asset, exposure-log, and review-card persistence methods in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/content-library-repository.ts
- [ ] T007 [P] Add contract coverage for the reading schema and `window.sona.reading` preload surface in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/contract/reading-sync-schema-contract.test.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/contract/window-sona-reading-contract.test.ts
- [ ] T008 Implement main-process reading IPC registration and app startup wiring in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/ipc/reading-handlers.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/index.ts
- [ ] T009 Implement shared reading service skeletons and local cache-path utilities in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/reading-session-service.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/reading-progress-service.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/audio-cache-service.ts
- [ ] T010 Implement the preload bridge for reading methods in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/preload/index.ts

**Checkpoint**: Foundation ready. The app can initialize synced-reading tables, expose typed reading methods to the renderer, and persist the core reading entities required by every story.

---

## Phase 3: User Story 1 - Read With Synced Audio (Priority: P1) 🎯 MVP

**Goal**: Open saved content in a focused reading surface with block-level audio generation, cached replay, and karaoke-style word highlighting for the active block.

**Independent Test**: Open a saved content item, confirm the reading text appears immediately, start playback for the active block, verify highlighted words follow the spoken token through pause, replay, speed changes, and scrubbing within that block, then reopen the same content and confirm cached audio avoids a second provider wait.

### Tests for User Story 1 ⚠️

- [ ] T011 [P] [US1] Add integration coverage for first-open audio generation and cached reopen in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/audio-cache-first-open.test.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/audio-cache-reopen.test.ts
- [ ] T012 [P] [US1] Add integration coverage for karaoke timing, playback controls, malformed or missing timing fallback, and offline text-first fallback in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/synced-reading-audio.test.tsx, /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/word-highlight-timing-drift.test.tsx, /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/reading-timing-fallback.test.tsx, and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/reading-view-offline-fallback.test.tsx

### Implementation for User Story 1

- [ ] T013 [P] [US1] Implement the OpenRouter TTS provider and response normalization for block audio in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/integrations/src/tts/provider-adapter.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/providers/openrouter-tts-provider.ts
- [ ] T014 [P] [US1] Implement block-audio generation, cache persistence, invalidation, and timing-parse fallback flows in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/audio-cache-service.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/reading-session-service.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/content-library-repository.ts
- [ ] T015 [US1] Wire reading-session bootstrap and audio retrieval through the main-process reading handlers in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/ipc/reading-handlers.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/preload/index.ts
- [ ] T016 [P] [US1] Build renderer hooks for reading-session state, audio playback, and karaoke timing in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-reading-session.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-reading-playback.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-karaoke-sync.ts
- [ ] T017 [US1] Build the reading surface, flowing token renderer, and audio control UI in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/reading/reading-view.tsx, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/reading/reading-audio-controls.tsx, and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/library/content-library-screen.tsx
- [ ] T018 [US1] Persist and restore reading progress for content reopen behavior in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/reading-progress-service.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/ipc/reading-handlers.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-reading-session.ts
- [ ] T019 [US1] Add synced-audio and cached-reopen manual verification notes to /Volumes/xpro/erisristemena/made-by-ai/sona/specs/004-sync-reading-audio/quickstart.md

**Checkpoint**: User Story 1 should now provide the MVP reading loop with immediate text display, optional hosted audio, cached reopen behavior, and synchronized highlighting.

---

## Phase 4: User Story 2 - Inspect Words In Context (Priority: P2)

**Goal**: Let learners tap words in the reading view to see meaning and grammar notes immediately, with a richer explanation path that preserves the reading flow.

**Independent Test**: Tap words during an active reading session, confirm an anchored popup shows the cached or live lookup result, dismiss it without losing place, and request more grammar detail with either a richer explanation or a clear fallback message.

### Tests for User Story 2 ⚠️

- [ ] T020 [P] [US2] Add integration coverage for stale-while-revalidate annotation cache behavior and provider-unavailable lookup fallback in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/annotation-cache-stale-refresh.test.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/reading-view-provider-unavailable.test.ts
- [ ] T021 [P] [US2] Add integration coverage for anchored popup dismissal and repeated-word context selection in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/reading-popup-dismissal.test.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/repeated-word-lookup-context.test.tsx

### Implementation for User Story 2

- [ ] T022 [P] [US2] Implement annotation-cache storage, sentence-context hashing, and stale refresh queue behavior in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/annotation-cache-service.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/content-library-repository.ts
- [ ] T023 [P] [US2] Implement OpenRouter lookup and grammar explanation providers in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/integrations/src/llm/provider-adapter.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/providers/openrouter-reading-annotation-provider.ts
- [ ] T024 [US2] Wire lookup and grammar explanation flows into the reading IPC handlers in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/ipc/reading-handlers.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/reading-session-service.ts
- [ ] T025 [P] [US2] Build the anchored word popup, outside-click dismissal, and grammar expansion UI in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/reading/word-lookup-popup.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-word-lookup.ts
- [ ] T026 [US2] Integrate tap-to-lookup and richer grammar requests into the reading token renderer in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/reading/reading-view.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-reading-session.ts
- [ ] T027 [US2] Add tap-to-lookup and grammar fallback manual verification notes to /Volumes/xpro/erisristemena/made-by-ai/sona/specs/004-sync-reading-audio/quickstart.md

**Checkpoint**: User Stories 1 and 2 should now work together, with synced reading, immediate lookup responses, and richer grammar help that remains optional and non-blocking.

---

## Phase 5: User Story 3 - Save Words For Review (Priority: P3)

**Goal**: Allow learners to add a selected word to their review deck from the reading surface while preserving provenance, respecting duplicate rules, and batching passive exposure writes at session end.

**Independent Test**: Select a word, add it to the deck, confirm only one FSRS-backed card is created with source context, verify duplicate or over-limit actions return the correct message, then exit the session and confirm exposures flush in one batch.

### Tests for User Story 3 ⚠️

- [ ] T028 [P] [US3] Add integration coverage for add-to-deck creation, duplicate blocking, and pacing deferral in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/reading-view-add-to-deck.test.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/review-load-bounded-from-reading.test.ts
- [ ] T029 [P] [US3] Add integration coverage for session-end exposure batching and idempotent flush behavior in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/exposure-log-batching.test.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/reading-session-close-flush.test.ts

### Implementation for User Story 3

- [ ] T030 [P] [US3] Implement FSRS-backed review-card creation and duplicate or pacing policy helpers in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/review-card.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/review-pacing.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/index.ts
- [ ] T031 [P] [US3] Implement repository writes for review cards and exposure-log batching in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/content-library-repository.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/workloads/reading-exposure-flush.ts
- [ ] T032 [P] [US3] Implement the main-process review-card and session-flush services in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/review-card-service.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/reading-session-service.ts
- [ ] T033 [US3] Wire add-to-deck and exposure-flush endpoints through the reading IPC surface in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/ipc/reading-handlers.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/preload/index.ts
- [ ] T034 [P] [US3] Add add-to-deck actions, duplicate or deferred messaging, and session-end flush triggers to the renderer in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/reading/word-lookup-popup.tsx, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-word-lookup.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-reading-session.ts
- [ ] T035 [US3] Add review-capture, later provenance inspection, and exposure-log manual verification notes to /Volumes/xpro/erisristemena/made-by-ai/sona/specs/004-sync-reading-audio/quickstart.md

**Checkpoint**: All three user stories should now be independently testable, with reading, lookup, and learner-triggered deck capture functioning together without creating unbounded review load.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize cross-story regression coverage, cleanup behavior, and end-to-end validation for the full reading loop.

- [ ] T036 [P] Add regression coverage for reading-progress restore, later review-card provenance retrieval, and cached-audio cleanup on invalidation in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/reading-progress-persistence.test.tsx, /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/review-card-provenance.test.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/audio-cache-cleanup.test.ts
- [ ] T037 [P] Extend offline startup and migration-safety coverage for the reading surface in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/offline-content-library-startup.test.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/reading-view-offline-fallback.test.tsx
- [ ] T038 Run the full synced-reading quickstart validation path and capture any final copy or fallback fixes in /Volumes/xpro/erisristemena/made-by-ai/sona/specs/004-sync-reading-audio/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. Start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion. Blocks all user stories.
- **User Stories (Phases 3-5)**: All depend on Foundational completion.
- **Polish (Phase 6)**: Depends on the desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational. This is the MVP slice and has no dependency on lookup or review capture.
- **User Story 2 (P2)**: Starts after Foundational and builds on the reading surface from US1 while remaining independently testable through lookup-specific flows.
- **User Story 3 (P3)**: Starts after Foundational and reuses the reading and lookup surfaces while remaining independently testable through add-to-deck and exposure-flush flows.

### Within Each User Story

- Contract and integration tests must be written first and fail before implementation.
- Provider and repository work precede IPC completion when a story changes both.
- IPC and preload wiring precede renderer integration.
- Renderer implementation precedes quickstart and manual verification updates.
- Story-specific manual validation should happen at each checkpoint before moving to the next priority.

### Parallel Opportunities

- T002 can run in parallel with T001 once dependency ownership is clear.
- T004-T007 can run in parallel after T003 begins, as long as file ownership does not overlap.
- Within US1, T011-T014 and T016 can run in parallel across test, provider, repository, and renderer-hook files.
- Within US2, T020-T023 and T025 can run in parallel across tests, cache service, provider logic, and popup UI files.
- Within US3, T028-T032 and T034 can run in parallel across tests, domain policy, repository, service, and renderer files.
- T036 and T037 can run in parallel during the polish phase.

---

## Parallel Example: User Story 1

```bash
# Launch User Story 1 tests together:
Task: "Add integration coverage for first-open audio generation and cached reopen in tests/integration/audio-cache-first-open.test.ts and tests/integration/audio-cache-reopen.test.ts"
Task: "Add integration coverage for karaoke timing, playback controls, and offline text-first fallback in tests/integration/synced-reading-audio.test.tsx, tests/integration/word-highlight-timing-drift.test.tsx, and tests/integration/reading-view-offline-fallback.test.tsx"

# Launch User Story 1 implementation work together:
Task: "Implement the OpenRouter TTS provider and response normalization for block audio in packages/integrations/src/tts/provider-adapter.ts and apps/desktop/src/main/providers/openrouter-tts-provider.ts"
Task: "Build renderer hooks for reading-session state, audio playback, and karaoke timing in apps/renderer/lib/use-reading-session.ts, apps/renderer/lib/use-reading-playback.ts, and apps/renderer/lib/use-karaoke-sync.ts"
```

## Parallel Example: User Story 2

```bash
# Launch User Story 2 tests together:
Task: "Add integration coverage for stale-while-revalidate annotation cache behavior and provider-unavailable lookup fallback in tests/integration/annotation-cache-stale-refresh.test.ts and tests/integration/reading-view-provider-unavailable.test.ts"
Task: "Add integration coverage for anchored popup dismissal and repeated-word context selection in tests/integration/reading-popup-dismissal.test.tsx and tests/integration/repeated-word-lookup-context.test.tsx"

# Launch User Story 2 implementation work together:
Task: "Implement annotation-cache storage, sentence-context hashing, and stale refresh queue behavior in apps/desktop/src/main/content/annotation-cache-service.ts and packages/data/src/sqlite/content-library-repository.ts"
Task: "Build the anchored word popup, outside-click dismissal, and grammar expansion UI in apps/renderer/components/reading/word-lookup-popup.tsx and apps/renderer/lib/use-word-lookup.ts"
```

## Parallel Example: User Story 3

```bash
# Launch User Story 3 tests together:
Task: "Add integration coverage for add-to-deck creation, duplicate blocking, and pacing deferral in tests/integration/reading-view-add-to-deck.test.tsx and tests/integration/review-load-bounded-from-reading.test.ts"
Task: "Add integration coverage for session-end exposure batching and idempotent flush behavior in tests/integration/exposure-log-batching.test.ts and tests/integration/reading-session-close-flush.test.ts"

# Launch User Story 3 implementation work together:
Task: "Implement FSRS-backed review-card creation and duplicate or pacing policy helpers in packages/domain/src/content/review-card.ts, packages/domain/src/content/review-pacing.ts, and packages/domain/src/content/index.ts"
Task: "Add add-to-deck actions, duplicate or deferred messaging, and session-end flush triggers to the renderer in apps/renderer/components/reading/word-lookup-popup.tsx, apps/renderer/lib/use-word-lookup.ts, and apps/renderer/lib/use-reading-session.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Stop and validate the synced-reading loop independently before adding lookup or review capture.

### Incremental Delivery

1. Setup and foundational work establish the schema, repository, typed reading bridge, and service skeletons.
2. User Story 1 delivers the MVP synced-reading surface.
3. User Story 2 adds contextual lookup and richer grammar help.
4. User Story 3 adds learner-triggered review capture and passive exposure batching.
5. Phase 6 finishes cleanup, restore, and offline regression validation.

### Suggested MVP Scope

- Deliver through **Phase 3 / User Story 1** first.
- Treat **User Story 2** and **User Story 3** as follow-on increments once synced reading is stable.

### Parallel Team Strategy

1. One developer completes Setup and Foundational.
2. After Foundational:
   - Developer A: User Story 1 synced reading and audio.
   - Developer B: User Story 2 lookup and grammar help.
   - Developer C: User Story 3 review capture and exposure batching.
3. Finish with shared polish and quickstart validation together.

---

## Notes

- `[P]` tasks operate on different files and can run in parallel.
- `[US1]` through `[US3]` map tasks directly to the three user stories in spec.md.
- User Story 1 is the recommended MVP slice.
- Persistence, audio generation, timing fallback, annotation caching, and review scheduling require tests before implementation.
- The feature remains local-first even when hosted TTS and grammar enrichment are optionally enabled.