# Implementation Plan: Sync Reading Audio

**Branch**: `[004-sync-reading-audio]` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-sync-reading-audio/spec.md`

**Note**: This plan covers the first learner-facing reading session for saved content: block-level TTS generation on first open, cached audio replay, word-synced karaoke highlighting, tapped word lookup with sentence-context meaning, full-sentence translation, and optional richer grammar help, direct `Add to deck` card creation via FSRS defaults, and passive exposure logging flushed in batches after the session ends.

## Summary

Build a local-first reading surface on top of the content library by treating each `ContentBlock` as the unit of playback, lookup, and review capture. When a learner opens content, the renderer loads reading blocks through the typed desktop bridge, requests block audio from the main process for the currently active block on first open, and reuses cached audio files plus persisted word timestamps on subsequent opens. The renderer owns playback UI and karaoke highlight state using the audio element’s `currentTime`, while the main process owns direct OpenAI TTS calls for reading audio, OpenRouter-routed annotation refresh, FSRS card creation, provenance persistence, progress persistence, and batch exposure-log writes. Lookup responses are sentence-contextual: they describe what the tapped form means inside the full Korean sentence, identify the grammar pattern and register, and include a natural English translation of the entire sentence so Korean constructions remain understandable in context. Core reading remains usable offline or without API keys: text-first reading, cached replay, and learner-triggered deck capture still work even if hosted TTS, timestamp parsing, or lookup enrichment is unavailable.

## Technical Context

**Language/Version**: TypeScript 5.8.x across Electron main/preload, domain/data packages, and Next.js 15.1 renderer  
**Primary Dependencies**: Electron 33, Next.js 15.1, React 19, better-sqlite3, direct OpenAI speech API access for reading audio, OpenRouter chat completions for lookup and grammar help, Motion for React popup animation, `ts-fsrs` for review-card initialization  
**Storage**: Local SQLite for reading progress, annotation cache, exposure log, and review-card metadata plus app-data file cache for synthesized block audio  
**Testing**: Vitest contract and integration tests, workspace typecheck, build verification, and manual offline/provider fallback validation  
**Target Platform**: Desktop app, macOS-first packaging and validation through Electron with a static-export renderer
**Project Type**: Desktop app with local persistence, typed preload boundary, and optional hosted enrichment services  
**Performance Goals**: Reading view becomes usable immediately on open, cached active-block replay starts without provider wait, uncached audio generation degrades after the existing 10-second TTS budget, lookup remains instant on cache hits, and highlight drift stays within the spoken token or an adjacent token during active-block validation  
**Constraints**: No accounts, no telemetry, optional network only for TTS and lookup enrichment, provider credentials confined to main process, no per-word real-time SQLite writes during playback, manual add-to-deck only, later review provenance must remain queryable, and clear fallback when timing payloads, token maps, or provider responses are unavailable  
**Scale/Scope**: Single-user local library, one active reading session, per-block cached audio generation, contextual lookup keyed by canonical form plus sentence hash, and single-card FSRS creation from explicit learner actions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate

- **Local-first operation**: PASS. Opening saved content, reading flowing Korean text, replaying any already cached audio, and adding words to review remain local. Network use is optional and limited to first-open OpenAI TTS generation and OpenRouter-backed annotation or grammar refresh. If those fail, the reading view still opens and remains usable in text-first mode.
- **Learner-owned content**: PASS. The flow begins from learner-approved library content already stored locally. Derived artifacts, including audio cache metadata, annotation cache entries, and review cards, remain tied back to the source block and sentence context so the learner can inspect where each study aid came from.
- **Bounded review load**: PASS. New scheduled work is created only when the learner explicitly taps `Add to deck`, one card at a time. Duplicate blocking and existing pacing rules apply before activating a card, and no bulk seeding or automatic harvesting occurs.
- **Reading and listening integration**: PASS. Text, block-level audio, and review capture are unified in a single reading session. Synced highlighting follows the active block audio asset when available, and the same reading surface still supports lookup and deck capture when audio or timing metadata is missing.
- **Complexity justification**: PASS. Motion is a focused UI dependency for anchored popup enter and exit transitions. `ts-fsrs` is the repository’s chosen scheduling baseline. Direct OpenAI TTS for reading audio keeps the speech path explicit, while OpenRouter remains isolated to lookup and grammar calls. App-data file caching is simpler than storing large binaries in SQLite.

### Post-Design Re-Check

- **Local-first operation**: PASS. The designed schema keeps reading progress, annotation cache, exposure logs, and review cards local. Hosted calls are confined to explicit `ensureBlockAudio()`, `lookupWord()`, and `explainGrammar()` actions behind the preload bridge, with safe offline fallback states.
- **Learner-owned content**: PASS. `review_cards` store source block and content item provenance in a later-queryable form, `annotations` keep full structured responses inspectable, and `block_audio_assets` are keyed to learner-owned block text rather than opaque document-level jobs.
- **Bounded review load**: PASS. `AddToDeckResult` distinguishes created, duplicate-blocked, and deferred outcomes. Passive exposure logging is observational only and does not create review work by itself.
- **Reading and listening integration**: PASS. `ReadingSessionSnapshot` hydrates text, progress, and block state together; `BlockAudioAsset` persists timing data for karaoke sync; and text-first reading remains the fallback when audio generation, timestamp parsing, or token alignment is unavailable.
- **Complexity justification**: PASS. The design extends existing content, provider, and preload boundaries instead of creating a parallel subsystem. New persistence is limited to feature-specific tables and one app-data cache directory.

## Project Structure

### Documentation (this feature)

```text
specs/004-sync-reading-audio/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── reading-sync-schema-contract.md
│   └── window-sona-reading-contract.md
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
│       │   └── providers/
│       └── preload/
└── renderer/
    ├── app/
    ├── components/
    │   ├── library/
    │   ├── reading/
    │   └── ui/
    └── lib/

packages/
├── data/
│   └── src/
│       └── sqlite/
│           ├── migrations/
│           ├── workloads/
│           └── content-library-repository.ts
├── domain/
│   └── src/
│       ├── content/
│       ├── contracts/
│       └── fallback/
└── integrations/
    └── src/
        ├── llm/
        └── tts/

tests/
├── contract/
└── integration/
```

**Structure Decision**: Keep provider-backed reading actions in the Electron main process, extend preload with a new typed `reading` surface, persist feature state in SQLite under `packages/data/src/sqlite`, and build the learner-facing reading UI in `apps/renderer/components/reading`. This matches the existing local-first shell architecture and keeps the renderer free of direct provider or filesystem access.

## Complexity Tracking

No constitution violations require an exception for this plan.
