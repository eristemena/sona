# Implementation Plan: Desktop App Shell

**Branch**: `002-desktop-app-shell` | **Date**: 2026-04-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-desktop-app-shell/spec.md`

**Note**: This plan covers the first app-shell implementation slice for Sona: an Electron 33 desktop window, a Next.js 15 static-export renderer, a persistent sidebar layout, a typed preload bridge, local SQLite-backed settings, and packaged desktop output via electron-builder. This phase explicitly excludes LLM and TTS integration.

## Summary

Build the first runnable Sona desktop shell so the app opens into a persistent sidebar plus empty main content frame, applies theme state correctly on launch, and persists manual theme overrides locally. The implementation uses Electron 33 for the shell, Next.js 15 static export for the renderer, `contextBridge` for a typed `window.sona` API surface, `better-sqlite3` in the main process only with a migration runner that creates the v1 schema on first launch, Tailwind CSS plus shadcn/ui for shell composition, Pretendard via CSS import for typography, and electron-builder for packaging.

## Technical Context

**Language/Version**: TypeScript 5.8.x across Electron main/preload, shared packages, and Next.js 15.1 renderer  
**Primary Dependencies**: Electron 33, Next.js 15.1 static export, React 19, electron-builder, better-sqlite3, Tailwind CSS, shadcn/ui  
**Storage**: Local SQLite in the main process only, with `schema_migrations` and `settings` as the v1 shell schema  
**Testing**: Vitest for contract and integration coverage, TypeScript typecheck for desktop and renderer packages, manual packaging smoke verification  
**Target Platform**: Desktop-class application, macOS-first during this phase, packaged by electron-builder with a Windows/Linux-ready structure  
**Project Type**: Desktop app with static-export frontend and local persistence layer  
**Performance Goals**: Shell window appears without requiring network access, theme resolves before the learner starts interacting with the shell, first-launch migrations complete before settings are requested, and no startup path depends on LLM or TTS services  
**Constraints**: Offline-capable, no accounts or telemetry, `contextIsolation` plus `contextBridge` boundary, renderer must remain compatible with Next.js static export limitations, SQLite access restricted to the main process, no LLM or TTS calls in this feature phase  
**Scale/Scope**: Single-user shell foundation, one packaged desktop app, four top-level navigation destinations, one persisted theme preference flow, and a minimal v1 database schema focused on shell settings

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate

- **Local-first operation**: PASS. The shell, navigation, packaging, migrations, and theme persistence all run locally with no account or network requirement.
- **Learner-owned content**: PASS. This feature does not ingest learner study content; the only persisted data is the learner's local appearance preference and schema version state.
- **Bounded review load**: PASS. No review items, backlog rules, or scheduled study work are created in this phase.
- **Reading and listening integration**: PASS. The shell remains a neutral host for future reading, listening, and review features, and this phase explicitly excludes TTS.
- **Complexity justification**: PASS. Electron, Next.js static export, better-sqlite3, Tailwind CSS, shadcn/ui, and electron-builder are all directly justified by the desktop shell, local-first storage, and packaging requirements confirmed by the user.

### Post-Design Re-Check

- **Local-first operation**: PASS. The contracts restrict persistence and IPC to the local desktop runtime and keep the renderer independent of network services.
- **Learner-owned content**: PASS. The data model only introduces local settings and migration metadata, with no opaque off-device processing.
- **Bounded review load**: PASS. The design creates no learner workload and keeps the shell empty until later feature-specific content is ready.
- **Reading and listening integration**: PASS. The shell contract leaves the main panel ready for future study surfaces while clearly documenting that no TTS or audio path exists in this feature.
- **Complexity justification**: PASS. The chosen dependencies are bounded to shell rendering, secure desktop bridging, minimal schema management, and packaging rather than speculative infrastructure.

## Project Structure

### Documentation (this feature)

```text
specs/002-desktop-app-shell/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── shell-schema-contract.md
│   └── window-sona-api-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/
├── desktop/
│   ├── package.json
│   └── src/
│       ├── main/
│       └── preload/
└── renderer/
    ├── app/
    ├── components/
    ├── lib/
    ├── next.config.mjs
    └── package.json

packages/
├── data/
│   └── src/
│       └── sqlite/
│           ├── connection.ts
│           ├── migrations/
│           └── wal-monitor.ts
└── domain/
    └── src/
        └── contracts/

tests/
├── contract/
├── integration/
└── setup/
```

**Structure Decision**: Keep Electron runtime concerns in `apps/desktop`, build the static shell UI in `apps/renderer`, and place SQLite connection and migration logic under `packages/data` so the main process owns persistence while the renderer remains a static, unprivileged client behind `window.sona`.

## Complexity Tracking

No constitution violations require an exception for this plan.
