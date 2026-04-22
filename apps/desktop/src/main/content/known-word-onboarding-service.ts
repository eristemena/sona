import {
  normalizeKnownWord,
} from '@sona/domain/content/known-word'
import type {
  CompleteKnownWordOnboardingInput,
  CompleteKnownWordOnboardingResult,
  KnownWordOnboardingStatus,
  KnownWordSeedPack,
} from '@sona/domain/content/known-word'
import { KNOWN_WORD_SEED_PACKS } from '@sona/domain/content/known-word-seeds'
import type { SqliteContentLibraryRepository } from '@sona/data/sqlite/content-library-repository'
import type { SqliteSettingsRepository } from '@sona/data/sqlite/settings-repository'

interface KnownWordOnboardingServiceOptions {
  repository: SqliteContentLibraryRepository
  settingsRepository: SqliteSettingsRepository
  now?: () => number
}

const SEED_PACKS = KNOWN_WORD_SEED_PACKS as KnownWordSeedPack[]

export class KnownWordOnboardingService {
  private readonly now: () => number

  constructor(private readonly options: KnownWordOnboardingServiceOptions) {
    this.now = options.now ?? (() => Date.now())
  }

  getStatus(): KnownWordOnboardingStatus {
    const onboardingRecord = this.options.settingsRepository.getKnownWordOnboardingRecord()

    return {
      shouldOnboard:
        this.options.repository.countKnownWords() === 0 && onboardingRecord === null,
      completedAt: onboardingRecord?.completedAt ?? null,
      availableSeedPacks: SEED_PACKS.map((pack) => ({
        id: pack.id,
        label: pack.label,
        description: pack.description,
        wordCount: pack.words.length,
      })),
    }
  }

  complete(
    input: CompleteKnownWordOnboardingInput,
  ): CompleteKnownWordOnboardingResult {
    const selectedSeedPack = SEED_PACKS.find((pack) => pack.id === input.seedPackId)
    if (!selectedSeedPack) {
      throw new Error(`Known-word seed pack ${input.seedPackId} was not found.`)
    }

    const onboardingCompletedAt = this.now()
    let insertedCount = 0

    for (const word of input.selectedWords) {
      const canonicalForm = normalizeKnownWord(word.canonicalForm)
      const existing = this.options.repository.getKnownWord(canonicalForm)
      this.options.repository.saveKnownWord({
        canonicalForm,
        surface: normalizeKnownWord(word.surface),
        source: 'topik_seed',
        sourceDetail: selectedSeedPack.id,
        createdAt: existing?.createdAt ?? onboardingCompletedAt,
        updatedAt: onboardingCompletedAt,
      })
      if (!existing) {
        insertedCount += 1
      }
    }

    this.options.settingsRepository.setKnownWordOnboardingRecord({
      completed: true,
      completedAt: onboardingCompletedAt,
      selectedSeedPack: selectedSeedPack.id,
    })

    return {
      insertedCount,
      onboardingCompletedAt,
    }
  }
}