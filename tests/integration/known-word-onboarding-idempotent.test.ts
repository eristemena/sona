import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { KnownWordOnboardingService } from '../../apps/desktop/src/main/content/known-word-onboarding-service.js'
import { createSqliteConnection } from '../../packages/data/src/sqlite/connection.js'
import { SqliteContentLibraryRepository } from '../../packages/data/src/sqlite/content-library-repository.js'
import { runShellMigrations } from '../../packages/data/src/sqlite/migrations/run-migrations.js'
import { SqliteSettingsRepository } from '../../packages/data/src/sqlite/settings-repository.js'

const tempDirectories: string[] = []

afterEach(() => {
  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop()!, { force: true, recursive: true })
  }
})

describe('known-word onboarding idempotent completion', () => {
  it('does not reinsert duplicate known words and keeps onboarding marked complete', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sona-known-word-onboarding-'))
    tempDirectories.push(directory)

    const database = createSqliteConnection({ databasePath: path.join(directory, 'sona.db') })
    runShellMigrations(database)

    const repository = new SqliteContentLibraryRepository(database)
    const settingsRepository = new SqliteSettingsRepository(database)
    const service = new KnownWordOnboardingService({
      repository,
      settingsRepository,
      now: () => 1_716_530_000_000,
    })

    expect(service.getStatus()).toMatchObject({
      shouldOnboard: true,
      completedAt: null,
    })

    const firstResult = service.complete({
      seedPackId: 'topik-i-core',
      selectedWords: [
        { canonicalForm: '저', surface: '저' },
        { canonicalForm: '우리', surface: '우리' },
      ],
    })

    const secondResult = service.complete({
      seedPackId: 'topik-i-core',
      selectedWords: [
        { canonicalForm: '저', surface: '저' },
        { canonicalForm: '우리', surface: '우리' },
      ],
    })

    expect(firstResult.insertedCount).toBe(2)
    expect(secondResult.insertedCount).toBe(0)
    expect(repository.countKnownWords()).toBe(2)
    expect(service.getStatus()).toMatchObject({
      shouldOnboard: false,
      completedAt: 1_716_530_000_000,
    })

    database.close()
  })
})