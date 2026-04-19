# Quickstart: Desktop App Shell

This feature is a planning-first shell phase. The commands below describe the expected local workflow once implementation is added for the desktop shell, preload bridge, migrations, and packaging.

## 1. Prerequisites

- Node.js 20 LTS or newer.
- npm available locally.
- macOS desktop environment for the first packaging and launch verification pass.

## 2. Install Dependencies

```bash
npm install
```

Expected feature dependencies added during implementation:
- `electron-builder` in the desktop workspace
- Tailwind CSS and shadcn/ui in the renderer workspace
- Shared typing support for the preload bridge and renderer contract

## 3. Run the Shell Locally

Expected development workflow after implementation:

```bash
npm run build --workspace @sona/renderer
npm run build --workspace @sona/desktop
```

Recommended developer flow to add during implementation:
- A renderer development command for iterative shell styling.
- A desktop launch command that opens Electron against the static or development renderer output.

## 4. Validate First Launch Behavior

On first launch, verify that:
- The SQLite database is created locally.
- The migration runner creates the v1 schema before settings are requested.
- The shell opens with the Sona app name, persistent sidebar, and empty main area.
- The resolved theme follows the precedence order: saved preference, then system theme, then dark fallback.

## 5. Validate Theme Persistence

Expected manual check after implementation:
- Change the theme preference from Settings.
- Close the app.
- Relaunch the app.
- Confirm the same preference is restored from the `settings` table.

## 6. Package the Desktop App

Expected packaging workflow after implementation:

```bash
npm run build
```

Target implementation should add an explicit package command for electron-builder that emits a macOS desktop bundle and installer artifact.

## 7. Validate Offline Behavior

- Launch the packaged or local app with network access disabled.
- Confirm the shell still opens correctly.
- Confirm theme reads and writes still work because they rely only on local SQLite and desktop runtime services.

## 8. Latest Verification Notes

- 2026-04-19: Planning artifacts created for the desktop shell feature.
- 2026-04-19: No implementation commands or packaging output exist yet for this feature phase.