# Research: Add Content Library

## Decision: Represent saved study text as sentence-level `ContentBlock` records grouped under library items

Rationale: The requested schema is sentence-oriented and already defines the persistent unit the app needs for future reading, lookup, or review features. Storing sentence-level `ContentBlock` records under a higher-level library item keeps the Content Library card view simple while preserving inspectable provenance and future extensibility.

Alternatives considered: Storing one large text blob per library item was rejected because it makes future sentence-level study features harder and loses the structural ID requirement. Storing only blocks without a parent library item was rejected because the UI needs a stable item-level record for titles, filter/search, and deletion.

## Decision: Use structural saved-content identifiers built from `(source_type, structural_source_locator, created_at[, sentence_ordinal])` rather than a content hash

Rationale: The user explicitly required a structural identifier, and this aligns with provenance-first behavior. Structural IDs remain traceable to the learner-approved source even if the same sentence text appears elsewhere. The structural source locator is the subtitle file path for SRT imports, the article URL for scraped articles, and the ingestion session identifier for pasted articles and generated content. Including the saved item's `created_at` keeps confirmed duplicate saves distinct without falling back to opaque random IDs.

Alternatives considered: Content hashes were rejected because identical text from different sources would collide conceptually and would hide provenance. Random UUIDs were rejected because they make debugging and traceability harder without adding user value.

## Decision: Store difficulty as an integer scale `1 | 2 | 3` mapped to Korean badges `초급`, `중급`, `고급`

Rationale: The feature must show difficulty in the library and the prompt already specifies Korean badge labels. A compact integer scale satisfies the requested `number | null` schema while keeping filtering, validation, and provider prompting straightforward.

Alternatives considered: A free-form numeric continuum was rejected because it adds UI ambiguity and forces an extra thresholding policy later. Storing only strings was rejected because the requested schema already standardizes on a nullable number.

## Decision: Parse subtitle files with `srt-parser-2` in the main process and map each subtitle sentence into `ContentBlock` rows with preserved timing

Rationale: `srt-parser-2` is directly suited to SRT parsing, keeps the import logic focused, and lets the main process own filesystem access and persistence. Subtitle-derived blocks can preserve `audio_offset` from the subtitle timing so later listening features can reuse it.

Alternatives considered: Writing a custom SRT parser was rejected because it adds avoidable parsing risk. Exposing direct file access to the renderer was rejected because it violates the existing preload boundary.

## Decision: Split pasted and scraped article text with a simple Korean-aware regex on `。.!?` followed by whitespace or end of string

Rationale: The user explicitly provided the sentence boundary rule, and it is adequate for this planning slice. Using the same splitter for pasted and scraped article text produces consistent `sentence_ordinal` values and avoids premature tokenizer coupling.

Alternatives considered: Pulling in a full Korean NLP sentence segmenter was rejected because it is unnecessary complexity for the requested feature. Splitting only on newline boundaries was rejected because it would produce inconsistent or overly large study blocks.

## Decision: Keep article scraping optional and route it through a main-process fetch-and-extract service

Rationale: The spec requires the library to stay useful offline and treat scraping as optional. Main-process routing avoids renderer privilege creep and contains network and HTML parsing failure handling away from the UI.

Alternatives considered: Requiring scraping for article entry was rejected because paste is already a complete offline path. Running scraping directly in the renderer was rejected because it complicates the security model and can fail unpredictably around cross-origin behavior.

## Decision: Use direct OpenRouter chat-completions HTTP calls instead of adding a dedicated SDK

Rationale: Current OpenRouter documentation confirms an OpenAI-compatible chat-completions surface, JSON output controls via `response_format`, and structured-output options. Using `fetch` from the main process keeps the dependency surface small while still supporting the required `anthropic/claude-3-5-haiku` generation call and `openai/gpt-4o-mini` validation call.

Alternatives considered: Adding an OpenRouter SDK was rejected because it increases coupling without solving a current product problem. Running provider calls from the renderer was rejected because API credentials and request policy must stay out of the unprivileged client.

## Decision: Validate generated difficulty drift with a second cheap classification call and either relabel or reject before saving

Rationale: The user explicitly requested post-generation validation with `openai/gpt-4o-mini`. A second classification pass enforces the learner’s requested difficulty, prevents silent drift, and keeps saved library data honest about actual complexity.

Alternatives considered: Trusting the generator’s self-reported difficulty was rejected because it hides model drift. Reject-only behavior without relabeling was rejected because some generated content remains useful if the classifier can clearly place it in a neighboring level.

## Decision: Display validated difficulty in the library while preserving requested difficulty in provenance details

Rationale: Once relabeling is allowed, the library cannot truthfully present only the requested difficulty. Showing the validated difficulty keeps the main browsing surface honest, while preserving the requested difficulty in provenance details keeps the learner’s original intent inspectable.

Alternatives considered: Displaying only the requested difficulty was rejected because it would hide drift that the validator found. Displaying only the validated difficulty without provenance was rejected because it would lose the learner's original request context.

## Decision: Warn on potential duplicates before save, but allow explicit learner-confirmed duplicate retention

Rationale: Duplicate material can be intentional in language study, especially when the learner wants a second pass through familiar content. The safest policy is therefore to detect likely duplicates, warn clearly, and let the learner decide whether to continue saving. When the learner confirms a duplicate save, the persisted item and block identifiers remain source-traceable but become distinct by including the saved item's `created_at` in the structural ID.

Alternatives considered: Hard-blocking duplicates was rejected because it can prevent legitimate repeated study material. Silent duplicate acceptance was rejected because it hides a common mistake and weakens library hygiene.

## Decision: Expose provenance details through a learner-visible detail affordance on each library item

Rationale: The constitution requires derived study material to remain inspectable and traceable to source material. A visible provenance detail affordance on each library item is the lightest way to satisfy that requirement without overloading the card grid.

Alternatives considered: Limiting provenance to backend data only was rejected because it fails the inspectability requirement. Showing full provenance inline on every card was rejected because it would clutter the library UI.

## Decision: Extend the existing typed `window.sona` API with a focused `content` surface for listing, importing, generating, scraping, and deleting content

Rationale: The repo already enforces a narrow preload contract for shell and settings behavior. Extending that same typed surface keeps the renderer simple, preserves `contextIsolation`, and matches the user’s requirement that all IPC calls follow the preload-defined `window.sona` API.

Alternatives considered: Exposing generic IPC channels was rejected because it weakens the boundary and makes testing harder. Reusing the separate `window.sonaApi` file helpers was rejected because this feature belongs in the app’s primary typed desktop API rather than a loose helper surface.

## Decision: Add new SQLite tables for library items and content blocks, while keeping tokens nullable JSON and annotations as a non-null JSON object for now

Rationale: The requested schema includes `tokens` and `annotations`, but the current repo does not yet define concrete token or annotation storage types for production content. Persisting tokens as nullable JSON and annotations as a non-null JSON object with an empty-object default meets the schema contract now while keeping future enrichment compatible with the existing provenance and tokenizer work.

Alternatives considered: Removing `tokens` and `annotations` from the stored schema was rejected because the user explicitly included them. Creating a full normalized token/annotation schema now was rejected because that work is not required to deliver the current library flows.