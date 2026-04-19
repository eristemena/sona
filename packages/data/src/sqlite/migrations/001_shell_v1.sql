CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  checksum TEXT,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);