# Data Model: Desktop App Shell

## Schema Migration Record

Purpose: Tracks which SQLite migrations have been applied so first launch and later upgrades can initialize the local schema safely.

Fields:
- `version`: Integer primary key for migration ordering.
- `name`: Stable migration name.
- `checksum`: Optional hash or signature used to detect migration drift.
- `appliedAt`: ISO-8601 timestamp recorded when the migration completes.

Validation rules:
- `version` must be unique and monotonic.
- `name` must be unique.
- A migration record is written only after the migration transaction succeeds.

State transitions:
- `pending` -> `applied`
- `applied` -> `superseded` only when a later migration changes the schema

## Setting Row

Purpose: Stores local desktop configuration values needed by the shell, beginning with the learner's theme preference.

Fields:
- `key`: Stable settings key, such as `appearance.themePreference`.
- `valueJson`: JSON-encoded payload for the setting value.
- `updatedAt`: ISO-8601 timestamp for the last local update.

Validation rules:
- `key` must be unique.
- `valueJson` must parse as valid JSON.
- Unknown keys are rejected by the shell settings service in this phase.

Relationships:
- One `Setting Row` stores one configuration value.
- The shell reads one `Setting Row` for theme resolution during bootstrap.

## Theme Preference

Purpose: Represents the learner-facing appearance choice used to resolve the shell theme at launch and during runtime changes.

Fields:
- `mode`: One of `system`, `dark`, or `light`.
- `source`: One of `stored-setting`, `default`, or `invalid-setting-fallback`.
- `resolvedTheme`: One of `dark` or `light` after applying the precedence rules.

Validation rules:
- `mode` must be one of the supported enum values.
- `resolvedTheme` is derived, never stored independently.
- Invalid stored values resolve through the fallback path and must not crash startup.

State transitions:
- `default(system-aware)` -> `stored-manual-override`
- `stored-manual-override` -> `stored-system-following`
- `invalid-setting-fallback` -> `stored-manual-override` after the next valid save

## Navigation Destination

Purpose: Defines one top-level shell destination rendered in the persistent sidebar.

Fields:
- `id`: One of `dashboard`, `library`, `review`, or `settings`.
- `label`: Learner-visible sidebar text.
- `order`: Stable sidebar position.
- `enabled`: Boolean indicating whether the destination is available to render.

Validation rules:
- Exactly four destinations exist in this phase.
- `order` values must be unique and contiguous.
- Labels must match the specification's required names.

Relationships:
- The `Application Shell` renders many `Navigation Destination` records.
- One destination is active at a time.

## Application Shell Bootstrap State

Purpose: Bundles the data the renderer needs on first paint to display the app name, sidebar navigation, and resolved theme without direct database access.

Fields:
- `appName`: Constant value `Sona`.
- `navigation`: Ordered list of `Navigation Destination` items.
- `themePreference`: Current `Theme Preference` mode.
- `resolvedTheme`: Final active theme used by the renderer.
- `systemTheme`: Current OS theme signal when available.

Validation rules:
- `appName` is required.
- `navigation` must contain the four destinations defined above.
- `resolvedTheme` must always be present even when a stored setting is missing or invalid.

Relationships:
- Produced by the preload bridge from main-process services.
- Consumed by the renderer during initial shell hydration.