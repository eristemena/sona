# Research: Home, Library, and Settings Hub

## Decision: Build the dashboard summary from existing `review_cards` and `reading_progress`, plus a new `study_sessions` table

Rationale: The user provided dashboard queries against `srs_cards`, but the repository’s durable review store is `review_cards`. The home screen can compute today’s due count from active due review cards, recent vocabulary from the latest five review-card rows, and resume context from the most recently updated `reading_progress` row joined back to `content_library_items`. Weekly activity and streak data need a new `study_sessions` table because the current schema tracks per-card review events but not per-session minutes or day-level totals.

Alternatives considered: Adding a second dashboard cache table was rejected because the required counts and recent-card slices are cheap local queries. Computing weekly activity only from `review_events` was rejected because the requested chart and streak depend on session-level `minutes_studied` and an explicit end-of-session write.

## Decision: Record one `study_sessions` row when a review session ends, not on every rating

Rationale: The feature only needs seven daily bars, streak continuity, and per-session totals. Writing one row at review-session completion keeps the model simple, reduces churn compared with per-rating writes, and matches the user’s requirement that `study_sessions` be written at the end of each review session. The dashboard can derive the weekly chart and streak by aggregating completed sessions over local calendar days.

Alternatives considered: Writing a row for every rating was rejected because it duplicates data already stored in `review_events` and complicates streak aggregation. Updating a single mutable daily summary row was rejected because append-only session history is easier to reason about and test.

## Decision: Keep the library list offline-first and move search, filter, and sort fully client-side after one initial catalog load

Rationale: The current library hook calls `listLibraryItems()` on each search or filter change. The requested behavior is explicit: no new IPC calls after the initial load. The renderer should fetch the full local catalog once, store it in React state, then derive filtered, searched, and sorted subsets client-side. This preserves offline behavior and avoids unnecessary desktop bridge chatter.

Alternatives considered: Reusing the current server-side search and filter query path was rejected because it violates the requested interaction model. Adding a new IPC endpoint for every sort mode was rejected because local state is sufficient for the current single-user library size.

## Decision: Rework the add-content flow around a shared accessible dialog primitive, with import-first controls for SRT and pasted text

Rationale: The current library uses custom modal overlays and a broad “add content” surface. This feature needs an import modal with a file picker for SRT and a textarea for pasted text, and the request specifically calls for a shadcn-style dialog pattern. The implementation should introduce a reusable dialog component built on Radix Dialog primitives in the renderer, then adapt the library add flow to present import-first controls while continuing to display both imported and generated items in the same library.

Alternatives considered: Leaving the current custom overlay as-is was rejected because the feature request explicitly calls for a dialog component pattern and the current repo has no shared dialog abstraction. Pulling in the full shadcn CLI workflow was rejected because the project only needs the dialog primitive and already owns its styling layer.

## Decision: Use `react-hook-form` with `zod` for the settings form and treat the provider key check as an explicit, optional network action

Rationale: The current settings screen is managed by local component state and separate save buttons. This feature adds multiple related settings, validation rules, and a provider health check. A schema-backed form keeps validation deterministic and reduces repetitive wiring. The OpenRouter health check should run only when the learner asks to test the stored key, using `GET https://openrouter.ai/api/v1/models` and reporting success on HTTP 200 while leaving the rest of settings fully usable offline.

Alternatives considered: Hand-rolled validation was rejected because daily goal, API key management, and voice selection now form one cohesive settings workflow. Running an automatic key test on every keypress or save was rejected because it would weaken the app’s offline-first posture and make network availability feel mandatory.

## Decision: Standardize the learner-managed provider credential in this feature on an OpenRouter key stored in settings

Rationale: The planning input explicitly specifies an OpenRouter models-endpoint test. The existing codebase currently stores an OpenAI key for reading audio and reads OpenRouter credentials from process environment for generation and lookup. For a learner-managed settings surface, process-environment configuration is not sufficient. This feature should introduce a local OpenRouter key setting as the supported learner-visible provider credential and route provider-backed status checks through that stored key.

Alternatives considered: Keeping provider configuration exclusively in environment variables was rejected because it is not manageable from the app UI. Treating the settings feature as OpenAI-only was rejected because it conflicts with the explicit OpenRouter verification requirement.

## Decision: Add a dedicated TTS voice preview action that synthesizes a fixed Korean phrase with the currently selected voice

Rationale: The learner needs immediate feedback when choosing a voice. A fixed preview phrase, `안녕하세요, 소나입니다.`, provides a stable comparison point, avoids ambiguity about source content, and fits a settings-only interaction. Preview is additive: if provider-backed TTS is unavailable, the selected voice can still be saved and the settings screen must remain usable.

Alternatives considered: Previewing arbitrary learner text was rejected because it complicates validation and creates unnecessary input scope. Omitting preview entirely was rejected because it makes voice selection guesswork.

## Decision: Render weekly activity with a minimal `Recharts` bar chart using seven local data points and no axis labels

Rationale: The requested dashboard visual is a seven-point weekly bar chart with `--accent` fill and no axis labels. `Recharts` covers this with a small, understandable API and keeps the chart code declarative inside the renderer. The chart remains purely presentational because the underlying aggregation happens in the main-process query layer.

Alternatives considered: Building the chart manually in CSS was rejected because it would add layout complexity for little gain. Adding a heavier visualization library was rejected because the requested visualization is a single compact bar chart.

## Decision: Keep backlog presentation bounded by surfacing today’s due count and streak context without changing review-card activation rules

Rationale: This feature is a dashboard and settings feature, not a scheduler rewrite. The home screen should expose due work, recent vocabulary, and weekly activity without creating new review items or changing review-card pacing. That satisfies the constitution’s bounded-load rule while keeping the new `study_sessions` data focused on reporting.

Alternatives considered: Auto-creating catch-up tasks or changing the due-card limit from the dashboard was rejected because it expands scope into scheduler behavior that feature 005 already owns.