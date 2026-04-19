# Implementation Plan: Add Content Library

**Branch**: `003-add-content-library` | **Date**: 2026-04-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-add-content-library/spec.md`

**Note**: This plan covers the first content-ingestion slice for Sona: local subtitle import, pasted-article entry, optional article scraping, optional AI sentence generation with drift validation, and a Content Library UI that lists and deletes locally saved content through the typed `window.sona` preload API.

## Summary

Build a local-first content pipeline that turns learner-approved material into stored library entries backed by SQLite. Subtitle files are parsed with `srt-parser-2`, pasted or scraped article text is split into sentence-level blocks with a Korean-aware regex, and generated practice sentences are created through an optional OpenRouter flow that uses `anthropic/claude-3-5-haiku` for generation and `openai/gpt-4o-mini` to validate or relabel difficulty drift. The Electron main process owns persistence, file import, scraping, and provider calls, while the renderer exposes a Content Library card grid with pill filters, search, Korean difficulty badges, and delete actions through an extended typed `window.sona` contract.

## Technical Context

**Language/Version**: TypeScript 5.8.x across Electron main/preload, domain/data packages, and Next.js 15.1 renderer  
**Primary Dependencies**: Electron 33, Next.js 15.1 static export, React 19, better-sqlite3, `srt-parser-2`, optional OpenRouter chat completions over `fetch`, Lucide React, Tailwind CSS 4, existing shadcn/ui-style primitives  
**Storage**: Local SQLite in the main process with new content-library tables for item metadata and sentence-level `ContentBlock` records  
**Testing**: Vitest contract and integration coverage, workspace typecheck, offline regression checks, manual validation for import, scrape fallback, and generated-content flows  
**Target Platform**: Desktop app, macOS-first for current packaging and validation, with Electron main/preload plus static-export renderer  
**Project Type**: Desktop app with local persistence, typed preload boundary, and optional network-backed enrichment flows  
**Performance Goals**: Subtitle import and pasted-article save complete without network dependence; library browsing and local search feel immediate for a single-user library; optional generation and scrape failures surface quickly without blocking the rest of the app  
**Constraints**: Offline-capable core flows, no accounts or telemetry, all renderer access through `window.sona`, no direct renderer SQLite or filesystem access, no automatic review creation, graceful fallback when scraping or provider calls fail, preserve learner-visible provenance  
**Scale/Scope**: Single-user library management for three source types, sentence-level `ContentBlock` persistence, one library surface with filter and search, and deletion of locally stored content items plus their blocks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate

- **Local-first operation**: PASS. Subtitle import, article paste, library browsing, search, and deletion remain fully local. Optional network use is limited to learner-initiated article scraping and AI sentence generation, and failure in those paths does not block the core library.
- **Learner-owned content**: PASS. Source material starts from learner-provided subtitle files, pasted article text, learner-approved article URLs, or learner-requested generation prompts saved locally. Provenance remains visible through source type, source locator, and generation-request metadata.
- **Bounded review load**: PASS. This feature stores library content only and explicitly creates no review cards, drills, or backlog by default.
- **Reading and listening integration**: PASS. Subtitle blocks preserve timing offsets for future listening alignment, article and generated text remain available without audio, and no TTS dependency is introduced in this slice.
- **Complexity justification**: PASS. `srt-parser-2` is directly justified by SRT import. OpenRouter is optional and accessed through simple HTTP calls instead of adding a larger SDK. The renderer continues to use the existing preload contract boundary rather than broadening privileges.

### Post-Design Re-Check

- **Local-first operation**: PASS. The designed schema and preload contract keep saved content fully local and restrict optional network use to explicit scrape and generation commands routed through main-process services.
- **Learner-owned content**: PASS. The data model stores source type, structural IDs, source locator, and generation request metadata so learners can inspect where each item came from and trace sentence blocks back to the source item.
- **Bounded review load**: PASS. The design introduces no scheduling tables or automatic study-candidate creation. Deletion removes local library state without creating hidden recovery work.
- **Reading and listening integration**: PASS. `audio_offset` is preserved for subtitle-derived sentence blocks, while article and generated blocks keep a text-first path for future reading or TTS features without requiring audio at ingestion time.
- **Complexity justification**: PASS. New logic is confined to import/generation services, SQLite schema additions, and preload contract expansion. No background daemons, sync services, or generic IPC escape hatches are introduced.

## Project Structure

### Documentation (this feature)

```text
specs/003-add-content-library/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── content-library-schema-contract.md
│   └── window-sona-content-library-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/
├── desktop/
│   └── src/
│       ├── main/
│       │   ├── ipc/
│       │   ├── content/
│       │   └── providers/
│       └── preload/
└── renderer/
    ├── app/
    ├── components/
    │   ├── library/
    │   ├── shell/
    │   └── ui/
    └── lib/

packages/
├── data/
│   └── src/
│       └── sqlite/
│           ├── migrations/
│           ├── content-library-repository.ts
│           └── connection.ts
└── domain/
    └── src/
        ├── content/
        ├── contracts/
        └── provenance/

tests/
├── contract/
├── integration/
└── setup/
```

**Structure Decision**: Keep content ingestion and provider access in the Electron main process, persist library data under `packages/data/src/sqlite`, define shared content and preload types in `packages/domain/src`, and add the library UI in the renderer under `apps/renderer/components/library`. This preserves the existing shell architecture while introducing a single new feature surface end to end.

## Complexity Tracking

No constitution violations require an exception for this plan.
