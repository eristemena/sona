# Tasks: Home, Library, and Settings Hub

**Input**: Design documents from `/specs/006-home-library-settings/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include automated test tasks whenever a story changes persistence, scheduling, content derivation, import/export, or TTS/audio orchestration. For purely presentational work, include explicit manual verification tasks instead.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the shared dependencies and baseline UI primitive needed by multiple stories.

- [ ] T001 Update renderer dependencies for `recharts`, `react-hook-form`, `zod`, `@hookform/resolvers`, and `@radix-ui/react-dialog` in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/package.json
- [ ] T002 Create a shared accessible dialog primitive in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/ui/dialog.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the typed shell and settings contract changes shared by multiple stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Update shared preload contracts for dashboard and study-preferences APIs in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/contracts/window-sona.ts
- [ ] T004 [P] Extend shell bootstrap typing for the home destination payload expectations in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/contracts/shell-bootstrap.ts
- [ ] T005 Wire the new shared shell and settings API surface through the preload bridge in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/preload/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Start From Today’s Priorities (Priority: P1) 🎯 MVP

**Goal**: Deliver a dashboard that surfaces due review work, recent vocabulary, weekly activity, streaks, and resume reading from the first screen.

**Independent Test**: Open the app with local review and reading data and confirm the learner can see today’s due count, recent activity, weekly chart, and launch either review or resume reading directly from the dashboard.

### Tests for User Story 1 ⚠️

- [ ] T006 [P] [US1] Add a schema contract for `study_sessions` and dashboard settings keys in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/contract/shell-schema-contract.test.ts
- [ ] T007 [P] [US1] Add preload contract coverage for `shell.getHomeDashboard()` in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/contract/window-sona-home-library-settings-contract.test.ts
- [ ] T008 [P] [US1] Add dashboard summary and empty-state integration coverage in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/home-dashboard-summary.test.tsx
- [ ] T009 [P] [US1] Add resume-reading and streak aggregation integration coverage in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/home-dashboard-resume-reading.test.tsx

### Implementation for User Story 1

- [ ] T010 [US1] Add the `study_sessions` migration in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/migrations/006_home_dashboard_v1.sql
- [ ] T011 [US1] Implement dashboard query and study-session writeback repository methods in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/content-library-repository.ts
- [ ] T012 [P] [US1] Add dashboard snapshot types in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/content/home-dashboard.ts
- [ ] T013 [US1] Implement home dashboard assembly and review-session completion reporting in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/content/daily-review-service.ts
- [ ] T014 [US1] Extend shell IPC handlers for dashboard summary loading in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/ipc/shell-handlers.ts
- [ ] T015 [US1] Register the dashboard-capable shell wiring in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/index.ts
- [ ] T016 [P] [US1] Create dashboard data and navigation hooks in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-home-dashboard.ts
- [ ] T017 [P] [US1] Create the weekly activity chart component in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/review/weekly-activity-chart.tsx
- [ ] T018 [US1] Implement the home dashboard screen with due count, recent vocabulary, streak, and resume CTA in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/review/home-dashboard-screen.tsx
- [ ] T019 [US1] Integrate the dashboard as the shell landing surface in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/app/page.tsx

**Checkpoint**: User Story 1 should now be fully functional and independently testable as the MVP dashboard flow.

---

## Phase 4: User Story 2 - Manage Study Content Library (Priority: P2)

**Goal**: Let the learner browse all content, search and filter it client-side after initial load, and import new subtitle or pasted article content through a dedicated dialog.

**Independent Test**: Populate the local library, open the library screen, and confirm the learner can search, filter, sort, and add new imported content without additional IPC calls after the initial catalog load.

### Tests for User Story 2 ⚠️

- [ ] T020 [P] [US2] Add integration coverage for client-side library search, filter, and sort behavior in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/content-library-client-side-querying.test.tsx
- [ ] T021 [P] [US2] Add integration coverage for library empty states and dialog accessibility in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/library-import-dialog-a11y.test.tsx
- [ ] T022 [P] [US2] Add integration coverage for subtitle and pasted-article import submissions in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/library-import-dialog-submit.test.tsx

### Implementation for User Story 2

- [ ] T023 [US2] Simplify the content-library contract to support one initial catalog load in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/contracts/content-library.ts
- [ ] T024 [US2] Update the content preload bridge for initial-load library usage in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/preload/index.ts
- [ ] T025 [US2] Rework library state to derive search, filter, and sort client-side after initial load in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-content-library.ts
- [ ] T026 [P] [US2] Add explicit sort controls and result-state handling in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/library/content-library-toolbar.tsx
- [ ] T027 [US2] Replace the current add-content overlay with the shared dialog primitive in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/library/add-content-dialog.tsx
- [ ] T028 [P] [US2] Update the library screen to use the client-side catalog model and new import dialog flow in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/library/content-library-screen.tsx

**Checkpoint**: User Story 2 should now be independently functional for local content browsing and import management.

---

## Phase 5: User Story 3 - Personalize Study Settings (Priority: P3)

**Goal**: Provide one settings workflow for OpenRouter key management, TTS voice selection and preview, and daily study goal persistence.

**Independent Test**: Open settings, save a provider key, a voice, and a daily goal, then relaunch the app to confirm the values persist locally; optionally test the key and preview the selected voice.

### Tests for User Story 3 ⚠️

- [ ] T029 [P] [US3] Add settings repository and contract coverage for OpenRouter key, daily goal, and voice persistence in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/contract/window-sona-home-library-settings-contract.test.ts
- [ ] T030 [P] [US3] Add integration coverage for the study-preferences form flow in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/settings-study-preferences-form.test.tsx
- [ ] T031 [P] [US3] Add integration coverage for OpenRouter key validation in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/settings-openrouter-validation.test.ts
- [ ] T032 [P] [US3] Add integration coverage for TTS voice preview behavior in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/settings-voice-preview.test.tsx

### Implementation for User Story 3

- [ ] T033 [US3] Extend settings persistence for OpenRouter API keys, daily goal, and voice preference in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/settings-repository.ts
- [ ] T034 [P] [US3] Add study-preferences types and validation helpers in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/settings/study-preferences.ts
- [ ] T035 [US3] Implement OpenRouter key validation and fixed-phrase voice preview handling in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/ipc/settings-handlers.ts
- [ ] T036 [P] [US3] Add provider-backed settings helpers for validation and preview in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/providers/openrouter-settings-service.ts
- [ ] T037 [US3] Register the updated settings runtime dependencies in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/index.ts
- [ ] T038 [P] [US3] Add a form-driven settings hook with `react-hook-form` and `zod` in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-study-preferences.ts
- [ ] T039 [US3] Replace the current settings surface with the study-preferences form and explicit validation/preview actions in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/settings/theme-settings.tsx

**Checkpoint**: User Story 3 should now be independently functional for local settings management with optional provider-backed actions.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cross-story cleanup.

- [ ] T040 [P] Update the feature quickstart validation notes if implementation paths changed in /Volumes/xpro/erisristemena/made-by-ai/sona/specs/006-home-library-settings/quickstart.md
- [ ] T041 Validate offline startup, dashboard empty states, and no-account behavior across home, library, and settings using /Volumes/xpro/erisristemena/made-by-ai/sona/specs/006-home-library-settings/quickstart.md
- [ ] T042 Run `npm test`, `npm run typecheck`, and `npm run build` from /Volumes/xpro/erisristemena/made-by-ai/sona

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational - no dependency on other stories
- **User Story 2 (P2)**: Starts after Foundational - independent of US1 but reuses the shared dialog primitive from Setup
- **User Story 3 (P3)**: Starts after Foundational - independent of US1 and US2, though it shares the updated preload surface from Phase 2

### Within Each User Story

- Required automated tests should be written before implementation and fail first when possible
- Persistence and contract changes before main-process handlers
- Main-process handlers before renderer integration
- Story-level UI wiring after supporting data and preload surfaces exist

### Parallel Opportunities

- T004 can run in parallel with T003 once Setup is complete
- US1 test tasks T006-T009 can run in parallel
- US1 renderer tasks T016-T017 can run in parallel after T014-T015
- US2 test tasks T020-T022 can run in parallel
- US2 UI tasks T026 and T028 can run in parallel after T025 and T027 begin stabilizing
- US3 test tasks T029-T032 can run in parallel
- US3 support tasks T034, T036, and T038 can run in parallel with the repository and handler work

---

## Parallel Example: User Story 1

```bash
# Launch dashboard-related tests together:
Task: "Add a schema contract for study_sessions and dashboard settings keys in tests/contract/shell-schema-contract.test.ts"
Task: "Add preload contract coverage for shell.getHomeDashboard() in tests/contract/window-sona-home-library-settings-contract.test.ts"
Task: "Add dashboard summary and empty-state integration coverage in tests/integration/home-dashboard-summary.test.tsx"
Task: "Add resume-reading and streak aggregation integration coverage in tests/integration/home-dashboard-resume-reading.test.tsx"

# Build renderer-side dashboard pieces together after main-process wiring exists:
Task: "Create dashboard data and navigation hooks in apps/renderer/lib/use-home-dashboard.ts"
Task: "Create the weekly activity chart component in apps/renderer/components/review/weekly-activity-chart.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate the dashboard independently before expanding scope

### Incremental Delivery

1. Finish Setup + Foundational to establish the shared shell/preload contract
2. Deliver User Story 1 as the MVP dashboard and resume flow
3. Add User Story 2 for full local library management improvements
4. Add User Story 3 for the unified settings workflow
5. Finish with cross-story validation and quickstart verification

### Parallel Team Strategy

1. One developer handles Setup + Foundational
2. After Phase 2:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Rejoin for Phase 6 validation and bug fixing

---

## Notes

- [P] tasks = different files, no blocking dependency on incomplete tasks
- [US1], [US2], [US3] labels map tasks to independently testable stories
- This feature includes automated tests because it changes persistence, import flow, and optional TTS/provider behavior
- Keep dashboard reporting separate from scheduler-rule changes owned by feature 005