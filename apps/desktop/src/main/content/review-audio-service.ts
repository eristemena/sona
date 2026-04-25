import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { EnsureReviewSentenceAudioInput, ReviewSentenceAudioAsset } from '@sona/domain/content/review-card'
import type { ReadingAudioMode, ReadingAudioVoice } from '@sona/domain/settings/reading-audio-preference'

import type { SqliteContentLibraryRepository } from '@sona/data/sqlite/content-library-repository'
import type { SqliteSettingsRepository } from '@sona/data/sqlite/settings-repository'
import type { TtsProviderAdapter } from '@sona/integrations/tts/provider-adapter'
import { getDefaultOpenAiTtsModel } from '../providers/openai-tts-provider.js'
import { buildContentAddressedAudioFileName, hasCachedAudioFile } from './audio-file-cache.js'

const REVIEW_AUDIO_MODEL_ID = getDefaultOpenAiTtsModel()
const REVIEW_AUDIO_FORMAT = 'mp3'
const DEFAULT_READING_AUDIO_VOICE: ReadingAudioVoice = 'alloy'

interface ReviewAudioServiceOptions {
  repository: SqliteContentLibraryRepository
  settingsRepository: SqliteSettingsRepository
  cacheDirectory: string
  provider?: TtsProviderAdapter | null
}

export class ReviewAudioService {
  private readonly cacheDirectory: string

  constructor(private readonly options: ReviewAudioServiceOptions) {
    this.cacheDirectory = options.cacheDirectory
    mkdirSync(this.cacheDirectory, { recursive: true })
  }

  async ensureSentenceAudio(
    input: EnsureReviewSentenceAudioInput,
  ): Promise<ReviewSentenceAudioAsset> {
    const card = this.options.repository.getReviewCard(input.reviewCardId)
    if (!card) {
      return createUnavailableAsset(input.reviewCardId, 'This review card is no longer available.')
    }

    const sentence = normalizeSentence(card.sentenceContext)
    if (!sentence) {
      return createUnavailableAsset(card.id, 'Source sentence audio is unavailable for this review card.')
    }

    if (!this.options.provider || !this.options.settingsRepository.hasOpenAiApiKey()) {
      return createUnavailableAsset(card.id, 'Source sentence audio is unavailable without an OpenAI API key in settings.')
    }

    const readingAudioMode = this.options.settingsRepository.getReadingAudioMode()
    const voice = this.options.settingsRepository.getReadingAudioVoice()
    const filePath = this.resolveCachePath(buildContentAddressedAudioFileName(sentence, REVIEW_AUDIO_MODEL_ID, readingAudioMode, voice))
    if (hasCachedAudioFile(filePath)) {
      return {
        reviewCardId: card.id,
        state: 'ready',
        audioFilePath: filePath,
        modelId: REVIEW_AUDIO_MODEL_ID,
        voice,
        fromCache: true,
      }
    }

    try {
      const response = await this.options.provider.synthesize({
        text: sentence,
        modelId: REVIEW_AUDIO_MODEL_ID,
        voice,
        instructions: buildSpeechInstructions(readingAudioMode),
        format: REVIEW_AUDIO_FORMAT,
      })

      await writeFile(filePath, response.audioData)

      return {
        reviewCardId: card.id,
        state: 'ready',
        audioFilePath: filePath,
        modelId: REVIEW_AUDIO_MODEL_ID,
        voice,
        fromCache: false,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Source sentence audio is unavailable right now.'

      return {
        reviewCardId: card.id,
        state: message.toLowerCase().includes('api key') || message.toLowerCase().includes('unavailable') ? 'unavailable' : 'failed',
        audioFilePath: null,
        modelId: REVIEW_AUDIO_MODEL_ID,
        voice,
        failureMessage: message,
        fromCache: false,
      }
    }
  }

  resolveCachePath(fileName: string): string {
    return path.join(this.cacheDirectory, fileName)
  }
}

function createUnavailableAsset(reviewCardId: string, failureMessage: string): ReviewSentenceAudioAsset {
  return {
    reviewCardId,
    state: 'unavailable',
    audioFilePath: null,
    modelId: REVIEW_AUDIO_MODEL_ID,
    voice: DEFAULT_READING_AUDIO_VOICE,
    failureMessage,
    fromCache: false,
  }
}

function buildSpeechInstructions(mode: ReadingAudioMode): string {
  if (mode === 'learner-slow') {
    return 'Speak slowly, clearly, and naturally for a Korean language learner. Use a calm tone, precise pronunciation, and short pauses between phrases. Keep the delivery warm and human, not robotic or exaggerated.'
  }

  return 'Speak clearly and naturally in Korean with a calm, conversational tone and precise pronunciation.'
}

function normalizeSentence(sentence: string | null): string | null {
  if (typeof sentence !== 'string') {
    return null
  }

  const normalized = sentence.trim().replace(/\s+/g, ' ')
  return normalized.length > 0 ? normalized : null
}