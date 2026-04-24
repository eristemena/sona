# Quickstart: Home, Library, and Settings Hub

This feature adds Sona’s first true home dashboard, moves content-library search and filtering to client-side state after the initial catalog load, and introduces a unified settings workflow for provider configuration, voice preference, and daily study goal.

## 1. Prerequisites

- Node.js 20 LTS or newer.
- npm available locally.
- Electron-supported desktop environment.
- Existing local library and review data are helpful for dashboard validation, but empty states must also be tested.
- No network connection is required for dashboard viewing, library browsing, or saving settings. Network is only needed for the optional OpenRouter key check and TTS voice preview.

## 2. Install Dependencies

```bash
npm install
```

If native SQLite bindings drift after a Node or Electron change:

```bash
npm rebuild better-sqlite3
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

## 4. Validate Home Dashboard Summary

Manual checks:

- Launch the app with existing due review cards and confirm the home screen shows the due count immediately.
- Confirm recent vocabulary shows at most five newest review cards.
- Confirm weekly activity renders seven bars using the last seven local calendar days, including zero-value days.
- Confirm streak days are derived from consecutive study-session days with at least one card reviewed.
- Confirm the dashboard shows safe empty states when there is no due work, no recent reading session, or no prior activity.

Expected automated coverage:

- `tests/integration/home-dashboard-summary.test.tsx`
- `tests/integration/home-dashboard-empty-states.test.tsx`
- `tests/contract/window-sona-home-library-settings-contract.test.ts`

## 5. Validate Resume Reading Entry Point

Manual checks:

- Read a content item and save progress.
- Return to the home screen and confirm a `Continue reading` action targets the most recently updated reading session.
- Resume the reading session and confirm the correct content item and active block reopen.

Expected automated coverage:

- `tests/integration/home-dashboard-resume-reading.test.tsx`

## 6. Validate Library Initial Load And Client-Side Querying

Manual checks:

- Open the library and confirm all saved content items load once from the local bridge.
- Type in the search box, switch filters, and change sort order.
- Confirm the visible results update immediately without additional desktop bridge calls after the initial load.
- Confirm imported and generated items remain distinguishable by source labeling.
- Confirm empty-state messaging remains clear when no result matches the current query.

Expected automated coverage:

- `tests/integration/content-library-client-side-querying.test.tsx`
- `tests/integration/content-library-empty-states.test.tsx`

## 7. Validate Import Dialog

Manual checks:

- Open the import dialog from the library.
- Confirm the dialog supports selecting a local SRT file and pasting article text.
- Confirm keyboard focus stays trapped within the dialog and returns to the triggering control when the dialog closes.
- Import one subtitle file and one pasted article, then confirm both appear in the library without reloading the app.

Expected automated coverage:

- `tests/integration/library-import-dialog-a11y.test.tsx`
- `tests/integration/library-import-dialog-submit.test.tsx`

## 8. Validate Settings Persistence, Provider Test, And Voice Preview

Manual checks:

- Open settings and confirm theme controls remain intact.
- Save an OpenRouter API key, a daily study goal, and a TTS voice selection.
- Trigger the explicit key-validation action and confirm it calls the OpenRouter models endpoint and reports success only on HTTP 200.
- Trigger the voice preview action and confirm the phrase `안녕하세요, 소나입니다.` is synthesized with the selected voice and plays immediately.
- Relaunch the app and confirm the saved daily goal, provider-key configured state, and selected voice persist.
- Repeat the same flow offline and confirm settings can still be edited and saved, with validation and preview showing graceful failure messages rather than blocking the screen.

Expected automated coverage:

- `tests/integration/settings-study-preferences-form.test.tsx`
- `tests/integration/settings-openrouter-validation.test.ts`
- `tests/integration/settings-voice-preview.test.tsx`
- `tests/contract/shell-schema-contract.test.ts`

## 9. Validate Study Session Recording

Manual checks:

- Complete a review session and confirm exactly one `study_sessions` row is written when the session ends.
- Confirm the row captures cards reviewed and minutes studied.
- Confirm the next dashboard load reflects the new session in weekly activity and streak calculations.

Expected automated coverage:

- `tests/integration/study-session-writeback.test.ts`
- `tests/integration/home-dashboard-streak-calculation.test.ts`

## 10. Measure Success Criteria

- Confirm learners can identify today’s due count and next action within 10 seconds of app launch.
- Confirm learners can start review or resume reading from the home screen in no more than 2 interactions.
- Confirm a known library item can be located by client-side search or filter in under 30 seconds.
- Confirm settings changes persist across restart and remain editable offline.