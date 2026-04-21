# Implementation Plan: Daily Vocabulary Review

**Branch**: `[005-daily-vocabulary-review]` | **Date**: 2026-04-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-daily-vocabulary-review/spec.md`

## Summary

Build Sona’s first dedicated Review surface on top of the existing reading-capture card pipeline by extending the current `review_cards` store into a full FSRS-driven daily review system. Reading-origin cards retain source provenance and answer-side meaning or grammar snapshots, the Review destination loads up to 50 active due cards ordered by `due_at ASC`, and each rating writes the `ts-fsrs` `next()` result back into the same card row plus immutable review history. First-launch known-word onboarding seeds the `known_words` table from bundled open-licensed Korean frequency JSON, records an `onboardingComplete` setting locally, and suppresses unnecessary reading prompts for vocabulary the learner already considers covered.

## Technical Context

**Language/Version**: TypeScript 5.8.x across Electron main/preload, domain/data packages, and Next.js 15.1 renderer  
**Primary Dependencies**: `ts-fsrs` for FSRS-5 scheduling, Electron 33, Next.js 15.1, React 19, better-sqlite3, `motion/react` for card flip animation, existing variant-based `Button` component in the renderer  
**Storage**: Local SQLite for review cards, review history, known words, and onboarding state plus bundled static JSON seed packs for known-word onboarding  
**Testing**: Vitest contract and integration tests, workspace typecheck, build verification, and manual onboarding or offline review validation  
**Target Platform**: Desktop app, macOS-first Electron packaging and validation with static-export renderer
**Project Type**: Desktop app with local persistence, typed preload boundaries, and offline-first review flow  
**Performance Goals**: First due card can be opened and rated within 30 seconds of entering Review, due-queue retrieval stays effectively instant on local data, and a 20-card session completes within 6 minutes without optional detours  
**Constraints**: No accounts, no telemetry, no mandatory network access, known-word onboarding must work offline, due queue capped at 50 cards per session, existing reading-to-deck provenance must remain queryable, and official NIIED TOPIK list data must not be redistributed  
**Scale/Scope**: Single-user local library, one learner-owned review deck, bounded daily sessions, seeded known-word onboarding, and review-card updates written synchronously to local SQLite

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate

- **Local-first operation**: PASS. Onboarding seed data, due-card queueing, rating submission, and known-word suppression all run from local SQLite plus bundled JSON assets. No account, cloud persistence, or network access is required for the core review loop.
- **Learner-owned content**: PASS. Review cards originate from learner-selected reading vocabulary and remain editable, inspectable, and traceable back to source content and sentence context. Seeded known words are explicit learner-controlled suppressions, not hidden automation.
- **Bounded review load**: PASS. New review work still begins only from explicit add-to-deck actions. The due queue loads a maximum of 50 cards per session and does not silently activate deferred or known words. Existing new-card activation limits remain in force.
- **Reading and listening integration**: PASS. The review system extends the reading capture flow instead of replacing it. Cards retain sentence context from reading, and the review loop remains usable without audio or TTS.
- **Complexity justification**: PASS. `ts-fsrs` already underpins card seeding and continues as the scheduler baseline. `motion/react` and the shared button component are already present in the renderer, so the review UI reuses existing stack choices rather than adding new UI infrastructure.

### Post-Design Re-Check

- **Local-first operation**: PASS. The design stores onboarding completion in `settings`, known-word suppressions in `known_words`, queue state in `review_cards`, and rating history in `review_events`, all locally. Seed packs are bundled static assets.
- **Learner-owned content**: PASS. `review_cards` retain source block and content provenance, answer-side detail snapshots stay editable, and known-word rows record their origin via `source` and `sourceDetail`.
- **Bounded review load**: PASS. Session retrieval is explicitly capped at 50 due cards, deferred and known cards are excluded from active sessions, and onboarding seeds suppress prompts without generating review backlog.
- **Reading and listening integration**: PASS. Reading capture remains the source of learner-added cards, and reading-side suppression now consults the same known-word and review-card state used by Review. Audio remains additive rather than required.
- **Complexity justification**: PASS. The design extends existing repository, preload, and renderer boundaries without introducing remote services, background daemons, or a second persistence system.

## Project Structure

### Documentation (this feature)

```text
specs/005-daily-vocabulary-review/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── review-schema-contract.md
│   └── window-sona-review-contract.md
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
│       │   └── settings/
│       └── preload/
└── renderer/
    ├── app/
    ├── components/
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
├── domain/
│   └── src/
│       ├── content/
│       ├── contracts/
│       └── settings/
└── integrations/

tests/
├── contract/
└── integration/
```

**Structure Decision**: Extend the existing reading-card architecture instead of creating a parallel review subsystem. Scheduler and known-word logic stay in Electron main plus shared domain/data packages; the renderer gains a dedicated `components/review` slice and a first-launch onboarding screen; the preload bridge exposes typed review APIs while reading-side suppression reuses the same persisted state.

## Complexity Tracking

No constitution violations require an exception for this plan.
