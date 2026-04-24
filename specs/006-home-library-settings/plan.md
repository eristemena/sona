# Implementation Plan: Home, Library, and Settings Hub

**Branch**: `[006-home-library-settings]` | **Date**: 2026-04-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-home-library-settings/spec.md`

## Summary

Add Sona’s first real dashboard and modernize the surrounding home-shell workflows by extending the current Electron + Next renderer architecture rather than introducing a second app surface. The implementation adds one local reporting table (`study_sessions`) for weekly activity and streaks, derives dashboard summary data from existing `review_cards` and `reading_progress`, shifts library search/filter/sort fully client-side after an initial catalog load, and consolidates learner preferences into a form-driven settings screen with local OpenRouter credential storage, TTS voice selection and preview, and a daily study goal. The renderer gains a dashboard screen, a shared accessible dialog primitive, a chart surface, and schema-backed settings UX, while the preload bridge and main-process handlers expose typed home-summary and settings actions without weakening the app’s offline-first behavior.

## Technical Context

**Language/Version**: TypeScript 5.8.x across Electron main/preload, shared domain/data packages, and Next.js 15.1 renderer  
**Primary Dependencies**: Electron 33, Next.js 15.1, React 19, better-sqlite3, existing `motion` renderer stack, plus planned additions `recharts`, `react-hook-form`, `zod`, `@hookform/resolvers`, and `@radix-ui/react-dialog` for the shared dialog primitive  
**Storage**: Local SQLite via existing repositories, with new `study_sessions` rows and additional settings keys for provider key, daily goal, and voice preference  
**Testing**: Vitest contract and integration tests, workspace typecheck, build verification, and manual dashboard/library/settings validation via Electron desktop flow  
**Target Platform**: Desktop app, macOS-first Electron packaging and validation with local SQLite persistence
**Project Type**: Desktop app with typed preload boundaries, local persistence, and an offline-first renderer shell  
**Performance Goals**: Dashboard summary loads within the first screen render without noticeable delay on local data, weekly chart renders from exactly seven points, and library search/filter/sort updates feel immediate after the initial catalog load with no extra IPC round trips  
**Constraints**: No accounts, no telemetry, no mandatory network dependency, dashboard and library must remain fully useful offline, provider-key validation and voice preview must be explicit optional actions, and this feature must not create new review workload beyond reporting and daily-goal display  
**Scale/Scope**: Single-user local library, one local review deck, one dashboard entry point, one shared settings surface, and client-side catalog querying over a desktop-sized personal content collection

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate

- **Local-first operation**: PASS. Dashboard summary, resume reading, library browsing, and settings persistence all run from local SQLite and renderer state. Optional network use is limited to explicit OpenRouter key validation and TTS voice preview, and the feature remains usable when those requests fail or are never invoked.
- **Learner-owned content**: PASS. The library continues to expose learner-imported and learner-approved generated content from the existing content repository. The dashboard’s recent vocabulary and resume data remain linked back to review cards and source library items rather than opaque derived summaries.
- **Bounded review load**: PASS. The feature adds reporting only. It reads due review counts and recent vocabulary but does not create new review cards or change activation rules. The daily study goal changes dashboard pacing display rather than generating scheduled work.
- **Reading and listening integration**: PASS. The home screen links directly into review and resume reading. Voice selection and preview stay connected to listening flows, with explicit fallback messaging when provider-backed audio is unavailable.
- **Complexity justification**: PASS with explicit dependency additions. `recharts` is introduced for one compact weekly bar chart, `react-hook-form` + `zod` improve settings validation and persistence safety, and `@radix-ui/react-dialog` establishes a reusable accessible dialog primitive that the repo currently lacks.

### Post-Design Re-Check

- **Local-first operation**: PASS. The design persists dashboard source data in existing review and reading tables plus a new local `study_sessions` table. Client-side library querying eliminates repeated IPC calls after initial load, and settings save locally before any optional provider check.
- **Learner-owned content**: PASS. Library items remain the learner-visible source of truth, recent vocabulary points back to source content, and resume context is derived from saved local reading progress rather than generated abstractions.
- **Bounded review load**: PASS. `study_sessions` is append-only reporting data. Daily goals affect presentation only. No new scheduler rules or automatic card activation paths are introduced.
- **Reading and listening integration**: PASS. The dashboard bridges back into reading and review, and voice settings stay coupled to listening-related flows with graceful degradation when preview or hosted audio is unavailable.
- **Complexity justification**: PASS. Dependency growth is limited to one charting library, one form-validation pair, and one accessible dialog primitive. No background daemon, remote persistence tier, or additional service boundary is introduced.

## Project Structure

### Documentation (this feature)

```text
specs/006-home-library-settings/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── home-library-settings-schema-contract.md
│   └── window-sona-home-library-settings-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/
├── desktop/
│   └── src/
│       ├── main/
│       │   ├── content/
│       │   ├── ipc/
│       │   ├── providers/
│       │   └── theme/
│       └── preload/
└── renderer/
    ├── app/
    ├── components/
    │   ├── library/
    │   ├── reading/
    │   ├── review/
    │   ├── settings/
    │   └── ui/
    └── lib/

packages/
├── data/
│   └── src/
│       └── sqlite/
│           ├── migrations/
│           ├── content-library-repository.ts
│           └── settings-repository.ts
└── domain/
    └── src/
        ├── contracts/
        ├── content/
        └── settings/

tests/
├── contract/
├── integration/
└── benchmark/
```

**Structure Decision**: Extend the existing desktop-shell architecture in place. Dashboard querying and provider validation live in Electron main plus the shared data/settings repositories; the preload bridge gains typed home and settings actions; the renderer adds a new dashboard surface, a shared dialog primitive under `components/ui`, a client-derived library query model, and a form-driven settings screen. This keeps all learner data in the current SQLite-backed shell instead of introducing a separate backend or cached API layer.

## Complexity Tracking

No constitution violations require an exception for this plan.
