# Tasks: Add Content Library

**Input**: Design documents from `/specs/003-add-content-library/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Automated tests are required for this feature because it changes local persistence, content derivation, import/export behavior, optional provider-backed generation, and offline fallbacks. Manual verification tasks are also included for learner-visible import, browse, delete, and fallback flows.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the shared dependencies and module entrypoints needed by all content-library flows.

- [ ] T001 Update workspace and desktop dependencies for content-library ingestion in /Volumes/xpro/erisristemena/made-by-ai/sona/package.json and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/package.json
- [ ] T002 [P] Add shared content module exports for new content-library domain types in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/package.json and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the schema, repository, typed contracts, and IPC boundary that every add-content story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Create the content-library migration SQL and extend migration loading in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/migrations/002_content_library_v1.sql and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/migrations/run-migrations.ts
- [ ] T004 [P] Define shared content entities, difficulty helpers, and structural ID utilities in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/content-block.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/content-library-item.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/difficulty.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/content-id.ts
- [ ] T005 [P] Implement the SQLite content-library repository with transactional save, list, delete, and duplicate-candidate lookup behavior in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/content-library-repository.ts
- [ ] T006 [P] Define the typed content IPC contract in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/contracts/content-library.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/contracts/window-sona.ts
- [ ] T007 Implement main-process content IPC registration and startup wiring in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/ipc/content-handlers.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/index.ts
- [ ] T008 Implement the preload content bridge and renderer type exposure in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/preload/index.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/app/window.d.ts
- [ ] T009 [P] Add contract coverage for the content-library schema and `window.sona.content` surface in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/contract/content-library-schema-contract.test.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/contract/window-sona-content-library-contract.test.ts

**Checkpoint**: Foundation ready. The app can initialize content-library tables, persist content-library records transactionally, and expose typed content methods to the renderer.

---

## Phase 3: User Story 1 - Manage the Content Library (Priority: P1) 🎯 MVP

**Goal**: Show all locally saved content in one library surface with visible type and difficulty metadata, filter/search support, and deletion.

**Independent Test**: Open the Content Library with saved sample items, verify that each card shows a recognizable title, type, and Korean difficulty badge, then delete one item and confirm it disappears immediately and stays deleted after reload.

### Tests for User Story 1 ⚠️

- [ ] T010 [P] [US1] Add integration coverage for content-library browse, filter, search, and provenance-detail display behavior in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/content-library-browse.test.tsx
- [ ] T011 [P] [US1] Add integration coverage for deletion, no-review side effects, and explicit import-to-review-boundary behavior in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/content-library-delete.test.tsx, /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/review-load-implications.test.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/import-review-boundary.test.ts

### Implementation for User Story 1

- [ ] T012 [P] [US1] Implement library query state, filter mapping, and search helpers in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-content-library.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/content-library-filters.ts
- [ ] T013 [P] [US1] Build the Content Library card grid, filter pills, search input, and provenance-detail affordance UI in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/library/content-library-screen.tsx, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/library/content-library-card.tsx, and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/library/content-library-toolbar.tsx
- [ ] T014 [US1] Integrate the Content Library destination into shell rendering in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/shell/main-content-placeholder.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/shell/app-shell.tsx
- [ ] T015 [US1] Implement library item deletion flow and empty-state behavior in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/library/content-delete-dialog.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/library/content-library-screen.tsx
- [ ] T016 [US1] Add Content Library browse, provenance-detail, and delete manual verification notes to /Volumes/xpro/erisristemena/made-by-ai/sona/specs/003-add-content-library/quickstart.md

**Checkpoint**: User Story 1 should now provide a browsable and manageable Content Library MVP with local deletion and no automatic review creation.

---

## Phase 4: User Story 2 - Import Drama Subtitles (Priority: P2)

**Goal**: Import Korean drama subtitle files into the local Content Library as subtitle-derived sentence blocks with preserved timing.

**Independent Test**: Import a supported SRT file, confirm a new subtitle item appears in the library with the required difficulty, and verify malformed or duplicate subtitle input is rejected or warned without creating a partial item.

### Tests for User Story 2 ⚠️

- [ ] T017 [P] [US2] Add integration coverage for successful subtitle import and duplicate-warning behavior in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/subtitle-import-flow.test.ts
- [ ] T018 [P] [US2] Add integration coverage for malformed subtitle rejection and subtitle provenance retention in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/subtitle-import-error.test.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/provenance-artifact-integrity.test.ts

### Implementation for User Story 2

- [ ] T019 [P] [US2] Add subtitle import input types and subtitle-specific mapping helpers in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/subtitle-import.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/provenance/corpus-segment.ts
- [ ] T020 [P] [US2] Implement the SRT parser service and subtitle block mapping in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/srt-import-service.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/subtitle-block-mapper.ts
- [ ] T021 [US2] Wire subtitle import through content IPC handlers and repository persistence in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/ipc/content-handlers.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/content-library-repository.ts
- [ ] T022 [US2] Add subtitle import controls and duplicate-confirmation UI to the library flow in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/library/add-content-dialog.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/library/content-library-screen.tsx
- [ ] T023 [US2] Add subtitle import and timing-offset verification notes to /Volumes/xpro/erisristemena/made-by-ai/sona/specs/003-add-content-library/quickstart.md

**Checkpoint**: User Stories 1 and 2 should now work together, with subtitle files importing into the shared library while remaining independently testable.

---

## Phase 5: User Story 3 - Add Korean Article Content (Priority: P3)

**Goal**: Let learners add article content by paste or optional scrape and save the resulting sentence blocks as article items in the library.

**Independent Test**: Paste Korean article text and scrape a reachable article URL, confirm both appear as article items in the library, and verify scrape failures remain non-destructive while paste continues to work offline.

### Tests for User Story 3 ⚠️

- [ ] T024 [P] [US3] Add integration coverage for pasted article save, article filtering, and duplicate-warning behavior in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/article-paste-flow.test.tsx
- [ ] T025 [P] [US3] Add integration coverage for article scrape duplicate-warning, fallback, and non-destructive failure handling in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/article-scrape-fallback.test.ts

### Implementation for User Story 3

- [ ] T026 [P] [US3] Implement Korean-aware article sentence splitting and article source helpers in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/sentence-splitter.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/article-source.ts
- [ ] T027 [P] [US3] Implement main-process article paste and scrape services in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/article-content-service.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/providers/article-scraper.ts
- [ ] T028 [US3] Wire article creation flows into content IPC handlers and preload methods in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/ipc/content-handlers.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/preload/index.ts
- [ ] T029 [US3] Add article paste and scrape controls plus duplicate-confirmation UI for both article save paths in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/library/add-content-dialog.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/library/content-library-screen.tsx
- [ ] T030 [US3] Add article paste, scrape, and offline-fallback verification notes to /Volumes/xpro/erisristemena/made-by-ai/sona/specs/003-add-content-library/quickstart.md

**Checkpoint**: User Stories 1 through 3 should now support shared library management plus both local article paste and optional scraping.

---

## Phase 6: User Story 4 - Generate Practice Sentences (Priority: P4)

**Goal**: Generate Korean practice sentences for a learner-selected topic and difficulty, then save only validated results to the library.

**Independent Test**: Request generated practice sentences, confirm validated results appear as generated items in the library with accepted or relabeled difficulty, and verify no-key or validation-failure paths do not create saved items.

### Tests for User Story 4 ⚠️

- [ ] T031 [P] [US4] Add integration coverage for generated-content difficulty validation, relabel, reject, and duplicate-warning behavior in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/generated-content-difficulty-validation.test.ts
- [ ] T032 [P] [US4] Extend no-key and offline provider fallback coverage for generation failures in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/offline-no-key-feasibility.test.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/provider-fallback-no-key.test.ts

### Implementation for User Story 4

- [ ] T033 [P] [US4] Implement generation request models, difficulty prompt policy, and validation result mapping in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/generation-request.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/difficulty-policy.ts
- [ ] T034 [P] [US4] Implement OpenRouter generation and difficulty-validation services in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/providers/openrouter-content-generator.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/generated-content-service.ts
- [ ] T035 [US4] Persist generation outcomes and generated content blocks through the repository and content IPC handlers in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/content-library-repository.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/ipc/content-handlers.ts
- [ ] T036 [US4] Add generated-content controls, duplicate-confirmation UI, and validated difficulty messaging to the library UI in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/library/add-content-dialog.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/library/content-library-screen.tsx
- [ ] T037 [US4] Add generated-content, requested-versus-validated difficulty, relabel, and reject verification notes to /Volumes/xpro/erisristemena/made-by-ai/sona/specs/003-add-content-library/quickstart.md

**Checkpoint**: All four user stories should now be independently testable, with optional provider-backed generation layered on top of the local-first library.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Finalize end-to-end regression coverage, offline validation, and documented verification across all content-library flows.

- [ ] T038 [P] Add cross-story provenance integrity coverage for subtitle, article, and generated items, including learner-visible source details, in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/provenance-artifact-integrity.test.ts
- [ ] T039 [P] Add offline startup and content-library bootstrap regression coverage in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/offline-content-library-startup.test.ts
- [ ] T040 Validate the full quickstart flow, including import-to-study-to-review-boundary checks, and record latest verification notes in /Volumes/xpro/erisristemena/made-by-ai/sona/specs/003-add-content-library/quickstart.md


---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. Start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion. Blocks all user stories.
- **User Stories (Phases 3-6)**: All depend on Foundational completion.
- **Polish (Phase 7)**: Depends on the desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational. No dependency on the ingest stories.
- **User Story 2 (P2)**: Starts after Foundational and uses the library surface from US1 to expose imported subtitle content.
- **User Story 3 (P3)**: Starts after Foundational and builds on the same library surface while remaining independently testable through paste and scrape flows.
- **User Story 4 (P4)**: Starts after Foundational and reuses the content repository plus library UI while remaining independently testable through validated generation behavior and requested-versus-validated provenance.

### Within Each User Story

- Contract and integration tests must be written first and fail before implementation.
- Shared domain types and content services precede main-process IPC wiring.
- Main-process IPC wiring precedes preload updates when the surface changes.
- Preload and backend wiring precede renderer integration.
- Renderer implementation precedes quickstart/manual verification updates.
- The end-to-end manual acceptance path must include the review boundary check that verifies imports do not create scheduled work automatically.

### Parallel Opportunities

- T002 can run in parallel with T001 once package ownership is clear.
- T004-T006 and T009 can run in parallel after T003 begins, as long as file ownership does not overlap.
- Within US1, T010-T013 can run in parallel across test, hook, and component files.
- Within US2, T017-T020 can run in parallel across tests, domain helpers, and main-process parser files.
- Within US3, T024-T027 can run in parallel across tests, domain helpers, and article service files.
- Within US4, T031-T034 can run in parallel across tests, domain prompt policy, and provider service files.
- T038 and T039 can run in parallel during the polish phase.
- T040 depends on at least one implemented import flow plus the library and review-boundary validation path.

---

## Parallel Example: User Story 1

```bash
# Launch User Story 1 tests together:
Task: "Add integration coverage for content-library browse, filter, search, and provenance-detail display behavior in tests/integration/content-library-browse.test.tsx"
Task: "Add integration coverage for deletion and no-review side effects in tests/integration/content-library-delete.test.tsx and tests/integration/review-load-implications.test.ts"

# Launch User Story 1 renderer work together:
Task: "Implement library query state, filter mapping, and search helpers in apps/renderer/lib/use-content-library.ts and apps/renderer/lib/content-library-filters.ts"
Task: "Build the Content Library card grid, filter pills, search input, and provenance-detail affordance UI in apps/renderer/components/library/content-library-screen.tsx, apps/renderer/components/library/content-library-card.tsx, and apps/renderer/components/library/content-library-toolbar.tsx"
```

## Parallel Example: User Story 2

```bash
# Launch User Story 2 tests together:
Task: "Add integration coverage for successful subtitle import into the library in tests/integration/subtitle-import-flow.test.ts"
Task: "Add integration coverage for malformed subtitle rejection and subtitle provenance retention in tests/integration/subtitle-import-error.test.ts and tests/integration/provenance-artifact-integrity.test.ts"

# Launch User Story 2 subtitle services together:
Task: "Add subtitle import input types and subtitle-specific mapping helpers in packages/domain/src/content/subtitle-import.ts and packages/domain/src/provenance/corpus-segment.ts"
Task: "Implement the SRT parser service and subtitle block mapping in apps/desktop/src/main/content/srt-import-service.ts and apps/desktop/src/main/content/subtitle-block-mapper.ts"
```

## Parallel Example: User Story 3

```bash
# Launch User Story 3 tests together:
Task: "Add integration coverage for pasted article save, article filtering, and duplicate-warning behavior in tests/integration/article-paste-flow.test.tsx"
Task: "Add integration coverage for article scrape duplicate-warning, fallback, and non-destructive failure handling in tests/integration/article-scrape-fallback.test.ts"

# Launch User Story 3 article services together:
Task: "Implement Korean-aware article sentence splitting and article source helpers in packages/domain/src/content/sentence-splitter.ts and packages/domain/src/content/article-source.ts"
Task: "Implement main-process article paste and scrape services in apps/desktop/src/main/content/article-content-service.ts and apps/desktop/src/main/providers/article-scraper.ts"
```

## Parallel Example: User Story 4

```bash
# Launch User Story 4 tests together:
Task: "Add integration coverage for generated-content difficulty validation, requested-versus-validated provenance, relabel, and reject behavior in tests/integration/generated-content-difficulty-validation.test.ts"
Task: "Extend no-key and offline provider fallback coverage for generation failures in tests/integration/offline-no-key-feasibility.test.ts and tests/integration/provider-fallback-no-key.test.ts"

# Launch User Story 4 provider work together:
Task: "Implement generation request models, difficulty prompt policy, and validation result mapping in packages/domain/src/content/generation-request.ts and packages/domain/src/content/difficulty-policy.ts"
Task: "Implement OpenRouter generation and difficulty-validation services in apps/desktop/src/main/providers/openrouter-content-generator.ts and apps/desktop/src/main/content/generated-content-service.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Stop and validate the Content Library browse/delete loop plus provenance-detail inspection independently before adding ingest flows.

### Incremental Delivery

1. Setup and foundational work establish the schema, repository, typed preload boundary, and content API.
2. User Story 1 delivers the Content Library management MVP.
3. User Story 2 adds subtitle import.
4. User Story 3 adds article paste and optional scrape.
5. User Story 4 adds optional validated AI generation.
6. Phase 7 finishes full offline, provenance, duplicate-warning, and import-to-study-to-review-boundary validation.

### Suggested MVP Scope

- Deliver through **Phase 3 / User Story 1** first.
- Treat **User Story 2**, **User Story 3**, and **User Story 4** as follow-on increments once the library browse/delete surface is stable.

### Parallel Team Strategy

1. One developer completes Setup and Foundational.
2. After Foundational:
   - Developer A: User Story 1 library browse and delete.
   - Developer B: User Story 2 subtitle import.
   - Developer C: User Story 3 article paste and scrape.
   - Developer D: User Story 4 generated-content validation.
3. Finish with shared regression coverage and quickstart validation together.

---

## Notes

- `[P]` tasks operate on different files and can run in parallel.
- `[US1]` through `[US4]` map tasks directly to the four user stories in spec.md.
- User Story 1 is the recommended MVP slice.
- Persistence, import/export, derivation, duplicate-warning, and provider flows require tests before implementation.
- The feature remains local-first even when scrape and generation paths are optionally enabled.