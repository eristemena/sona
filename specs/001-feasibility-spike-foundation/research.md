# Research: Feasibility Spike Foundation

## Decision: Use Electron 33 with a locally loaded Next.js 15 static export renderer

Rationale: Electron provides the desktop shell and preload boundary the product needs, while Next.js static export keeps the renderer purely local and compatible with the constitution's no-server requirement. Current Next.js static export guidance requires `output: 'export'` and rejects server-only features such as API routes, server actions, middleware, rewrites, redirects, cookies, and default image optimization. Electron documentation supports a local-file renderer with a preload script and context isolation, which fits a secure desktop boundary.

Alternatives considered: Tauri was rejected for this phase because the user explicitly confirmed Electron 33. A server-rendered Next.js stack was rejected because it would violate the local-first, no-mandatory-network architecture and introduce unsupported runtime assumptions for packaging.

## Decision: Keep renderer logic static and move privileged local operations behind Electron preload IPC

Rationale: Electron guidance recommends a preload script with `contextBridge` so the renderer only sees explicitly exposed APIs. Combined with Next.js static export limits, this means local database access, filesystem reads, benchmark execution, and provider credential handling must live outside the renderer and cross the main/preload boundary via narrow contracts.

Alternatives considered: Direct Node.js access in the renderer was rejected because it weakens desktop isolation. Using Next.js route handlers or server actions for local operations was rejected because those features are not compatible with static export.

## Decision: Use better-sqlite3 with WAL mode and benchmark a single-writer policy

Rationale: better-sqlite3's current performance guidance recommends WAL mode for better concurrent read/write behavior. Its documentation also shows worker-thread patterns for asynchronous scheduling around synchronous query execution. For this phase, the benchmark should validate a single-writer or queued-write strategy, plus WAL checkpoint monitoring, because the biggest risk is contention between background annotation refresh and SRS harvesting on older hardware.

Alternatives considered: Prisma over SQLite was rejected because it adds unnecessary abstraction and startup cost before feasibility is proven. Hosted databases were rejected because they violate the product boundary. A naive multi-writer approach was rejected because better-sqlite3 is synchronous and would increase contention risk without delivering product value.

## Decision: Treat local tokenization as the preferred track and LLM assistance as an explicitly bounded fallback

Rationale: The constitution requires learner-owned, inspectable, local-first derivation. That makes a local tokenizer the default candidate. The feasibility spike should evaluate local tokenization quality across a stratified Korean corpus and document specific learner-facing failure modes. The provider-assisted path exists only as a fallback specification for cases where local segmentation or enrichment quality is insufficient.

Alternatives considered: LLM-first tokenization was rejected as the default because it adds privacy exposure, recurring cost, latency variability, and mandatory online coupling. Delaying tokenization evaluation until implementation was rejected because token boundaries affect lookup, annotation quality, and vocabulary harvesting in every later phase.

## Decision: Standardize on provider-agnostic adapters for LLM and TTS features

Rationale: The user confirmed OpenAI or Anthropic for language features and OpenAI TTS or Google Cloud TTS for audio. The plan should isolate these behind adapter contracts so no-key mode is always available and switching providers later does not require architecture changes. The fallback spec must capture prompts, expected outputs, latency budgets, cost ceilings, and session usage caps before implementation.

Alternatives considered: Hard-wiring a single provider was rejected because it creates vendor lock-in too early. Local-only TTS was rejected as the sole path for this phase because the user explicitly wants hosted TTS options, but those remain optional and additive.

## Decision: Use ts-fsrs as the scheduling baseline for spaced repetition

Rationale: The user already selected `ts-fsrs`, and it aligns with the requirement to keep review load bounded through explicit scheduling rules. The feasibility phase does not need to invent a scheduler; it needs to preserve the data needed for future FSRS card creation and measure whether harvesting work can happen without hurting responsiveness.

Alternatives considered: SM-2-style custom scheduling was rejected because it adds avoidable algorithm design work before the foundation is validated.

## Decision: Validate spikes against a 2019-era hardware baseline with explicit acceptance thresholds

Rationale: The specification defines 2019-era consumer hardware as the minimum acceptable baseline and success criteria require 30-second total completion with under-1-second interaction blocking. The spikes must therefore capture hardware profile, workload size, concurrent operations, and latency observations in a repeatable artifact schema.

Alternatives considered: Benchmarking only on current high-end development hardware was rejected because it would not de-risk the actual product promise.
