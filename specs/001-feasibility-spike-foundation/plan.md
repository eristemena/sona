# Implementation Plan: Feasibility Spike Foundation

**Branch**: `001-feasibility-spike-foundation` | **Date**: 2026-04-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-feasibility-spike-foundation/spec.md`

**Note**: This plan covers the feasibility phase that confirms the tokenizer track, defines the provider-assisted fallback path, and validates local SQLite concurrency before application implementation begins.

## Summary

Establish a production-feasible foundation for Sona by proving three things before building learner-facing features: Korean tokenization is accurate enough to trust for local-first study flows, optional provider assistance can be bounded and fully degradable when no API keys are present, and concurrent annotation refresh plus SRS harvesting remain responsive on 2019-era consumer hardware. The implementation approach uses an Electron 33 desktop shell, a Next.js 15 static-export renderer, better-sqlite3 for local storage, ts-fsrs for spaced repetition rules, and provider adapters that are completely optional and isolated behind local-first fallback policies.

## Technical Context

**Language/Version**: TypeScript 5.x across Electron 33 main/preload processes and Next.js 15.1 static-export renderer  
**Primary Dependencies**: Electron 33, Next.js 15 static export, React renderer stack, better-sqlite3, ts-fsrs, optional OpenAI and Anthropic SDKs for LLM features, optional OpenAI TTS and Google Cloud TTS adapters  
**Storage**: Local SQLite via better-sqlite3 in WAL mode, plus local fixture/report files for corpus inputs and spike outputs  
**Testing**: Vitest for unit and integration coverage, benchmark harnesses for tokenizer and SQLite spikes, contract validation for artifact schemas  
**Target Platform**: Desktop-class application, macOS-first development on 2019-era baseline hardware, Electron-portable to Windows and Linux later  
**Project Type**: Desktop app with static-export frontend and local service layer  
**Performance Goals**: Inline provider-assisted study help degrades after 3 seconds, optional audio degrades after 10 seconds, concurrent annotation refresh plus SRS harvest completes within 30 seconds total, learner-visible blocking stays under 1 second per interaction  
**Constraints**: Offline-capable and usable with no API keys, local-first data ownership, no mandatory server runtime, Next.js static export unsupported features must be avoided, provider use must be optional and session-capped, hardware baseline is a 2019-era consumer machine  
**Scale/Scope**: Single-user desktop app foundation, three feasibility spikes, stratified Korean corpus across multiple content types, one local database and provider abstraction layer

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate

- **Local-first operation**: PASS. The plan keeps all primary reading and FSRS workflows local. Provider calls are optional, disabled until credentials exist, and never required to complete study.
- **Learner-owned content**: PASS. Corpus fixtures and future study candidates are modeled as learner-approved local inputs with provenance carried into every spike artifact and later planning output.
- **Bounded review load**: PASS. This phase creates no learner review backlog; it defines the caps and fallback rules that later content-derivation work must honor.
- **Reading and listening integration**: PASS. Audio remains additive to text study, and every provider-assisted or audio-dependent path has a text-first fallback.
- **Complexity justification**: PASS. Electron plus static-export Next.js is justified by the desktop-first product requirement, while better-sqlite3 and ts-fsrs directly support local persistence and review scheduling without introducing a hosted backend.

### Post-Design Re-Check

- **Local-first operation**: PASS. Contracts and quickstart keep provider integration behind explicit adapter boundaries and local artifact generation.
- **Learner-owned content**: PASS. Data model and contracts preserve source, stratum, and derivation metadata for every evaluated segment.
- **Bounded review load**: PASS. Provider fallback and tokenization outputs now explicitly feed usage-cap and review-cap planning.
- **Reading and listening integration**: PASS. The design records a single policy path for text, audio, and SRS derivation with explicit audio-unavailable states.
- **Complexity justification**: PASS. The only planned complexity is the provider abstraction and benchmark harness, both needed to validate the feasibility phase without committing the product to a mandatory online architecture.

## Project Structure

### Documentation (this feature)

```text
specs/001-feasibility-spike-foundation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── provider-fallback-contract.md
│   └── spike-artifact-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/
├── desktop/
│   ├── main/
│   └── preload/
└── renderer/
    ├── app/
    ├── public/
    └── next.config.ts

packages/
├── domain/
│   ├── tokenizer/
│   ├── fsrs/
│   └── provenance/
├── data/
│   ├── sqlite/
│   └── repositories/
└── integrations/
    ├── llm/
    └── tts/

spikes/
├── tokenizer/
├── llm-fallback/
└── sqlite-concurrency/

fixtures/
└── corpus/

tests/
├── contract/
├── integration/
└── benchmark/
```

**Structure Decision**: Use a lightweight workspace split between Electron shell code in `apps/desktop`, a static-export Next.js renderer in `apps/renderer`, shared local-first logic in `packages/`, and explicit `spikes/` plus `fixtures/` directories for the feasibility work. This keeps the desktop/runtime boundary clear while avoiding premature service decomposition.

## Complexity Tracking

No constitution violations require an exception for this plan.

