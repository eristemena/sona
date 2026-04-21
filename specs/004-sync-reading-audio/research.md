# Research: Sync Reading Audio

## Decision: Generate and cache TTS per ContentBlock in the local app-data directory

Rationale: The feature needs first-open audio generation without making the learner wait on every reopen. Caching audio per `ContentBlock` keeps invalidation simple because the cache key can be derived from block text, provider model, and selected voice. Storing the binary audio file in the app-data directory keeps the SQLite database small, makes cache cleanup explicit, and preserves offline replay after the first successful generation.

Alternatives considered: Generating one file for an entire content item was rejected because it makes word-level invalidation and partial regeneration expensive when only one block changes. Storing audio blobs directly in SQLite was rejected because it increases database churn and backup size for a binary-heavy workload.

## Decision: Use direct OpenAI TTS as the primary hosted audio path, with text-first fallback when audio is unavailable

Rationale: The reading-audio path should not depend on OpenRouter model availability. This slice uses the OpenAI speech API directly with the `gpt-4o-mini-tts` model, with the `openaiApiKey` stored in settings and kept separate from the OpenRouter key used for lookup and grammar calls. Missing credentials, provider latency, or unavailable timing extraction remain non-fatal. The learner can still open the reading view, read the text, tap words, and add cards even when no audio can be produced. Reading audio also supports a learner-slow generation mode so the app can request calmer, slower delivery without relying on extreme playback-rate stretching.

Alternatives considered: Introducing a separate direct-to-OpenAI integration was rejected because it duplicates provider configuration and weakens the existing OpenRouter abstraction. Blocking the reading view until audio is ready was rejected because it violates the local-first core loop.

## Decision: Persist word-level timing metadata with each cached audio asset and drive karaoke sync from renderer-owned playback state

Rationale: The reading view needs smooth highlight updates tied to audio `currentTime` without constant IPC round-trips. Persisting the timestamp payload returned by the TTS request alongside the cached audio asset allows the renderer to hydrate a local timing map and advance the highlighted token index via a React state machine while the audio element remains the source of truth. This keeps playback responsive and lets cached audio reopen immediately.

Alternatives considered: Polling the main process for the active token was rejected because it adds unnecessary IPC traffic and makes drift harder to debug. Recomputing timings from subtitle offsets or token positions alone was rejected because generated TTS timing must follow the actual synthesized audio, not estimated token duration.

## Decision: Use a stale-while-revalidate annotation cache keyed by `(canonical_form, sentence_context_hash)`

Rationale: Tap-to-lookup should feel immediate on repeated words in the same sentence context. Caching by canonical form alone is too coarse for Korean words whose gloss or grammar note shifts by context, while caching by raw tapped surface form misses obvious reuse. The combined key preserves contextual accuracy, serves cached results instantly, and allows stale entries older than 30 days or produced by a different model to be shown immediately while a background refresh is queued.

Alternatives considered: Always calling the LLM on tap was rejected because it adds latency and cost to the core reading loop. Caching only by surface token was rejected because inflected or repeated forms would fragment the cache and reduce hit rate.

## Decision: Keep lookup and richer grammar explanation on the main-process side behind a typed IPC contract

Rationale: Provider keys and prompts must stay out of the renderer, and the existing architecture already routes provider-backed features through typed preload APIs. The lookup call can normalize token context, check the cache, call `openai/gpt-4o-mini` through OpenRouter when needed, and return structured JSON for the popup. Richer grammar explanation should use the same boundary so stale cache behavior, fallback messaging, and future provider swaps remain centralized.

Alternatives considered: Exposing raw `ipcRenderer` or provider credentials to the renderer was rejected for security and contract-discipline reasons. Precomputing all annotations up front was rejected because it adds unnecessary provider cost and would create background work for words the learner never taps.

## Decision: Use Motion `AnimatePresence` for the anchored lookup popup with fade-and-translate transitions

Rationale: The design instructions call for a lightweight inline popup rather than a modal. Motion’s `AnimatePresence` pattern supports conditional mount and exit animations cleanly, which fits the anchored card, outside-click dismissal, and repeated open-close interactions in the reading flow. This adds a focused UI dependency with a narrow scope and avoids custom animation bookkeeping.

Alternatives considered: CSS-only mount and unmount transitions were rejected because they complicate exit animation timing and dismissal state for an anchored popup. A modal overlay was rejected because it interrupts reading continuity.

## Decision: Create exactly one FSRS card per learner-triggered add-to-deck action using `ts-fsrs` default card initialization

Rationale: The feature must keep review load bounded. `ts-fsrs` already exists in project direction as the scheduling baseline, and its `createEmptyCard()` path gives a standard `New` card state without inventing custom defaults. Creating cards only on explicit learner action, one token at a time, avoids bulk seeding and keeps pacing enforcement aligned with the product constitution.

Alternatives considered: Bulk card generation from all tapped or all highlighted words was rejected because it would silently create review spikes. A custom scheduler seed format was rejected because it duplicates work that `ts-fsrs` already solves.

## Decision: Batch passive exposure writes at session end instead of per token highlight

Rationale: The reading feature highlights many tokens per minute, so per-word writes would create unnecessary SQLite contention during active playback. Buffering exposures in memory during the session and flushing them once when the learner leaves the reading view, closes the session, or explicitly saves progress preserves useful passive-exposure history without harming interactive responsiveness.

Alternatives considered: Real-time inserts on every highlight event were rejected because prior repository work already identified SQLite write contention as a product risk. Dropping passive exposure logging entirely was rejected because it removes a useful signal for later review and analytics features, even in a local-first product.