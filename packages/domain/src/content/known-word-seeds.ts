import topikICore from './known-word-seeds/topik-i-core.json' with { type: 'json' }
import topikIICore from './known-word-seeds/topik-ii-core.json' with { type: 'json' }

import type { KnownWordSeedPack } from './known-word.js'

export const KNOWN_WORD_SEED_PACKS = [topikICore, topikIICore] as KnownWordSeedPack[]

export const KNOWN_WORD_SEED_PACKS_BY_ID = new Map(
  KNOWN_WORD_SEED_PACKS.map((pack) => [pack.id, pack] as const),
)