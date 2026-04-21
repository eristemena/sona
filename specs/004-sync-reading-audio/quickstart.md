# Quickstart: Sync Reading Audio

This feature is planned as the first full reading-view slice on top of the local content library. The validation path below covers synced playback, cached reopen, in-context lookup, richer grammar help, direct card creation, and passive exposure batching.

## 1. Prerequisites

- Node.js 20 LTS or newer.
- npm available locally.
- A desktop environment supported by the Electron workflow.
- At least one saved content item in the local library.
- Optional `openaiApiKey` stored in settings for hosted reading audio and optional `OPENROUTER_API_KEY` configured locally for lookup and grammar enrichment. The default hosted reading-audio model is `gpt-4o-mini-tts`, with a learner-selectable speech style for newly generated clips.

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
- Confirm the active block restores the last saved playback location when the same content item is reopened.
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
- If hosted timing metadata is unavailable, confirm the app switches to estimated block timing instead of dropping playback entirely.
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
- Request more grammar detail and confirm either a richer explanation appears in place or a clear fallback message is shown without disrupting playback or resetting the active block.
- Tap a repeated surface form in the same sentence and confirm the popup resolves the specific tapped occurrence rather than the first matching token.

Expected automated coverage:

- `tests/contract/window-sona-reading-contract.test.ts`
- `tests/integration/annotation-cache-stale-refresh.test.ts`
- `tests/integration/reading-popup-dismissal.test.tsx`
- `tests/integration/repeated-word-lookup-context.test.tsx`

## 7. Validate Add-To-Deck And Review Load Controls

Manual checks:

- Tap `Add to deck` for a selected word and confirm exactly one new card is created.
- Confirm the saved card retains source block provenance, source content provenance, and the sentence-context link used for the card write.
- Close and reopen the app, then confirm the saved review card can still be located locally with the same provenance fields intact.
- Attempt to add the same canonical word again and confirm the app blocks duplicate active work.
- Force the learner over the current new-card pacing limit and confirm the add action is deferred instead of silently activating more work.
- Inspect the saved review-card row locally and confirm the FSRS seed fields begin in the new-card state while the activation state reflects either `active` or `deferred`.

Expected automated coverage:

- `tests/integration/reading-view-add-to-deck.test.tsx`
- `tests/integration/review-load-bounded-from-reading.test.ts`
- `tests/integration/review-card-provenance.test.ts`

## 8. Validate Passive Exposure Logging

Manual checks:

- Read through multiple blocks, then leave the reading view.
- Confirm exposure rows are written after the session ends rather than during playback.
- Confirm leaving the reading view triggers a single batched flush rather than one write per highlighted token.
- Re-open the same content and confirm duplicate flushes do not multiply identical `(block_id, token, seen_at)` entries.

Expected automated coverage:

- `tests/integration/exposure-log-batching.test.ts`

## 9. Validate Offline And No-Key Fallbacks

Manual checks:

- Launch the app offline from a previously migrated local database and confirm the library still opens without startup errors.
- Launch the app without network access and open a content item.
- Confirm text-first reading still works.
- Confirm cached audio plays offline when it already exists.
- Confirm first-open uncached audio and live lookup fail safely with clear status messaging rather than breaking the reading view.
- Confirm a richer grammar request falls back to an inline explanation message instead of closing the popup or losing the selected token.
- Confirm the play button stays disabled when no cached block audio is available.
- Confirm `Add to deck` still works when provider-backed audio and lookup are unavailable.

Expected automated coverage:

- `tests/integration/offline-content-library-startup.test.ts`
- `tests/integration/reading-view-offline-fallback.test.tsx`
- `tests/integration/reading-view-provider-unavailable.test.ts`

## 10. Validate Progress Restore, Provenance, And Cache Cleanup

Manual checks:

- Read partway through a block, leave the reading view, and reopen the same content item.
- Confirm the previously active block is restored along with playback speed and the saved scrub position.
- Modify block text or change the active voice, reopen audio for that block, and confirm the outdated cache file is removed after regeneration.
- Confirm the refreshed block still plays and the previous stale audio file no longer exists in the local audio-cache directory.

Expected automated coverage:

- `tests/integration/reading-progress-persistence.test.tsx`
- `tests/integration/review-card-provenance.test.ts`
- `tests/integration/audio-cache-cleanup.test.ts`

## 11. Validate Startup Budget And Lookup Usability

Manual checks:

- Run the reading-session startup benchmark before a manual validation pass.
- Open a saved reading session with cached audio and confirm the reading surface becomes usable well within the 10-second budget.
- For first-attempt lookup acceptance, confirm the first click on a known token opens the popup, shows meaning and grammar note, and leaves the active block and playback controls unchanged.
- Confirm the first click on `More grammar detail` either expands the explanation inline or shows the fallback explanation without dismissing the popup.
- Confirm the first click on `Add to deck` returns a visible success, duplicate, or deferred result without requiring a retry.

Expected automated coverage:

- `tests/benchmark/reading-session-startup.benchmark.test.ts`

Suggested command:

```bash
npx vitest run tests/benchmark/reading-session-startup.benchmark.test.ts
```

## 12. Validate Combined Fallback And Review Continuity

Manual checks:

- Start playback for a block with cached audio.
- Tap a word while playback is active and force the lookup path to return fallback data.
- Confirm the popup still opens with learner-safe fallback text.
- Use `Add to deck` from that fallback state and confirm a card is still created or deferred with a visible result message.
- Confirm playback highlighting continues to advance on the active block after the lookup and review-capture interaction.

Expected automated coverage:

- `tests/integration/reading-fallback-review-continuity.test.tsx`

## 13. Measure Success Criteria

- Record 5 first-open runs with uncached audio and 5 reopen runs with cached audio.
- Confirm at least 90% of reading sessions open and begin usable study within 10 seconds.
- Confirm word highlighting stays on the spoken token or an adjacent token for at least 95% of timed playback.
- Confirm lookup and add-to-deck first-attempt completion meets the spec success criteria.
- Confirm offline startup, text-first reading, and later review-card provenance retrieval continue to work after migrations.