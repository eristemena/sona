# Quickstart: Add Content Library

This feature is in planning. The commands and checks below define the expected validation workflow once implementation is complete.

## 1. Prerequisites

- Node.js 20 LTS or newer.
- npm available locally.
- A desktop environment supported by the current Electron workflow.
- Optional provider credentials configured locally only if generation or scrape testing requires them.

## 2. Install Dependencies

```bash
npm install
```

## 3. Core Validation Commands

Run the full automated suite:

```bash
npm test
```

Run workspace typechecks:

```bash
npm run typecheck
```

Build the desktop and renderer workspaces:

```bash
npm run build
```

Start the desktop app for manual validation:

```bash
npm run dev:desktop
```

## 4. Validate Subtitle Import

Manual checks:

- Import a supported Korean SRT file from the desktop app.
- Confirm a new Content Library card appears with subtitle type, Korean difficulty badge, and a recognizable title.
- Confirm the imported item can be reopened and its sentence blocks preserve subtitle timing offsets.
- Confirm malformed subtitle input shows a safe error and does not create a partial library item.

Expected automated coverage:

- `tests/contract/content-library-schema-contract.test.ts`
- `tests/integration/subtitle-import-flow.test.ts`

## 5. Validate Article Paste and Scrape

Manual checks:

- Paste Korean article text and save it as a library item.
- Confirm the library card appears under the Articles filter and participates in search.
- Disable network access and confirm article paste still works.
- Attempt a scrape with a reachable URL and confirm the article saves as an item.
- Attempt a scrape while offline or with an invalid URL and confirm no partial record is created.

Expected automated coverage:

- `tests/integration/article-paste-flow.test.tsx`
- `tests/integration/article-scrape-fallback.test.ts`

## 6. Validate Generated Practice Sentences

Manual checks:

- Request generated practice sentences for a topic and a target difficulty.
- Confirm the saved item appears under the Generated filter with the correct or validated difficulty badge.
- Confirm drift that cannot be accepted or relabeled does not create a saved item.
- Confirm generation failure leaves the rest of the library usable.

Expected automated coverage:

- `tests/contract/window-sona-content-library-contract.test.ts`
- `tests/integration/generated-content-difficulty-validation.test.ts`

## 7. Validate Content Library Browsing and Deletion

Manual checks:

- Confirm the library grid renders All, Articles, Subtitles, and Generated pill filters.
- Confirm the search input narrows results by title or saved text.
- Confirm each card shows type and Korean difficulty badge.
- Delete an item and confirm it disappears immediately and stays deleted after relaunch.

Expected automated coverage:

- `tests/integration/content-library-browse.test.tsx`
- `tests/integration/content-library-delete.test.tsx`
- `tests/integration/review-load-implications.test.ts`

## 8. Offline Validation

Manual checks:

- Launch the app with network access disabled.
- Confirm library browsing, search, deletion, subtitle import, and article paste still work.
- Confirm scrape and generation failures are explicit and non-destructive.

Expected automated coverage:

- `tests/integration/offline-content-library-startup.test.ts`
- `tests/integration/offline-no-key-feasibility.test.ts`

## 9. Provenance and Integrity Validation

Manual checks:

- Inspect saved library items and confirm subtitle, article, and generated origins remain distinguishable.
- Confirm generated items retain topic and difficulty provenance.
- Confirm subtitle-derived items preserve their file-linked structural IDs and timing offsets.

Expected automated coverage:

- `tests/integration/provenance-artifact-integrity.test.ts`
- `tests/contract/content-library-schema-contract.test.ts`