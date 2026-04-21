# Data Model: Sync Reading Audio

## ContentBlock

Purpose: Existing sentence-level content unit that becomes the atomic reading, audio-generation, lookup, and exposure target in the reading view.

Fields:
- `id`: Stable block identifier.
- `contentItemId`: Parent library item identifier.
- `korean`: Sentence text rendered in the reading surface.
- `romanization`: Optional learner-visible romanization.
- `tokens`: Token array used to map rendered words to highlights and lookup targets.
- `annotations`: Existing annotation map retained for locally derived or precomputed notes.
- `difficulty`: Difficulty level inherited from the source item.
- `sourceType`: `generated`, `article`, or `srt`.
- `audioOffset`: Existing subtitle timing offset when present.
- `sentenceOrdinal`: Stable order within the content item.
- `createdAt`: Local creation timestamp.

Validation rules:
- `tokens` may be null before tokenization exists, but synced highlighting requires a non-empty rendered token list for any block that exposes karaoke timing.
- `sentenceOrdinal` must remain unique within a content item.
- `audioOffset` remains nullable and is not reused as a substitute for TTS timing metadata.

Relationships:
- One `ContentBlock` may have zero or one active `BlockAudioAsset` per cache key.
- One `ContentBlock` may produce many `ExposureLogEntry` rows over time.
- One `ContentBlock` may be referenced by many `AnnotationCacheEntry` lookups and review cards.

## BlockAudioAsset

Purpose: Stores the local cache record for synthesized audio and word-level timing metadata for a single content block.

Fields:
- `id`: Stable audio asset identifier.
- `blockId`: Parent content block identifier.
- `provider`: `openai` for this feature slice.
- `modelId`: `gpt-4o-mini-tts` by default for direct OpenAI TTS generation.
- `readingAudioMode`: persisted settings value that distinguishes standard versus learner-slow generation and participates in audio-cache invalidation for regenerated clips.
- `voice`: Configured voice identifier used for synthesis.
- `textHash`: Hash of normalized block text used for cache invalidation.
- `audioFilePath`: Absolute path to the cached audio file in the app-data directory.
- `timingFormat`: `verbose_json` word-timestamp payload persisted for karaoke sync.
- `timingsJson`: Persisted word-level timestamp payload used to drive karaoke highlighting.
- `durationMs`: Total audio duration in milliseconds.
- `generationState`: `pending`, `ready`, `failed`, or `unavailable`.
- `failureReason`: Nullable learner-safe error summary.
- `generatedAt`: Timestamp of the last successful generation.
- `lastAccessedAt`: Timestamp of the last playback request.

Validation rules:
- The active cache key is `(blockId, modelId, voice, textHash)`.
- `audioFilePath` and `timingsJson` are required when `generationState = ready`.
- `failureReason` is required when `generationState = failed`.
- `durationMs` must be positive when `generationState = ready`.

State transitions:
- `missing` -> `pending`
- `pending` -> `ready`
- `pending` -> `failed`
- `pending` -> `unavailable`
- `ready` -> `pending` when the block text, model, or voice changes

## WordTimingEntry

Purpose: Represents one rendered token’s audio alignment inside a cached `BlockAudioAsset` timing payload.

Fields:
- `tokenIndex`: Zero-based rendered token index.
- `surface`: Displayed token text.
- `startMs`: Inclusive audio start offset.
- `endMs`: Exclusive audio end offset.
- `normalized`: Optional canonical token form used to map lookup and playback state.

Validation rules:
- Entries must be sorted by `tokenIndex` and by ascending `startMs`.
- `startMs < endMs` for every row.
- A timing payload may omit punctuation-only rendered tokens, but token-to-highlight mapping must remain deterministic.

Relationships:
- Many `WordTimingEntry` records belong to one `BlockAudioAsset` payload.

## AnnotationCacheEntry

Purpose: Caches tap-to-lookup and grammar response data for a canonical form in a specific sentence context.

Fields:
- `id`: Stable annotation cache identifier.
- `canonicalForm`: Canonical morpheme or lemma returned by the lookup prompt.
- `sentenceContextHash`: Hash of the surrounding sentence context.
- `surface`: Original tapped surface form.
- `meaning`: What the tapped word or construction means in this specific sentence.
- `romanization`: Provider-returned romanization.
- `pattern`: Grammar pattern for the tapped form in context.
- `register`: Register label, such as informal, polite, or formal.
- `sentenceTranslation`: Natural English translation of the full sentence.
- `grammarExplanation`: Optional richer explanation text.
- `modelId`: Model that produced the cached payload.
- `responseJson`: Full structured response stored for inspection and refresh.
- `createdAt`: Timestamp of first cache write.
- `refreshedAt`: Timestamp of most recent successful refresh.
- `staleAfter`: Timestamp after which the entry is eligible for background refresh.
- `lastServedAt`: Timestamp of the last renderer read.
- `refreshState`: `fresh`, `stale`, or `refreshing`.

Validation rules:
- The cache key is `(canonicalForm, sentenceContextHash)`.
- `staleAfter` defaults to 30 days after `refreshedAt`.
- A different `modelId` marks an entry stale immediately, even if `staleAfter` has not elapsed.
- `meaning`, `pattern`, `register`, and `sentenceTranslation` are required for all successful lookups; `grammarExplanation` may be null.

State transitions:
- `miss` -> `fresh`
- `fresh` -> `stale`
- `stale` -> `refreshing`
- `refreshing` -> `fresh`
- `refreshing` -> `stale` if the refresh fails

## ReadingSession

Purpose: Represents the learner’s local session state while reading a content item with optional audio and lookup interactions.

Fields:
- `id`: Session identifier.
- `contentItemId`: Opened content item.
- `activeBlockId`: Currently focused block.
- `playbackState`: `idle`, `buffering`, `playing`, `paused`, or `ended`.
- `playbackRate`: Selected audio speed.
- `currentTimeMs`: Current block-local playback position.
- `highlightedTokenIndex`: Current karaoke token index or null.
- `openedAt`: Session start timestamp.
- `lastInteractionAt`: Timestamp of the latest playback, tap, or deck action.
- `pendingExposures`: In-memory list of token exposures awaiting flush.

Validation rules:
- Only one active `ReadingSession` is persisted per open reading surface.
- `highlightedTokenIndex` must reference a valid rendered token when `playbackState = playing`.
- `pendingExposures` is append-only during the live session and cleared only after a successful batch flush.

State transitions:
- `created` -> `playing`
- `created` -> `idle`
- `playing` -> `paused`
- `paused` -> `playing`
- `playing` -> `ended`
- Any state -> `closed` on view exit, with final exposure flush attempt

## ExposureLogEntry

Purpose: Records passive token exposure from the reading flow after a session-level batch flush.

Fields:
- `blockId`: Referenced content block identifier.
- `token`: Observed token string.
- `seenAt`: Timestamp recorded when the token was highlighted or otherwise marked seen.

Validation rules:
- Rows are written in batches at session end or explicit save, never per highlight tick.
- `token` must not be empty.
- Duplicate rows for the same `(blockId, token, seenAt)` triple are ignored.

Relationships:
- Many `ExposureLogEntry` rows belong to one `ContentBlock` over time.

## ReviewCard

Purpose: First concrete spaced-repetition card created when the learner taps `Add to deck` from the reading view.

Fields:
- `id`: Review card identifier.
- `canonicalForm`: Canonical token form used for duplicate detection.
- `surface`: Surface form the learner selected.
- `sourceBlockId`: Origin content block identifier.
- `sentenceContextHash`: Source sentence context hash.
- `sourceContentItemId`: Origin content item identifier.
- `fsrsState`: `New`, `Learning`, `Review`, or `Relearning` as represented by `ts-fsrs`.
- `dueAt`: Initial due timestamp from `createEmptyCard()`.
- `stability`: FSRS stability value.
- `difficulty`: FSRS difficulty value.
- `elapsedDays`: FSRS elapsed-day field.
- `scheduledDays`: FSRS scheduled-day field.
- `reps`: FSRS repetition count.
- `lapses`: FSRS lapse count.
- `lastReviewAt`: Nullable last review timestamp.
- `createdAt`: Card creation timestamp.
- `activationState`: `active`, `deferred`, or `duplicate-blocked`.

Validation rules:
- Creating a new card is allowed only when no active card already exists for the same learner-visible canonical form under the current duplicate policy.
- `activationState = active` requires the card to pass current pacing limits.
- `activationState = deferred` stores provenance without immediately increasing active daily load.

State transitions:
- `candidate` -> `active`
- `candidate` -> `deferred`
- `candidate` -> `duplicate-blocked`
