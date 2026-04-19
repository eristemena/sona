# Tasks: Desktop App Shell

**Input**: Design documents from `/specs/002-desktop-app-shell/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include automated test tasks whenever a story changes persistence, scheduling, content derivation, import/export, or TTS/audio orchestration. For this feature, automated tests are required for the local SQLite schema, preload bridge contract, shell bootstrap behavior, and theme persistence. Manual verification tasks are also included for the learner-visible shell UI and packaged offline launch.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the desktop-shell dependencies, build scripts, and renderer scaffolding needed across all stories.

- [ ] T001 Update root workspace scripts for desktop shell build and package flows in /Volumes/xpro/erisristemena/made-by-ai/sona/package.json
- [ ] T002 [P] Add Electron shell packaging and runtime dependencies in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/package.json
- [ ] T003 [P] Add Next.js renderer UI dependencies for Tailwind CSS and shadcn/ui in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/package.json
- [ ] T004 [P] Configure renderer app skeleton, Tailwind entrypoints, and static-export defaults in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/next.config.mjs, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/app/layout.tsx, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/app/page.tsx, and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/app/globals.css
- [ ] T005 [P] Add desktop and renderer TypeScript path configuration for shared shell contracts in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/tsconfig.json, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/tsconfig.json, and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/tsconfig.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the migration runner, main-process settings access, and typed preload bridge that every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T006 Create the v1 shell migration SQL and migration runner in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/migrations/001_shell_v1.sql and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/migrations/run-migrations.ts
- [ ] T007 [P] Implement shell settings repository and theme resolution service in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/settings-repository.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/settings/theme-preference.ts
- [ ] T008 [P] Define shared desktop shell IPC and bridge types in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/contracts/window-sona.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/domain/src/contracts/shell-bootstrap.ts
- [ ] T009 Implement Electron main-process bootstrap, BrowserWindow creation, and IPC handlers in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/index.ts, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/create-main-window.ts, and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/ipc/shell-handlers.ts
- [ ] T010 Implement the typed preload bridge exposing `window.sona` in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/preload/index.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/app/window.d.ts
- [ ] T011 [P] Add contract coverage for the shell schema and `window.sona` bootstrap surface in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/contract/shell-schema-contract.test.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/tests/contract/window-sona-api-contract.test.ts

**Checkpoint**: Foundation ready. The desktop runtime can initialize the local schema, resolve theme state, and expose typed shell bootstrap data to the renderer.

---

## Phase 3: User Story 1 - Open Into a Stable Shell (Priority: P1) 🎯 MVP

**Goal**: Launch Sona into a runnable desktop window that shows the app name, a persistent sidebar, and an empty main content frame.

**Independent Test**: Start the desktop app from a clean local environment and verify that the window opens with the Sona name, the required sidebar items, and an empty main content area while offline, including relaunch after an interrupted prior session.

### Tests for User Story 1 ⚠️

- [ ] T012 [P] [US1] Add integration coverage for first-launch and interrupted-session shell bootstrap in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/desktop-shell-launch.test.ts
- [ ] T013 [P] [US1] Add integration coverage for offline shell startup in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/offline-shell-startup.test.ts

### Implementation for User Story 1

- [ ] T014 [P] [US1] Implement renderer shell bootstrap hook and bootstrap-state loader in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-shell-bootstrap.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/shell-bootstrap.ts
- [ ] T015 [P] [US1] Build the shell layout and empty content frame in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/shell/app-shell.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/shell/main-content-placeholder.tsx
- [ ] T016 [US1] Render the launch shell from the root page in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/app/page.tsx
- [ ] T017 [US1] Add first-launch and crash-relaunch shell manual verification notes to /Volumes/xpro/erisristemena/made-by-ai/sona/specs/002-desktop-app-shell/quickstart.md

**Checkpoint**: User Story 1 should now launch into a stable shell and be testable as the MVP slice.

---

## Phase 4: User Story 2 - Navigate From the Sidebar (Priority: P2)

**Goal**: Keep the sidebar persistent while learners move through the four top-level shell destinations with clear, accessible navigation states.

**Independent Test**: Open the shell, use keyboard and pointer input on each sidebar item, and verify the persistent navigation remains visible while the main panel updates its active destination state.

### Tests for User Story 2

- [ ] T018 [P] [US2] Add integration coverage for sidebar navigation and active destination rendering in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/sidebar-navigation.test.ts
- [ ] T019 [P] [US2] Add accessibility-focused navigation interaction coverage in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/sidebar-keyboard-navigation.test.ts

### Implementation for User Story 2

- [ ] T020 [P] [US2] Implement ordered navigation definitions and selection state helpers in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/navigation.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-active-destination.ts
- [ ] T021 [P] [US2] Build the persistent sidebar navigation UI with app name, four destinations, and active styling in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/shell/sidebar-nav.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/shell/sidebar-nav-item.tsx
- [ ] T022 [US2] Integrate destination switching into the shell layout in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/shell/app-shell.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/shell/main-content-placeholder.tsx
- [ ] T023 [US2] Add manual verification steps for pointer and keyboard navigation in /Volumes/xpro/erisristemena/made-by-ai/sona/specs/002-desktop-app-shell/quickstart.md

**Checkpoint**: User Stories 1 and 2 should now work independently, with a persistent accessible sidebar and empty main panel destinations.

---

## Phase 5: User Story 3 - Resume the Preferred Theme (Priority: P3)

**Goal**: Persist the learner's theme preference locally, resolve it correctly at launch, and keep the shell theme in sync with manual overrides and system mode.

**Independent Test**: Change the theme preference, relaunch the app, and verify the same theme is restored from local SQLite; also verify that missing or invalid settings resolve by following the system theme when available and otherwise falling back to dark mode.

### Tests for User Story 3 (required for constitution-sensitive changes) ⚠️

- [ ] T024 [P] [US3] Add integration coverage for theme preference persistence and relaunch restore in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/theme-preference-persistence.test.ts
- [ ] T025 [P] [US3] Add integration coverage for invalid-setting fallback, system-theme resolution, and dark-mode fallback in /Volumes/xpro/erisristemena/made-by-ai/sona/tests/integration/theme-resolution-fallback.test.ts

### Implementation for User Story 3

- [ ] T026 [P] [US3] Implement main-process theme settings handlers and system-theme subscriptions in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/ipc/settings-handlers.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/src/main/theme/native-theme-events.ts
- [ ] T027 [P] [US3] Implement renderer theme provider and `window.sona.settings` integration in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/theme-provider.tsx and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/lib/use-theme-preference.ts
- [ ] T028 [US3] Add the Settings destination theme controls and shell theme application in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/settings/theme-settings.tsx, /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/components/shell/app-shell.tsx, and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/renderer/app/globals.css
- [ ] T029 [US3] Persist and seed the `appearance.themePreference` setting through the migration-backed settings service in /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/settings-repository.ts and /Volumes/xpro/erisristemena/made-by-ai/sona/packages/data/src/sqlite/migrations/001_shell_v1.sql
- [ ] T030 [US3] Add theme persistence, system-theme resolution, and dark-fallback verification notes to /Volumes/xpro/erisristemena/made-by-ai/sona/specs/002-desktop-app-shell/quickstart.md

**Checkpoint**: All three user stories should now be independently functional, including persisted theme behavior across launches.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize packaging, developer workflow, and end-to-end validation across the shell feature.

- [ ] T031 [P] Add desktop package scripts and electron-builder configuration in /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/package.json and /Volumes/xpro/erisristemena/made-by-ai/sona/apps/desktop/electron-builder.yml
- [ ] T032 [P] Add renderer and desktop developer workflow commands to /Volumes/xpro/erisristemena/made-by-ai/sona/package.json and /Volumes/xpro/erisristemena/made-by-ai/sona/specs/002-desktop-app-shell/quickstart.md
- [ ] T033 Validate packaged offline launch and record the result in /Volumes/xpro/erisristemena/made-by-ai/sona/specs/002-desktop-app-shell/quickstart.md
- [ ] T034 Run the complete quickstart validation path and update the latest verification notes in /Volumes/xpro/erisristemena/made-by-ai/sona/specs/002-desktop-app-shell/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. Start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion. Blocks all user stories.
- **User Stories (Phases 3-5)**: All depend on Foundational completion.
- **Polish (Phase 6)**: Depends on the desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational. No dependency on other user stories.
- **User Story 2 (P2)**: Starts after Foundational and builds on the shell layout from US1, but remains independently testable once the shell exists.
- **User Story 3 (P3)**: Starts after Foundational and integrates with the shell and settings contracts established earlier, while remaining independently testable through theme persistence behavior.

### Within Each User Story

- Automated tests for persistence and bootstrap behavior must be written first and fail before implementation.
- Shared data and contract definitions precede main-process IPC and preload work.
- Main-process services precede renderer integration.
- Renderer integration precedes quickstart/manual verification updates.

### Parallel Opportunities

- T002-T005 can run in parallel after T001.
- T007, T008, and T011 can run in parallel after T006 starts, as long as file ownership does not overlap.
- Within US1, T012-T015 can run in parallel where file boundaries do not overlap.
- Within US2, T018-T021 can run in parallel where file boundaries do not overlap.
- Within US3, T024-T027 can run in parallel where file boundaries do not overlap.
- T031 and T032 can run in parallel during the polish phase.

---

## Parallel Example: User Story 1

```bash
# Launch User Story 1 integration tests together:
Task: "Add integration coverage for first-launch shell bootstrap in tests/integration/desktop-shell-launch.test.ts"
Task: "Add integration coverage for offline shell startup in tests/integration/offline-shell-startup.test.ts"

# Launch User Story 1 renderer shell work together:
Task: "Implement renderer shell bootstrap hook and bootstrap-state loader in apps/renderer/lib/use-shell-bootstrap.ts and apps/renderer/lib/shell-bootstrap.ts"
Task: "Build the shell layout and empty content frame in apps/renderer/components/shell/app-shell.tsx and apps/renderer/components/shell/main-content-placeholder.tsx"
```

## Parallel Example: User Story 2

```bash
# Launch User Story 2 navigation tests together:
Task: "Add integration coverage for sidebar navigation and active destination rendering in tests/integration/sidebar-navigation.test.ts"
Task: "Add accessibility-focused navigation interaction coverage in tests/integration/sidebar-keyboard-navigation.test.ts"

# Launch User Story 2 navigation implementation together:
Task: "Implement ordered navigation definitions and selection state helpers in apps/renderer/lib/navigation.ts and apps/renderer/lib/use-active-destination.ts"
Task: "Build the persistent sidebar navigation UI with app name, four destinations, and active styling in apps/renderer/components/shell/sidebar-nav.tsx and apps/renderer/components/shell/sidebar-nav-item.tsx"
```

## Parallel Example: User Story 3

```bash
# Launch User Story 3 persistence tests together:
Task: "Add integration coverage for theme preference persistence and relaunch restore in tests/integration/theme-preference-persistence.test.ts"
Task: "Add integration coverage for invalid-setting fallback and system-mode resolution in tests/integration/theme-resolution-fallback.test.ts"

# Launch User Story 3 theme services together:
Task: "Implement main-process theme settings handlers and system-theme subscriptions in apps/desktop/src/main/ipc/settings-handlers.ts and apps/desktop/src/main/theme/native-theme-events.ts"
Task: "Implement renderer theme provider and window.sona.settings integration in apps/renderer/lib/theme-provider.tsx and apps/renderer/lib/use-theme-preference.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Stop and validate the shell launch behavior independently before expanding scope.

### Incremental Delivery

1. Setup and foundational work establish packaging, schema, and typed desktop boundaries.
2. User Story 1 delivers the first runnable shell window.
3. User Story 2 adds persistent sidebar navigation behavior.
4. User Story 3 adds local theme persistence and launch-time resolution.
5. Phase 6 finishes packaging and end-to-end validation.

### Suggested MVP Scope

- Deliver through **Phase 3 / User Story 1** first.
- Treat **User Story 2** and **User Story 3** as follow-on increments once shell launch is stable.

### Parallel Team Strategy

1. One developer completes Setup and Foundational.
2. After Foundational:
   - Developer A: User Story 1 shell rendering.
   - Developer B: User Story 2 sidebar navigation.
   - Developer C: User Story 3 theme persistence.
3. Finish with packaging and quickstart validation together.

---

## Notes

- `[P]` tasks operate on different files and can run in parallel.
- `[US1]`, `[US2]`, and `[US3]` map tasks directly to the three user stories in spec.md.
- User Story 1 is the recommended MVP slice.
- Persistence and preload bridge changes require tests before implementation.
- The feature remains fully offline and excludes any LLM or TTS integration in this phase.