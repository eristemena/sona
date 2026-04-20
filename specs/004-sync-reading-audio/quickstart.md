# Quickstart: Sync Reading Audio

This feature is planned as the first full reading-view slice on top of the local content library. The validation path below covers synced playback, cached reopen, in-context lookup, richer grammar help, direct card creation, and passive exposure batching.

## 1. Prerequisites

- Node.js 20 LTS or newer.
- npm available locally.
- A desktop environment supported by the Electron workflow.
- At least one saved content item in the local library.
- Optional `OPENROUTER_API_KEY` configured locally for hosted TTS and lookup enrichment.

## 2. Install Dependencies

```bash
npm install
```

## 3. Core Validation Commands

Run the automated suite:

```bash
npm test
```

Run workspace typechecks:

```bash
npm run typecheck
```

Build the workspaces:

```bash
npm run build
```

Start the desktop app for manual validation:

```bash
npm run dev:desktop
```

## 4. Validate First-Open Audio Generation And Cached Reopen

Manual checks:

- Open a saved content item in the reading view with provider access enabled.
- Confirm the reading text appears immediately, even before audio is ready.
- On first open of a block, confirm audio is generated once, saved locally, and playback begins when ready.
- Close and reopen the same reading view and confirm the cached block audio replays without a second provider wait.
- Change the reading voice or modify the block text, then confirm the cache invalidates and regenerates only for the changed key.

Expected automated coverage:

- `tests/contract/reading-sync-schema-contract.test.ts`
- `tests/integration/audio-cache-first-open.test.ts`
- `tests/integration/audio-cache-reopen.test.ts`

## 5. Validate Karaoke Sync

Manual checks:

- Start playback and confirm the current spoken word is highlighted while the rest of the sentence remains readable.
- Pause, resume, change speed, and scrub within the block, then confirm the highlighted token follows the current audio position.
- Confirm the highlight can advance through repeated words without jumping to the wrong occurrence.
- Confirm punctuation or mixed-script content does not break token highlighting for surrounding Korean words.

Expected automated coverage:

- `tests/integration/synced-reading-audio.test.tsx`
- `tests/integration/word-highlight-timing-drift.test.tsx`

## 6. Validate Tap-To-Lookup And Richer Grammar Help

Manual checks:

- Tap a word during reading and confirm an anchored popup appears below the token with meaning, part of speech, romanization, and a short grammar note.
- Dismiss the popup by clicking outside it and confirm the exit animation completes cleanly.
- Tap the same word again and confirm the result is served immediately from local cache when available.
- Force a stale cache condition and confirm the stale result is shown immediately while a background refresh updates it.
- Request more grammar detail and confirm either a richer explanation appears in place or a clear fallback message is shown.

Expected automated coverage:

- `tests/contract/window-sona-reading-contract.test.ts`
- `tests/integration/annotation-cache-stale-refresh.test.ts`
- `tests/integration/reading-popup-dismissal.test.tsx`

## 7. Validate Add-To-Deck And Review Load Controls

Manual checks:

- Tap `Add to deck` for a selected word and confirm exactly one new card is created.
- Confirm the saved card retains source block and sentence context.
- Attempt to add the same canonical word again and confirm the app blocks duplicate active work.
- Force the learner over the current new-card pacing limit and confirm the add action is deferred instead of silently activating more work.

Expected automated coverage:

- `tests/integration/reading-view-add-to-deck.test.tsx`
- `tests/integration/review-load-bounded-from-reading.test.ts`

## 8. Validate Passive Exposure Logging

Manual checks:

- Read through multiple blocks, then leave the reading view.
- Confirm exposure rows are written after the session ends rather than during playback.
- Re-open the same content and confirm duplicate flushes do not multiply identical `(block_id, token, seen_at)` entries.

Expected automated coverage:

- `tests/integration/exposure-log-batching.test.ts`

## 9. Validate Offline And No-Key Fallbacks

Manual checks:

- Launch the app without network access and open a content item.
- Confirm text-first reading still works.
- Confirm cached audio plays offline when it already exists.
- Confirm first-open uncached audio and live lookup fail safely with clear status messaging rather than breaking the reading view.
- Confirm `Add to deck` still works when provider-backed audio and lookup are unavailable.

Expected automated coverage:

- `tests/integration/reading-view-offline-fallback.test.tsx`
- `tests/integration/reading-view-provider-unavailable.test.ts`

## 10. Measure Success Criteria

- Record 5 first-open runs with uncached audio and 5 reopen runs with cached audio.
- Confirm at least 90% of reading sessions open and begin usable study within 10 seconds.
- Confirm word highlighting stays on the spoken token or an adjacent token for at least 95% of timed playback.
- Confirm lookup and add-to-deck first-attempt completion meets the spec success criteria.