import type { ExposureLogEntry } from '@sona/domain/content'

import type { SqliteContentLibraryRepository } from '../content-library-repository.js'

export function normalizeReadingExposureEntries(entries: ExposureLogEntry[]): ExposureLogEntry[] {
  const dedupedEntries = new Map<string, ExposureLogEntry>()

  for (const entry of entries) {
    const token = entry.token.trim().replace(/\s+/g, ' ')
    const seenAt = Math.trunc(entry.seenAt)

    if (!entry.blockId || !token || !Number.isFinite(seenAt)) {
      continue
    }

    const normalizedEntry = {
      blockId: entry.blockId,
      token,
      seenAt,
    } satisfies ExposureLogEntry

    dedupedEntries.set(`${normalizedEntry.blockId}::${normalizedEntry.token}::${normalizedEntry.seenAt}`, normalizedEntry)
  }

  return [...dedupedEntries.values()]
}

export function runReadingExposureFlush(repository: SqliteContentLibraryRepository, entries: ExposureLogEntry[]): number {
  return repository.flushExposureLog(normalizeReadingExposureEntries(entries))
}