import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { ReviewAudioService } from '../../apps/desktop/src/main/content/review-audio-service.js'
import type { ReviewCardRecord } from '../../packages/domain/src/content/review-card.js'
import { getDefaultOpenAiTtsModel } from '../../apps/desktop/src/main/providers/openai-tts-provider.js'

const tempDirectories: string[] = []

afterEach(() => {
  while (tempDirectories.length > 0) {
    rmSync(tempDirectories.pop()!, { force: true, recursive: true })
  }
})

describe('review sentence audio cache integration', () => {
  it('writes sentence audio by content hash and does not re-synthesize the same sentence twice', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sona-review-audio-cache-'))
    tempDirectories.push(directory)

    const createdAt = 1_716_530_000_000
    const cards = new Map<string, ReviewCardRecord>([
      [
        'card-1',
        createReviewCardFixture({
          id: 'card-1',
          canonicalForm: '천천히',
          surface: '천천히',
          meaning: 'slowly',
          romanization: 'cheoncheonhi',
          sentenceContext: '오늘도 천천히 읽어요',
          sentenceTranslation: 'Even today, I read slowly.',
          sourceBlockId: 'block-1',
          sourceContentItemId: 'item-1',
          sentenceContextHash: 'ctx-1',
          createdAt,
        }),
      ],
      [
        'card-2',
        createReviewCardFixture({
          id: 'card-2',
          canonicalForm: '읽어요',
          surface: '읽어요',
          meaning: 'read',
          romanization: 'ilgeoyo',
          sentenceContext: '오늘도   천천히   읽어요',
          sentenceTranslation: 'Even today, I read slowly.',
          sourceBlockId: 'block-2',
          sourceContentItemId: 'item-2',
          sentenceContextHash: 'ctx-2',
          createdAt,
        }),
      ],
    ])

    const synthesize = vi.fn(async () => ({
      audioData: new Uint8Array([4, 2, 4, 2]),
      contentType: 'audio/mpeg',
      latencyMs: 28,
      estimatedCostUsd: null,
      durationMs: 900,
    }))

    const service = new ReviewAudioService({
      repository: {
        getReviewCard(reviewCardId: string) {
          return cards.get(reviewCardId) ?? null
        },
      } as never,
      settingsRepository: {
        hasOpenAiApiKey() {
          return true
        },
        getReadingAudioMode() {
          return 'learner-slow'
        },
        getReadingAudioVoice() {
          return 'coral'
        },
      } as never,
      cacheDirectory: path.join(directory, 'review-audio-cache'),
      provider: {
        id: 'openai',
        synthesize,
      },
    })

    const firstAsset = await service.ensureSentenceAudio({ reviewCardId: 'card-1' })
    const secondAsset = await service.ensureSentenceAudio({ reviewCardId: 'card-2' })

    expect(synthesize).toHaveBeenCalledTimes(1)
    expect(synthesize).toHaveBeenCalledWith({
      text: '오늘도 천천히 읽어요',
      modelId: getDefaultOpenAiTtsModel(),
      voice: 'coral',
      instructions:
        'Speak slowly, clearly, and naturally for a Korean language learner. Use a calm tone, precise pronunciation, and short pauses between phrases. Keep the delivery warm and human, not robotic or exaggerated.',
      format: 'mp3',
    })
    expect(firstAsset).toMatchObject({
      reviewCardId: 'card-1',
      state: 'ready',
      voice: 'coral',
      modelId: getDefaultOpenAiTtsModel(),
      fromCache: false,
    })
    expect(secondAsset).toMatchObject({
      reviewCardId: 'card-2',
      state: 'ready',
      voice: 'coral',
      modelId: getDefaultOpenAiTtsModel(),
      fromCache: true,
    })
    expect(firstAsset.audioFilePath).toBe(secondAsset.audioFilePath)
    expect(existsSync(firstAsset.audioFilePath!)).toBe(true)
    expect(Array.from(readFileSync(firstAsset.audioFilePath!))).toEqual([4, 2, 4, 2])
  })
})

function createReviewCardFixture(input: {
  id: string
  canonicalForm: string
  surface: string
  meaning: string
  romanization: string
  sentenceContext: string
  sentenceTranslation: string
  sourceBlockId: string
  sourceContentItemId: string
  sentenceContextHash: string
  createdAt: number
}): ReviewCardRecord {
  return {
    id: input.id,
    canonicalForm: input.canonicalForm,
    surface: input.surface,
    meaning: input.meaning,
    grammarPattern: null,
    grammarDetails: null,
    romanization: input.romanization,
    sentenceContext: input.sentenceContext,
    sentenceTranslation: input.sentenceTranslation,
    sourceBlockId: input.sourceBlockId,
    sourceContentItemId: input.sourceContentItemId,
    sentenceContextHash: input.sentenceContextHash,
    fsrsState: 'Review',
    dueAt: input.createdAt,
    stability: 1,
    difficulty: 1,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    lastReviewAt: null,
    activationState: 'active',
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  }
}