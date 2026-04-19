# Quickstart: Desktop App Shell

This shell slice is implemented. The commands below reflect the current local workflow and the validation that has already been completed.

## 1. Prerequisites

- Node.js 20 LTS or newer.
- npm available locally.
- macOS desktop environment for the current packaging path.

## 2. Install Dependencies

```bash
npm install
```

## 3. Core Validation Commands

Run the full automated suite:

```bash
npm test
```

Build all workspaces:

```bash
npm run build
```

Package the desktop app and then restore `better-sqlite3` for the local Node runtime:

```bash
npm run package:desktop
```

## 4. Local Development Commands

Start the renderer dev server for renderer-only iteration:

```bash
npm run dev:renderer
```

Launch the desktop shell from the desktop workspace:

```bash
npm run dev:desktop
```

Current note: the Electron shell loads the exported renderer by default. The renderer dev server command exists for UI iteration, but there is not yet a combined hot-reload desktop workflow in this feature slice.

## 5. Validate First Launch Behavior

Manual checks for a clean local profile:

- Confirm the app creates a local SQLite database at Electron `userData` on first launch.
- Confirm the migration runner creates `schema_migrations` and `settings` before shell settings are read.
- Confirm the window opens with the Sona name, persistent sidebar, and empty main content frame.
- Confirm the resolved theme uses this precedence order: saved preference, then system theme, then dark fallback.
- Confirm an interrupted previous session still relaunches into the same shell structure.

Automated coverage:

- `tests/integration/desktop-shell-launch.test.ts`
- `tests/integration/offline-shell-startup.test.ts`

## 6. Validate Sidebar Navigation

Manual checks:

- Use pointer input to switch between Dashboard, Library, Review, and Settings.
- Use keyboard navigation with `ArrowDown` and `ArrowUp` while the sidebar retains visible focus.
- Confirm the sidebar remains persistent while the main panel updates the active destination state.

Automated coverage:

- `tests/integration/sidebar-navigation.test.tsx`
- `tests/integration/sidebar-keyboard-navigation.test.tsx`

## 7. Validate Theme Persistence

Manual checks:

- Open Settings and switch between System, Dark, and Light.
- Close the app and relaunch it.
- Confirm the same preference is restored from the local `settings` table.
- Confirm that missing or invalid settings fall back to system theme when available and otherwise to dark mode.

Automated coverage:

- `tests/integration/theme-preference-persistence.test.ts`
- `tests/integration/theme-resolution-fallback.test.ts`

## 8. Packaging Output

Successful packaging output is written under:

```text
dist/electron-builder/mac-arm64
```

Current packaging warnings:

- The default Electron icon is still in use.
- macOS code signing is skipped locally because no valid Developer ID Application identity is configured.

## 9. Offline Validation

Validated manual checks:

- Launch the packaged app with network access disabled.
- Confirm the shell still opens correctly.
- Confirm theme reads and writes still work because they depend only on local SQLite and main-process desktop services.

## 10. Latest Verification Notes

- 2026-04-19: `npm test` passed with 15 test files and 20 tests green.
- 2026-04-19: `npm run build` passed for `@sona/domain`, `@sona/data`, `@sona/renderer`, and `@sona/desktop`.
- 2026-04-19: `npm run package:desktop` completed successfully and produced `dist/electron-builder/mac-arm64`.
- 2026-04-19: The packaged app smoke launch succeeded via `./dist/electron-builder/mac-arm64/Sona.app/Contents/MacOS/Sona` after bundling workspace runtime packages, shell migration SQL, and an Electron-targeted `better-sqlite3` build into the app.
- 2026-04-19: Manual packaged offline validation also passed; the packaged shell launched correctly without network access and local theme persistence continued to work.
- 2026-04-19: The package workflow now rebuilds `better-sqlite3` for the local Node runtime after packaging so repository tests remain runnable.