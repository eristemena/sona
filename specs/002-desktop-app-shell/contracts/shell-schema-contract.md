# Contract: Desktop Shell SQLite Schema

## Purpose

Defines the v1 local SQLite schema required for the desktop shell phase. This schema is intentionally minimal and exists only to support migration bookkeeping and persisted shell settings.

## Table: `schema_migrations`

Columns:
- `version INTEGER PRIMARY KEY NOT NULL`
- `name TEXT NOT NULL UNIQUE`
- `checksum TEXT`
- `applied_at TEXT NOT NULL`

Behavior:
- Insert one row per successful migration.
- Rows are append-only.
- The migration runner reads this table before applying new migrations.

## Table: `settings`

Columns:
- `key TEXT PRIMARY KEY NOT NULL`
- `value_json TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Required key in this phase:
- `appearance.themePreference`

Stored JSON shape for `appearance.themePreference`:

```json
{
  "mode": "system"
}
```

Allowed `mode` values:
- `system`
- `dark`
- `light`

Behavior:
- The setting may be seeded on first launch or lazily created on the first successful write.
- Missing or invalid values must resolve to the shell fallback order: explicit setting, then current system theme, then dark.
- No other settings keys are required for this feature.

## Migration Rules

- The migration runner executes before the renderer requests shell bootstrap state.
- Each migration runs in a transaction.
- Re-running the app after a completed migration must be idempotent.
- Future schema changes must add a new migration rather than editing an applied one in place.