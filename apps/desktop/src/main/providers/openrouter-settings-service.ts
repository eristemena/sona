import type {
  PreviewTtsVoiceResult,
  ProviderKeyStatus,
  ValidateOpenRouterKeyResult,
} from '@sona/domain/contracts/window-sona'
import { STUDY_PREFERENCES_SAMPLE_TEXT } from '@sona/domain/settings/study-preferences'
import { isReadingAudioVoice, type ReadingAudioVoice } from '@sona/domain/settings/reading-audio-preference'

interface OpenRouterSettingsServiceOptions {
  fetch?: typeof fetch
  getApiKey: () => string | null
}

export class OpenRouterSettingsService {
  private readonly fetchImpl: typeof fetch
  private lastValidatedAt: number | null = null
  private lastValidationState: ProviderKeyStatus['lastValidationState'] = 'idle'

  constructor(private readonly options: OpenRouterSettingsServiceOptions) {
    this.fetchImpl = options.fetch ?? fetch
  }

  getProviderKeyStatus(): ProviderKeyStatus {
    return {
      configured: this.options.getApiKey() !== null,
      lastValidatedAt: this.lastValidatedAt,
      lastValidationState: this.lastValidationState,
    }
  }

  markConfigurationChanged() {
    this.lastValidatedAt = null
    this.lastValidationState = 'idle'
  }

  async validateStoredKey(): Promise<ValidateOpenRouterKeyResult> {
    const apiKey = this.options.getApiKey()
    const checkedAt = Date.now()

    if (!apiKey) {
      this.lastValidatedAt = null
      this.lastValidationState = 'idle'
      return {
        ok: false,
        checkedAt,
        message: 'Add an OpenRouter API key before testing the connection.',
      }
    }

    try {
      const response = await this.fetchImpl('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      this.lastValidatedAt = checkedAt
      this.lastValidationState = response.ok ? 'success' : 'failed'

      return {
        ok: response.ok,
        checkedAt,
        message: response.ok
          ? 'OpenRouter key is valid.'
          : 'OpenRouter key validation failed.',
      }
    } catch {
      this.lastValidatedAt = checkedAt
      this.lastValidationState = 'failed'
      return {
        ok: false,
        checkedAt,
        message: 'OpenRouter key validation failed.',
      }
    }
  }

  async previewVoice(voice: string): Promise<PreviewTtsVoiceResult> {
    const normalizedVoice: ReadingAudioVoice = isReadingAudioVoice(voice) ? voice : 'alloy'

    if (!this.options.getApiKey()) {
      return {
        ok: false,
        voice: normalizedVoice,
        sampleText: STUDY_PREFERENCES_SAMPLE_TEXT,
        message: 'Add an OpenRouter API key before previewing voices.',
        audioDataUrl: null,
      }
    }

    const validation = await this.validateStoredKey()
    if (!validation.ok) {
      return {
        ok: false,
        voice: normalizedVoice,
        sampleText: STUDY_PREFERENCES_SAMPLE_TEXT,
        message: validation.message,
        audioDataUrl: null,
      }
    }

    return {
      ok: true,
      voice: normalizedVoice,
      sampleText: STUDY_PREFERENCES_SAMPLE_TEXT,
      message: `Voice preview is ready for ${normalizedVoice}.`,
      audioDataUrl: null,
    }
  }
}