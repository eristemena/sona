# Quickstart: Add Content Library

This feature is in planning. The commands and checks below define the expected validation workflow once implementation is complete.

## 1. Prerequisites

- Node.js 20 LTS or newer.
- npm available locally.
- A desktop environment supported by the current Electron workflow.
- Optional provider credentials configured locally only for AI generation testing.

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

## 3a. Usability Measurement Protocol

- Use a clean local profile with no previously saved content for first-attempt timing checks.
- For SC-001 and SC-002, record 5 first-attempt runs. Start timing when the learner opens the add-content flow and stop when the saved item appears in the Content Library.
- For SC-004, build a mixed library of at least 10 items spanning subtitle, article, and generated content, then record the percent of items whose source type is correctly identified by the learner.
- Record pass or fail against each success criterion in the validation notes together with the measured times or identification percentage.

## 4. Validate Subtitle Import

Manual checks:

- Import a supported Korean SRT file from the desktop app.
- Confirm a new Content Library card appears with subtitle type, Korean difficulty badge, and a recognizable title.
- Confirm the imported item can be reopened and its sentence blocks preserve subtitle timing offsets.
- Confirm malformed subtitle input shows a safe error and does not create a partial library item.

Expected automated coverage:

- `tests/contract/content-library-schema-contract.test.ts`
- `tests/integration/subtitle-import-flow.test.ts`
- `tests/integration/subtitle-import-error.test.ts`
- `tests/integration/provenance-artifact-integrity.test.ts`

## 5. Validate Article Paste and Scrape

Manual checks:

- Paste Korean article text and save it as a library item.
- Confirm the library card appears under the Articles filter and participates in search.
- Disable network access and confirm article paste still works.
- Attempt a scrape with a reachable URL and confirm the article saves as an item.
- Attempt to scrape an article that matches existing saved content and confirm the app warns before save and only continues after explicit confirmation.
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
- `tests/integration/offline-no-key-feasibility.test.ts`
- `tests/integration/provider-fallback-no-key.test.ts`

## 7. Validate Content Library Browsing and Deletion

Manual checks:

- Confirm the library grid renders All, Articles, Subtitles, and Generated pill filters.
- Confirm the search input narrows results by title or source-derived text.
- Confirm each card shows type and Korean difficulty badge.
- Confirm each card exposes provenance details identifying the source file, article source, or generation request.
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

## 9. Import To Study To Review Boundary Validation

Manual checks:

- Import one subtitle item, one pasted article item, or one generated item into the library.
- Inspect the saved item in the library and confirm its provenance details and sentence-level content make it study-ready for later reading/listening features.
- Navigate to the Review destination immediately after import and confirm no new review items or hidden scheduled work were created automatically.
- Confirm the imported content remains available in the library after this review-boundary check.

Expected automated coverage:

- `tests/integration/offline-content-library-startup.test.ts`
- `tests/integration/import-review-boundary.test.ts`

## 10. Provenance, Integrity, and Duplicate Validation

Manual checks:

- Inspect saved library items and confirm subtitle, article, and generated origins remain distinguishable.
- Confirm generated items retain topic and difficulty provenance.
- Confirm relabeled generated items show validated difficulty in the library while preserving requested difficulty in provenance details.
- Confirm subtitle-derived items preserve their file-linked structural IDs and timing offsets.
- Attempt to save duplicate content and confirm the app warns before save and only continues after explicit confirmation.

Expected automated coverage:

- `tests/integration/provenance-artifact-integrity.test.ts`
- `tests/contract/content-library-schema-contract.test.ts`
- `tests/integration/subtitle-import-flow.test.ts`
- `tests/integration/subtitle-import-error.test.ts`
- `tests/integration/article-paste-flow.test.tsx`
- `tests/integration/generated-content-difficulty-validation.test.ts`
- `tests/integration/provider-fallback-no-key.test.ts`