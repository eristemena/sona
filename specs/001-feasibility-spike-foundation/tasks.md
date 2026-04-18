# Tasks: Feasibility Spike Foundation

**Input**: Design documents from `/specs/001-feasibility-spike-foundation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include automated test tasks whenever a story changes persistence, scheduling, content derivation, import/export, or TTS/audio orchestration. For this feature, each user story includes required contract and integration or benchmark validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the workspace, package layout, and tooling needed for all three spikes.

- [X] T001 Update root workspace scripts and npm workspaces in /Volumes/xpro/erisristemena/made-by-ai/sona/package.json
- [X] T002 [P] Create shared TypeScript base config in /Volumes/xpro/erisristemena/made-by-ai/sona/tsconfig.base.json
- [X] T003 [P] Create desktop and renderer package manifests in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/package.json and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/package.json
- [X] T004 [P] Create shared package manifests in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/package.json, /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/package.json, and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/integrations/package.json
- [X] T005 [P] Configure Vitest and shared test setup in /Volumes/xpro/erisristemena/made-by-ai/sona/vitest.config.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/setup/vitest.setup.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the local-first contracts, storage bootstrap, and artifact plumbing that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 Create Electron-safe application API contract in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/contracts/app-api.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/preload/src/index.ts
- [X] T007 [P] Implement shared spike artifact schemas and validators in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/artifacts/spike-artifact-schema.ts
- [X] T008 [P] Implement provenance entities and mappings in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/provenance/corpus-segment.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/provenance/study-candidate-provenance.ts
- [X] T009 [P] Create SQLite connection bootstrap with WAL defaults in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/connection.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/migrations/001_initial_schema.sql
- [X] T010 Implement corpus fixture ingestion utilities in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/fixtures/corpus-loader.ts
- [X] T011 Implement local artifact writing utilities in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/artifacts/write-artifact.ts
- [X] T012 Create shared benchmark runner utilities in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/benchmark/run-benchmark.ts

**Checkpoint**: Foundation ready. User story work can now proceed in parallel.

---

## Phase 3: User Story 1 - Confirm the Tokenization Track (Priority: P1) 🎯 MVP

**Goal**: Produce a tokenizer decision artifact that compares tokenization tracks across the stratified Korean corpus and identifies learner-visible risks.

**Independent Test**: Run the tokenizer spike against the fixture corpus, validate the tokenizer artifact schema, and confirm the report identifies a recommended track plus documented failure patterns by stratum.

### Tests for User Story 1 (required for constitution-sensitive changes) ⚠️

- [X] T013 [P] [US1] Add tokenizer artifact contract test in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/contract/spike-artifact.tokenizer.test.ts
- [X] T014 [P] [US1] Add tokenizer spike benchmark test in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/benchmark/tokenizer-spike.test.ts

### Implementation for User Story 1

- [X] T015 [P] [US1] Implement tokenization evaluation model in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/tokenizer/tokenization-evaluation-result.ts
- [X] T016 [P] [US1] Implement local tokenizer and reference-track adapters in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/tokenizer/local-js-segmenter.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/tokenizer/llm-fallback-reference.ts
- [X] T017 [US1] Implement tokenizer scoring and learner-impact classification in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/tokenizer/evaluate-tokenizer.ts
- [X] T018 [US1] Implement tokenizer spike runner in /Volumes/xpro/erisristemena/made-by-ai/sona/spikes/tokenizer/src/run-tokenizer-spike.ts
- [X] T019 [US1] Emit the tokenizer report artifact in /Volumes/xpro/erisristemena/made-by-ai/sona/spikes/tokenizer/src/write-tokenizer-report.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/artifacts/tokenizer/report.json

**Checkpoint**: User Story 1 should now be independently runnable and produce a planning-ready tokenizer report.

---

## Phase 4: User Story 2 - Define the Optional LLM Fallback (Priority: P2)

**Goal**: Produce a provider fallback specification artifact that preserves no-key usability, bounded latency, and session caps for optional provider-assisted behaviors.

**Independent Test**: Validate the provider fallback contract and run the fallback specification generator to confirm it covers triggers, prompt references, latency budgets, cost ceilings, usage caps, and no-key behavior.

### Tests for User Story 2 (required for constitution-sensitive changes) ⚠️

- [X] T020 [P] [US2] Add provider fallback contract test in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/contract/provider-fallback-contract.test.ts
- [X] T021 [P] [US2] Add no-key fallback integration test in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/provider-fallback-no-key.test.ts

### Implementation for User Story 2

- [X] T022 [P] [US2] Implement provider fallback policy model in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/fallback/provider-fallback-policy.ts
- [X] T023 [P] [US2] Implement provider adapter interfaces in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/integrations/src/llm/provider-adapter.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/integrations/src/tts/provider-adapter.ts
- [X] T024 [US2] Implement fallback eligibility, cap, and latency evaluation in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/fallback/evaluate-fallback-policy.ts
- [X] T025 [US2] Implement degraded and no-key local-only result handling in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/fallback/fallback-result.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/fallback/local-only-behavior.ts
- [X] T026 [US2] Create local prompt template references in /Volumes/xpro/erisristemena/made-by-ai/sona/spikes/llm-fallback/prompts/annotation-help.md and /Volumes/xpro/erisristemena/made-by-ai/sona/spikes/llm-fallback/prompts/translation-help.md
- [X] T027 [US2] Implement fallback specification generator in /Volumes/xpro/erisristemena/made-by-ai/sona/spikes/llm-fallback/src/generate-fallback-spec.ts
- [X] T028 [US2] Emit the provider fallback artifact in /Volumes/xpro/erisristemena/made-by-ai/sona/spikes/llm-fallback/src/write-fallback-artifact.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/artifacts/llm-fallback/policy.json

**Checkpoint**: User Stories 1 and 2 should both work independently, with provider fallback still optional and no-key safe.

---

## Phase 5: User Story 3 - Validate Local Data Concurrency (Priority: P3)

**Goal**: Produce a SQLite concurrency benchmark artifact that proves or bounds local responsiveness on baseline 2019-era hardware.

**Independent Test**: Run the concurrency benchmark, validate the concurrency artifact schema, and confirm the report records hardware profile, overlapping jobs, timing outcomes, bottlenecks, and mitigations.

### Tests for User Story 3 (required for constitution-sensitive changes) ⚠️

- [X] T029 [P] [US3] Add SQLite concurrency artifact contract test in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/contract/spike-artifact.sqlite-concurrency.test.ts
- [X] T030 [P] [US3] Add SQLite concurrency benchmark test in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/benchmark/sqlite-concurrency-spike.test.ts

### Implementation for User Story 3

- [X] T031 [P] [US3] Implement benchmark workload definitions in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/workloads/annotation-refresh.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/workloads/srs-harvest.ts
- [X] T032 [P] [US3] Implement concurrency benchmark model in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/benchmark/concurrency-benchmark-run.ts
- [X] T033 [US3] Implement SQLite single-writer queue and WAL checkpoint monitor in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/write-queue.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/wal-monitor.ts
- [X] T034 [US3] Implement SQLite concurrency benchmark runner in /Volumes/xpro/erisristemena/made-by-ai/sona/spikes/sqlite-concurrency/src/run-sqlite-concurrency.ts
- [X] T035 [US3] Emit the SQLite concurrency artifact in /Volumes/xpro/erisristemena/made-by-ai/sona/spikes/sqlite-concurrency/src/write-concurrency-report.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/artifacts/sqlite-concurrency/report.json

**Checkpoint**: All three user stories should now be independently runnable and produce their planning artifacts.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the combined feasibility package and close cross-story planning gaps.

- [X] T036 [P] Consolidate cross-spike planning summary in /Volumes/xpro/erisristemena/made-by-ai/sona/artifacts/planning/feasibility-summary.md
- [X] T037 [P] Add end-to-end offline and no-key validation in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/offline-no-key-feasibility.test.ts
- [X] T038 [P] Add provenance and artifact integrity validation in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/provenance-artifact-integrity.test.ts
- [X] T039 Validate review-load cap implications across tokenizer and fallback outputs in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/review-load-implications.test.ts
- [X] T040 Run the quickstart workflow and update verification notes in /Volumes/xpro/erisristemena/made-by-ai/sona/specs/001-feasibility-spike-foundation/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. Start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion. Blocks all user stories.
- **User Stories (Phases 3-5)**: All depend on Foundational completion.
- **Polish (Phase 6)**: Depends on the three user story phases being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational. No dependency on other stories.
- **User Story 2 (P2)**: Starts after Foundational. Uses shared artifact and provenance infrastructure but remains independently testable.
- **User Story 3 (P3)**: Starts after Foundational. Uses shared SQLite bootstrap and artifact infrastructure but remains independently testable.

### Within Each User Story

- Required automated tests must be written first and fail before implementation.
- Models and adapters precede spike runners.
- Spike runners precede artifact emission.
- Artifact emission precedes cross-story validation.

### Parallel Opportunities

- T002-T005 can run in parallel after T001.
- T007-T009 can run in parallel once T006 is defined.
- Within US1, T013-T016 can run in parallel where file boundaries do not overlap.
- Within US2, T020-T023 can run in parallel where file boundaries do not overlap.
- Within US3, T029-T032 can run in parallel where file boundaries do not overlap.
- T036-T038 can run in parallel after all user stories are complete.

---

## Parallel Example: User Story 1

```bash
# Launch User Story 1 tests together:
Task: "Add tokenizer artifact contract test in tests/contract/spike-artifact.tokenizer.test.ts"
Task: "Add tokenizer spike benchmark test in tests/benchmark/tokenizer-spike.test.ts"

# Launch User Story 1 model and adapter work together:
Task: "Implement tokenization evaluation model in packages/domain/src/tokenizer/tokenization-evaluation-result.ts"
Task: "Implement local tokenizer and reference-track adapters in packages/domain/src/tokenizer/local-js-segmenter.ts and packages/domain/src/tokenizer/llm-fallback-reference.ts"
```

## Parallel Example: User Story 2

```bash
# Launch User Story 2 tests together:
Task: "Add provider fallback contract test in tests/contract/provider-fallback-contract.test.ts"
Task: "Add no-key fallback integration test in tests/integration/provider-fallback-no-key.test.ts"

# Launch User Story 2 model and adapter work together:
Task: "Implement provider fallback policy model in packages/domain/src/fallback/provider-fallback-policy.ts"
Task: "Implement provider adapter interfaces in packages/integrations/src/llm/provider-adapter.ts and packages/integrations/src/tts/provider-adapter.ts"
```

## Parallel Example: User Story 3

```bash
# Launch User Story 3 tests together:
Task: "Add SQLite concurrency artifact contract test in tests/contract/spike-artifact.sqlite-concurrency.test.ts"
Task: "Add SQLite concurrency benchmark test in tests/benchmark/sqlite-concurrency-spike.test.ts"

# Launch User Story 3 workload and model work together:
Task: "Implement benchmark workload definitions in packages/data/src/sqlite/workloads/annotation-refresh.ts and packages/data/src/sqlite/workloads/srs-harvest.ts"
Task: "Implement concurrency benchmark model in packages/domain/src/benchmark/concurrency-benchmark-run.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Stop and validate the tokenizer artifact independently before expanding scope.

### Incremental Delivery

1. Setup and foundational work create the reusable local-first spike framework.
2. User Story 1 delivers the tokenizer decision artifact.
3. User Story 2 adds the provider fallback specification without making provider use mandatory.
4. User Story 3 validates local concurrency on baseline hardware.
5. Phase 6 consolidates the combined planning evidence.

### Suggested MVP Scope

- Deliver through **Phase 3 / User Story 1** first.
- Treat **User Story 2** and **User Story 3** as follow-on increments once the tokenizer decision path is stable.

---

## Notes

- `[P]` tasks operate on different files and can run in parallel.
- `[US1]`, `[US2]`, and `[US3]` map tasks directly to the three user stories in spec.md.
- Every story is independently testable through its artifact schema validation plus one spike execution path.
- Cross-cutting validation remains local-first and no-key safe.