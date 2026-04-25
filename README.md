# Sona

Sona is a local-first Korean study desktop app. The repository is a TypeScript monorepo containing an Electron app with a Next.js static-export renderer, local SQLite persistence, OpenAI TTS integration, and OpenRouter LLM integration for annotations and content generation.

The product direction is intentionally narrow:

- Local-first by default
- Learner-owned source material and provenance
- No required accounts, telemetry, or cloud persistence
- Desktop-first study flows with calm, durable UI

## Features

- **Content library** with article paste, subtitle (SRT) import, and LLM-generated practice content
- **Reading interface** with synchronized TTS audio playback, word-level highlighting, and inline annotations
- **Spaced-repetition review** using FSRS scheduling with daily vocabulary cards, recall ratings, and sentence audio
- **Unified audio cache** so reading and review share a single content-addressed TTS cache
- **Known word tracking** with onboarding seed packs and manual marking
- **Home dashboard** with daily review summary and resume-reading entry points
- **Settings** for theme preference, API keys (OpenAI, OpenRouter), TTS voice and mode selection
- **Offline-first** core flows remain usable without API keys or network access

## Prerequisites

- Node.js 20 or newer
- npm
- macOS for the current desktop packaging flow

## Getting Started

Install dependencies:

```bash
npm install
```

Run the test suite:

```bash
npm test
```

Build all workspaces:

```bash
npm run build
```

Launch the desktop app:

```bash
npm run dev:desktop
```

Package the desktop app:

```bash
npm run package:desktop
```

Renderer-only development:

```bash
npm run dev:renderer
```

## Workspace Scripts

- `npm test` runs the Vitest suite
- `npm run test:watch` runs Vitest in watch mode
- `npm run build` builds domain, data, integrations, renderer, and desktop
- `npm run typecheck` typechecks all workspaces
- `npm run dev:renderer` starts the renderer dev server
- `npm run dev:desktop` builds all packages then starts the Electron app
- `npm run package:desktop` builds and packages the macOS desktop app
- `npm run wipe:library` resets the content library while preserving settings
- `npm run spike:tokenizer` runs the tokenizer spike
- `npm run spike:llm-fallback` runs the fallback-spec generator
- `npm run spike:sqlite-concurrency` runs the SQLite concurrency spike

## Repository Layout

```text
apps/
  desktop/     Electron main process, preload bridge, packaging config
  renderer/    Next.js renderer and UI

packages/
  data/        SQLite access, migrations, repository, workloads
  domain/      Shared contracts, content models, review logic, settings
  integrations/ LLM and TTS provider adapters (OpenAI, OpenRouter)

spikes/
  tokenizer/
  llm-fallback/
  sqlite-concurrency/

tests/
  contract/    Bridge, schema, and API contract coverage
  integration/ Feature integration coverage
  benchmark/   Spike benchmark coverage

specs/
  001-feasibility-spike-foundation/
  002-desktop-app-shell/
  003-add-content-library/
  004-sync-reading-audio/
  005-daily-vocabulary-review/
  006-home-library-settings/
```

## Specifications

The repo uses Spec Kit artifacts as the planning source of truth. Each spec directory documents a feature phase from analysis through implementation.

Useful documents:

- `DESIGN.md` defines the UI direction, tokens, layout, and interaction style
- `.specify/memory/constitution.md` defines the non-negotiable product and architecture constraints

## Architecture Notes

- SQLite access is restricted to the Electron main process
- The renderer stays unprivileged and consumes a typed preload bridge (`window.sona`)
- Core study flows are designed to stay usable without API keys or network access
- TTS audio is content-addressed on disk so reading and review share cached files
- Review scheduling uses the FSRS algorithm with per-card difficulty and stability tracking
- Background workloads handle annotation refresh, reading-exposure logging, and SRS harvesting

## Product Principles

Sona is governed by a small set of product rules that shape all work:

- Local-first learning
- Learner-owned content pipeline
- Bounded review load
- Reading and listening reinforce each other
- Personal-use simplicity with public-ready architecture

If you are extending the app, read the constitution and the active feature spec before changing persistence, scheduling, provenance, import or export behavior, or any TTS and LLM path.
