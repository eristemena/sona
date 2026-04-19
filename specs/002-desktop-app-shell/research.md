# Research: Desktop App Shell

## Decision: Use Electron 33 with a locally loaded Next.js 15 static export renderer

Rationale: The user explicitly confirmed Electron 33 and Next.js 15 static export. Current Next.js 15.1.8 guidance requires `output: 'export'` for static output and rejects server-dependent behavior, which aligns with Sona's local-first requirement and keeps the renderer packaging-friendly inside Electron. The renderer will therefore behave as a static client that loads locally and delegates privileged work to the desktop runtime.

Alternatives considered: A server-rendered Next.js runtime was rejected because it adds an unnecessary local server process and conflicts with static-export constraints. Tauri was rejected because the user already fixed Electron 33 as the shell runtime for this phase.

## Decision: Keep the renderer unprivileged and expose a narrow typed `window.sona` bridge from preload

Rationale: The renderer only needs shell bootstrap data and theme-setting operations in this phase. Exposing a typed `window.sona` surface through `contextBridge` preserves Electron's security boundary, keeps SQLite and OS APIs out of the renderer, and gives the shell a stable contract that can expand later without leaking raw IPC channels.

Alternatives considered: Enabling Node access in the renderer was rejected because it weakens isolation. Exposing generic `ipcRenderer` passthrough methods was rejected because it broadens the attack surface and makes the renderer contract harder to reason about.

## Decision: Restrict `better-sqlite3` to the main process and create the v1 schema through a migration runner on first launch

Rationale: `better-sqlite3` is synchronous and fits best inside the trusted Electron main process. A migration runner provides deterministic startup behavior and keeps future schema expansion compatible with the constitution's upgrade-safety rule. For this shell phase, the v1 schema only needs migration bookkeeping plus a `settings` table to store the learner's manual theme preference.

Alternatives considered: Direct renderer access to SQLite was rejected because it breaks the process boundary. Deferring migrations until later was rejected because the shell already depends on persisted settings and needs a stable place to store them from the first launch onward.

## Decision: Resolve theme in this order: explicit user preference, system preference, then dark-mode fallback

Rationale: The user asked for dark mode to be the default, while also respecting the system preference and allowing manual override stored in the `settings` table. The cleanest contract is to store a theme preference mode of `system`, `dark`, or `light`, resolve to the explicit setting when present, otherwise follow the OS preference, and fall back to dark when no valid preference or system signal is available.

Alternatives considered: Persisting only `dark` or `light` was rejected because it cannot represent a system-following choice. Hard-coding dark mode without checking the system preference was rejected because it ignores the requested OS-aware behavior.

## Decision: Use Tailwind CSS with shadcn/ui primitives and load Pretendard by CSS import in the renderer

Rationale: Tailwind CSS and shadcn/ui provide a fast path to a consistent shell layout while still allowing the product-specific tokens from `DESIGN.md` to drive the appearance. Pretendard is already the authoritative font choice for mixed Hangul and Latin UI, so loading it through CSS import in the renderer keeps typography centralized and consistent.

Alternatives considered: Building ad hoc shell primitives without Tailwind or shadcn/ui was rejected because it adds avoidable layout and state-management work to a foundational shell feature. Swapping to another font stack was rejected because the design instructions already standardize on Pretendard.

## Decision: Package the desktop app with electron-builder, with no provider integrations in this phase

Rationale: The user explicitly chose electron-builder for packaging and explicitly excluded LLM and TTS calls from this feature phase. The plan should therefore focus packaging on a fully local desktop bundle that includes the Electron runtime, static renderer assets, and local database initialization only.

Alternatives considered: Delaying packaging until later was rejected because a shell that cannot be packaged is not a complete desktop foundation. Adding placeholder provider wiring in this phase was rejected because it would widen scope without serving the shell requirements.