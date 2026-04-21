import type Database from 'better-sqlite3'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

interface ShellMigration {
  version: number
  name: string
  sql: string
}

const SUPPORTED_MIGRATION_PREFIXES = [
  "shell",
  "content_library",
  "sync_reading_audio",
] as const;

function resolveMigrationDirectory(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const candidateDirectories = [currentDir, path.resolve(currentDir, '../../../src/sqlite/migrations')]

  for (const candidate of candidateDirectories) {
    try {
      const files = readdirSync(candidate)
      if (files.some((file) => file.endsWith('.sql'))) {
        return candidate
      }
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error('Unable to locate shell migration directory.')
}

function loadShellMigrations(): ShellMigration[] {
  const migrationDirectory = resolveMigrationDirectory()

  return readdirSync(migrationDirectory)
    .filter(
      (fileName) =>
        fileName.endsWith(".sql") &&
        SUPPORTED_MIGRATION_PREFIXES.some((prefix) =>
          fileName.includes(prefix),
        ),
    )
    .sort()
    .map((fileName) => {
      const version = Number(fileName.slice(0, 3));

      return {
        version,
        name: fileName.replace(/\.sql$/, ""),
        sql: readFileSync(path.join(migrationDirectory, fileName), "utf8"),
      };
    });
}

export function runShellMigrations(database: Database.Database) {
  database.exec(
    `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE,
        checksum TEXT,
        applied_at TEXT NOT NULL
      );
    `,
  )

  const insertMigration = database.prepare(
    'INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES (?, ?, ?, ?)',
  )
  const appliedMigrationLookup = database.prepare<{ version: number }, { version: number }>(
    'SELECT version FROM schema_migrations WHERE version = @version',
  )

  for (const migration of loadShellMigrations()) {
    if (appliedMigrationLookup.get({ version: migration.version })) {
      continue
    }

    const transaction = database.transaction(() => {
      database.exec(migration.sql)
      insertMigration.run(migration.version, migration.name, null, new Date().toISOString())
    })

    transaction()
  }
}