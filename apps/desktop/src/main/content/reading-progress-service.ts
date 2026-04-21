import type { ReadingSessionProgress, SaveReadingProgressInput } from '@sona/domain/content'

import type { SqliteContentLibraryRepository } from '@sona/data/sqlite/content-library-repository'

export class ReadingProgressService {
  constructor(private readonly repository: SqliteContentLibraryRepository) {}

  getProgress(contentItemId: string): ReadingSessionProgress | null {
    return this.repository.getReadingSession(contentItemId)?.progress ?? null
  }

  saveProgress(input: SaveReadingProgressInput): void {
    this.repository.saveReadingProgress(input)
  }
}