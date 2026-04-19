# Sona

Sona is a local-first Korean study desktop app. This repository is a TypeScript monorepo for the feasibility-spike phase and the first runnable desktop shell: an Electron app with a Next.js static-export renderer, local SQLite-backed settings, and offline-first behavior.

The product direction is intentionally narrow:

- Local-first by default
- Learner-owned source material and provenance
- No required accounts, telemetry, or cloud persistence
- Desktop-first study flows with calm, durable UI

## Current Status

The repository now contains two layers of work:

- Feasibility spike artifacts for tokenizer quality, LLM fallback behavior, and SQLite concurrency
- A working desktop shell slice with Electron packaging, a persistent sidebar, typed preload bridge, and local theme persistence

Implemented shell capabilities:

- Electron 33 desktop runtime
- Next.js 15 renderer exported for desktop loading
- `window.sona` typed bridge via `contextBridge`
- Local SQLite migrations and settings storage in the main process
- Persistent sidebar with Dashboard, Library, Review, and Settings destinations
- Theme preference persistence with system, dark, and light modes
- macOS-first packaging via `electron-builder`

Known non-blocking caveats:

- The default Electron icon is still in use
- Local macOS code signing is not configured

## Prerequisites

- Node.js 20 or newer
- npm
- macOS for the current desktop packaging and smoke-test flow

## Getting Started

Install dependencies:

```bash
npm install
```

Run the automated test suite:

```bash
npm test
```

Build all workspaces:

```bash
npm run build
```

Launch the desktop shell:

```bash
npm run dev:desktop
```

Package the desktop app:

```bash
npm run package:desktop
```

Renderer-only development is also available:

```bash
npm run dev:renderer
```

## Workspace Scripts

Root scripts:

- `npm test` runs the Vitest suite
- `npm run build` builds `@sona/domain`, `@sona/data`, `@sona/renderer`, and `@sona/desktop`
- `npm run typecheck` typechecks all workspaces
- `npm run dev:renderer` starts the renderer dev server
- `npm run dev:desktop` starts the Electron desktop app
- `npm run package:desktop` builds and packages the macOS desktop app, then restores the local Node `better-sqlite3` build
- `npm run spike:tokenizer` runs the tokenizer spike
- `npm run spike:llm-fallback` runs the fallback-spec generator
- `npm run spike:sqlite-concurrency` runs the SQLite concurrency spike

## Repository Layout

```text
apps/
  desktop/     Electron main process, preload bridge, packaging config
  renderer/    Next.js renderer and shell UI

packages/
  data/        SQLite access, migrations, settings persistence
  domain/      Shared contracts, settings logic, spike-domain models
  integrations/ Optional external-service integration stubs

spikes/
  llm-fallback/
  sqlite-concurrency/
  tokenizer/

tests/
  contract/    Bridge and schema contract coverage
  integration/ Desktop shell integration coverage
  benchmark/   Spike benchmark coverage

specs/
  001-feasibility-spike-foundation/
  002-desktop-app-shell/
```

## Specifications

The repo uses Spec Kit artifacts as the planning source of truth.

- `001-feasibility-spike-foundation` defines the feasibility phase for tokenizer evaluation, provider fallback policy, and SQLite concurrency benchmarking
- `002-desktop-app-shell` defines and documents the first implemented desktop shell slice

Useful documents:

- `DESIGN.md` defines the UI direction, tokens, layout, and interaction style
- `.specify/memory/constitution.md` defines the non-negotiable product and architecture constraints
- `specs/002-desktop-app-shell/quickstart.md` records the current desktop-shell validation path and latest verification notes

## Architecture Notes

- SQLite access is restricted to the Electron main process
- The renderer stays unprivileged and consumes a typed preload bridge
- Core study flows are designed to stay usable without API keys or network access
- The current shell slice explicitly excludes LLM and TTS runtime integration

## Validation Snapshot

Recorded for the desktop shell slice:

- `npm test` passed with 15 test files and 20 tests green
- `npm run build` passed across domain, data, renderer, and desktop workspaces
- `npm run package:desktop` produced a working macOS app bundle under `dist/electron-builder/mac-arm64`
- Packaged offline launch was manually verified

## Product Principles

Sona is governed by a small set of product rules that should shape future work:

- Local-first learning
- Learner-owned content pipeline
- Bounded review load
- Reading and listening reinforce each other
- Personal-use simplicity with public-ready architecture

If you are extending the app, read the constitution and the active feature spec before changing persistence, scheduling, provenance, import or export behavior, or any future TTS and LLM path.