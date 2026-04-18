import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

export interface SqliteConnectionOptions {
  databasePath?: string
  checkpointPolicy?: 'passive' | 'full' | 'restart' | 'truncate'
}

export function createSqliteConnection(options: SqliteConnectionOptions = {}): Database.Database {
  const databasePath = options.databasePath ?? path.join(process.cwd(), 'artifacts', 'sqlite', 'sona.db')
  mkdirSync(path.dirname(databasePath), { recursive: true })
  const database = new Database(databasePath)

  database.pragma('journal_mode = WAL')
  database.pragma('foreign_keys = ON')
  database.pragma('synchronous = NORMAL')

  if (options.checkpointPolicy) {
    database.pragma(`wal_checkpoint(${options.checkpointPolicy.toUpperCase()})`)
  }

  return database
}
