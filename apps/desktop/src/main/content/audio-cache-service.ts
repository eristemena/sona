import { createHash, randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { PersistedReadingAudioAsset, ReadingAudioAsset, ReadingBlock, WordTiming } from '@sona/domain/content'
import type { ReadingAudioMode, ReadingAudioVoice } from '@sona/domain/settings/reading-audio-preference'

import type { SqliteContentLibraryRepository } from '@sona/data/sqlite/content-library-repository'
import type { TtsProviderAdapter } from '@sona/integrations/tts/provider-adapter'
import { getDefaultOpenAiTtsModel } from '../providers/openai-tts-provider.js'
import { buildContentAddressedAudioFileName, hasCachedAudioFile } from './audio-file-cache.js'

const DEFAULT_MODEL_ID = getDefaultOpenAiTtsModel()
const DEFAULT_VOICE: ReadingAudioVoice = 'alloy'
const DEFAULT_AUDIO_FORMAT = 'mp3'
const DEFAULT_READING_AUDIO_MODE: ReadingAudioMode = 'standard'
const AUDIO_PROFILE_VERSION = 'v1'

interface AudioCacheServiceOptions {
  repository: SqliteContentLibraryRepository
  cacheDirectory: string
  provider?: TtsProviderAdapter | null
  getReadingAudioMode?: () => ReadingAudioMode
  getReadingAudioVoice?: () => ReadingAudioVoice
}

export class AudioCacheService {
  private readonly cacheDirectory: string

  constructor(private readonly options: AudioCacheServiceOptions) {
    this.cacheDirectory = options.cacheDirectory
    mkdirSync(this.cacheDirectory, { recursive: true })
  }

  getCacheDirectory(): string {
    return this.cacheDirectory
  }

  getCachedAsset(blockId: string): ReadingAudioAsset | null {
    return this.options.repository.getBlockAudioAsset(blockId)
  }

  async ensureBlockAudio(blockId: string): Promise<ReadingAudioAsset> {
    const block = this.options.repository.getReadingBlock(blockId)
    if (!block) {
      return createUnavailableAsset(blockId, 'This reading block is no longer available.')
    }

    const readingAudioMode = this.options.getReadingAudioMode?.() ?? DEFAULT_READING_AUDIO_MODE
    const readingAudioVoice = this.options.getReadingAudioVoice?.() ?? DEFAULT_VOICE
    const textHash = hashReadingBlockText(block.korean, readingAudioMode)
    this.pruneInvalidatedAssets(blockId, {
      modelId: DEFAULT_MODEL_ID,
      voice: readingAudioVoice,
      textHash,
    })

    const cached = this.options.repository.getBlockAudioAssetForCacheKey(blockId, DEFAULT_MODEL_ID, readingAudioVoice, textHash)
    if (cached?.state === 'ready' && cached.audioFilePath) {
      this.options.repository.markBlockAudioAssetAccessed(blockId, DEFAULT_MODEL_ID, readingAudioVoice, textHash, Date.now())
      return cached
    }

    const contentFileName = buildContentAddressedAudioFileName(block.korean, DEFAULT_MODEL_ID, readingAudioMode, readingAudioVoice)
    const sharedFilePath = this.resolveCachePath(contentFileName)

    if (hasCachedAudioFile(sharedFilePath)) {
      const durationMs = estimateDurationMs(block)
      const timings = resolveWordTimings(block, undefined, durationMs)
      const asset: ReadingAudioAsset = {
        blockId,
        state: 'ready',
        audioFilePath: sharedFilePath,
        durationMs,
        modelId: DEFAULT_MODEL_ID,
        voice: readingAudioVoice,
        timings,
        fromCache: true,
      }
      this.savePersistedAsset(block, textHash, asset)
      return asset
    }

    if (cached && cached.state !== 'ready') {
      return cached
    }

    if (!this.options.provider) {
      const unavailable = createUnavailableAsset(blockId, 'Hosted block audio is unavailable. Reading stays in text-first mode.')
      this.savePersistedAsset(block, textHash, unavailable)
      return unavailable
    }

    this.savePersistedAsset(block, textHash, {
      blockId,
      state: 'pending',
      audioFilePath: null,
      durationMs: null,
      modelId: DEFAULT_MODEL_ID,
      voice: readingAudioVoice,
      timings: [],
      fromCache: false,
    })

    try {
      const startedAt = Date.now()
      const response = await this.options.provider.synthesize({
        text: block.korean,
        modelId: DEFAULT_MODEL_ID,
        voice: readingAudioVoice,
        instructions: buildSpeechInstructions(readingAudioMode),
        format: DEFAULT_AUDIO_FORMAT,
      })

      await writeFile(sharedFilePath, response.audioData)

      const durationMs = response.durationMs ?? estimateDurationMs(block)
      const timings = resolveWordTimings(block, response.timings, durationMs)
      const asset: ReadingAudioAsset = {
        blockId,
        state: 'ready',
        audioFilePath: sharedFilePath,
        durationMs,
        modelId: DEFAULT_MODEL_ID,
        voice: readingAudioVoice,
        timings,
        fromCache: false,
      }

      this.savePersistedAsset(block, textHash, asset, startedAt + response.latencyMs)
      return asset
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Block audio could not be created right now. Reading stays in text-first mode.'
      const state = message.toLowerCase().includes('unavailable') || message.toLowerCase().includes('api key') ? 'unavailable' : 'failed'
      const asset: ReadingAudioAsset = {
        blockId,
        state,
        audioFilePath: null,
        durationMs: null,
        modelId: DEFAULT_MODEL_ID,
        voice: readingAudioVoice,
        timings: [],
        failureMessage: message,
        fromCache: false,
      }
      this.savePersistedAsset(block, textHash, asset)
      return asset
    }
  }

  saveAsset(asset: PersistedReadingAudioAsset): void {
    this.options.repository.saveBlockAudioAsset(asset)
  }

  resolveCachePath(fileName: string): string {
    return path.join(this.cacheDirectory, fileName)
  }

  private savePersistedAsset(block: ReadingBlock, textHash: string, asset: ReadingAudioAsset, timestamp = Date.now()): void {
    this.saveAsset({
      id: randomUUID(),
      blockId: block.id,
      provider: 'openai',
      modelId: asset.modelId,
      voice: asset.voice,
      textHash,
      audioFilePath: asset.audioFilePath,
      timingFormat: 'verbose_json',
      timings: asset.timings,
      durationMs: asset.durationMs,
      state: asset.state,
      failureReason: asset.failureMessage ?? null,
      generatedAt: asset.state === 'ready' ? timestamp : null,
      lastAccessedAt: timestamp,
    })
  }

  private pruneInvalidatedAssets(
    blockId: string,
    activeCacheKey: { modelId: string; voice: string; textHash: string },
  ): void {
    const staleAssets = this.options.repository
      .listPersistedBlockAudioAssets(blockId)
      .filter(
        (asset) =>
          asset.modelId !== activeCacheKey.modelId || asset.voice !== activeCacheKey.voice || asset.textHash !== activeCacheKey.textHash,
      )

    if (staleAssets.length === 0) {
      return
    }

    this.options.repository.deleteBlockAudioAssetsForBlockExcept(
      blockId,
      activeCacheKey.modelId,
      activeCacheKey.voice,
      activeCacheKey.textHash,
    )
  }
}

function createUnavailableAsset(blockId: string, failureMessage: string): ReadingAudioAsset {
  return {
    blockId,
    state: 'unavailable',
    audioFilePath: null,
    durationMs: null,
    modelId: DEFAULT_MODEL_ID,
    voice: DEFAULT_VOICE,
    timings: [],
    failureMessage,
    fromCache: false,
  }
}

function hashReadingBlockText(text: string, mode: ReadingAudioMode): string {
  return createHash('sha256')
    .update(`${AUDIO_PROFILE_VERSION}:${mode}:${text.trim().replace(/\s+/g, ' ')}`)
    .digest('hex')
}

function buildSpeechInstructions(mode: ReadingAudioMode): string {
  if (mode === 'learner-slow') {
    return 'Speak slowly, clearly, and naturally for a Korean language learner. Use a calm tone, precise pronunciation, and short pauses between phrases. Keep the delivery warm and human, not robotic or exaggerated.'
  }

  return 'Speak clearly and naturally in Korean with a calm, conversational tone and precise pronunciation.'
}

function estimateDurationMs(block: ReadingBlock): number {
  const tokenCount = block.tokens.length
  if (tokenCount > 0) {
    return Math.max(1200, tokenCount * 420)
  }

  return Math.max(1400, Array.from(block.korean).length * 180)
}

function resolveWordTimings(
  block: ReadingBlock,
  providerTimings: Array<{ surface: string; startMs: number; endMs: number }> | undefined,
  durationMs: number,
): WordTiming[] {
  const normalizedProviderTimings = normalizeProviderTimings(block, providerTimings)
  if (normalizedProviderTimings.length > 0) {
    return normalizedProviderTimings
  }

  if (block.tokens.length === 0 || durationMs <= 0) {
    return []
  }

  const totalWeight = block.tokens.reduce((sum, token) => sum + Math.max(1, Array.from(token.surface.trim()).length), 0)
  let cursor = 0

  return block.tokens.map((token, index) => {
    const weight = Math.max(1, Array.from(token.surface.trim()).length)
    const sliceDuration = index === block.tokens.length - 1 ? durationMs - cursor : Math.max(120, Math.round((durationMs * weight) / totalWeight))
    const startMs = cursor
    const endMs = Math.min(durationMs, startMs + sliceDuration)
    cursor = endMs

    return {
      tokenIndex: token.index,
      surface: token.surface,
      startMs,
      endMs: endMs > startMs ? endMs : startMs + 120,
    }
  })
}

function normalizeProviderTimings(
  block: ReadingBlock,
  providerTimings: Array<{ surface: string; startMs: number; endMs: number }> | undefined,
): WordTiming[] {
  if (!providerTimings || providerTimings.length === 0 || providerTimings.length !== block.tokens.length) {
    return []
  }

  const timings = providerTimings
    .map((timing, index) => ({
      tokenIndex: block.tokens[index]?.index ?? index,
      surface: timing.surface,
      startMs: timing.startMs,
      endMs: timing.endMs,
    }))
    .filter((timing) => timing.endMs > timing.startMs)

  return timings.length === block.tokens.length ? timings : []
}