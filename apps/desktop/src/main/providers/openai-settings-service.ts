import type { ReadingAudioVoice } from '@sona/domain/settings/reading-audio-preference'
import { STUDY_PREFERENCES_SAMPLE_TEXT } from '@sona/domain/settings/study-preferences'

type ProviderValidationState = 'idle' | 'success' | 'failed'

interface ProviderKeyStatus {
  configured: boolean
  lastValidatedAt: number | null
  lastValidationState: ProviderValidationState
}

interface OpenAiSettingsRuntime {
  fetch: typeof fetch
  getApiKey: () => string | null
  modelsEndpoint: string
  speechEndpoint: string
}

interface OpenAiErrorPayload {
  error?: {
    message?: string
  }
}

const DEFAULT_OPENAI_TTS_MODEL = 'gpt-4o-mini-tts'

export class OpenAiSettingsService {
  private lastValidatedAt: number | null = null

  private lastValidationState: ProviderValidationState = 'idle'

  constructor(
    private readonly runtime: OpenAiSettingsRuntime = {
      fetch,
      getApiKey: () => null,
      modelsEndpoint: 'https://api.openai.com/v1/models',
      speechEndpoint: 'https://api.openai.com/v1/audio/speech',
    },
  ) {}

  getProviderKeyStatus(): ProviderKeyStatus {
    return {
      configured: Boolean(this.runtime.getApiKey()?.trim()),
      lastValidatedAt: this.lastValidatedAt,
      lastValidationState: this.lastValidationState,
    }
  }

  markConfigurationChanged() {
    this.lastValidatedAt = null
    this.lastValidationState = 'idle'
  }

  async validateStoredKey(): Promise<{
    ok: boolean
    checkedAt: number
    message: string
  }> {
    const apiKey = this.runtime.getApiKey()?.trim() ?? ''
    if (!apiKey) {
      return {
        ok: false,
        checkedAt: Date.now(),
        message: 'Add an OpenAI API key before testing TTS.',
      }
    }

    let response: Response

    try {
      response = await this.runtime.fetch(this.runtime.modelsEndpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    } catch {
      const checkedAt = Date.now()
      this.lastValidatedAt = checkedAt
      this.lastValidationState = 'failed'

      return {
        ok: false,
        checkedAt,
        message: 'OpenAI could not be reached. TTS stays local-first until the connection succeeds.',
      }
    }

    const checkedAt = Date.now()
    this.lastValidatedAt = checkedAt

    if (!response.ok) {
      this.lastValidationState = 'failed'

      return {
        ok: false,
        checkedAt,
        message: await readOpenAiErrorMessage(response, 'OpenAI rejected the API key.'),
      }
    }

    this.lastValidationState = 'success'

    return {
      ok: true,
      checkedAt,
      message: 'OpenAI TTS is ready.',
    }
  }

  async previewVoice(voice: ReadingAudioVoice): Promise<{
    ok: boolean
    voice: ReadingAudioVoice
    sampleText: typeof STUDY_PREFERENCES_SAMPLE_TEXT
    message: string
    audioDataUrl: string | null
  }> {
    const apiKey = this.runtime.getApiKey()?.trim() ?? ''
    if (!apiKey) {
      return {
        ok: false,
        voice,
        sampleText: STUDY_PREFERENCES_SAMPLE_TEXT,
        message: 'Add an OpenAI API key before previewing voices.',
        audioDataUrl: null,
      }
    }

    let response: Response

    try {
      response = await this.runtime.fetch(this.runtime.speechEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: DEFAULT_OPENAI_TTS_MODEL,
          input: STUDY_PREFERENCES_SAMPLE_TEXT,
          voice,
          response_format: 'mp3',
        }),
      })
    } catch {
      return {
        ok: false,
        voice,
        sampleText: STUDY_PREFERENCES_SAMPLE_TEXT,
        message: 'Voice preview is unavailable right now.',
        audioDataUrl: null,
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        voice,
        sampleText: STUDY_PREFERENCES_SAMPLE_TEXT,
        message: await readOpenAiErrorMessage(response, 'Voice preview is unavailable right now.'),
        audioDataUrl: null,
      }
    }

    const contentType = response.headers.get('content-type') ?? 'audio/mpeg'
    const audioBuffer = Buffer.from(await response.arrayBuffer())
    if (audioBuffer.byteLength === 0) {
      return {
        ok: false,
        voice,
        sampleText: STUDY_PREFERENCES_SAMPLE_TEXT,
        message: 'Voice preview returned empty audio.',
        audioDataUrl: null,
      }
    }

    return {
      ok: true,
      voice,
      sampleText: STUDY_PREFERENCES_SAMPLE_TEXT,
      message: `Previewing ${voice}.`,
      audioDataUrl: `data:${contentType};base64,${audioBuffer.toString('base64')}`,
    }
  }
}

async function readOpenAiErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    const payload = (await response.json()) as OpenAiErrorPayload
    if (payload.error?.message?.trim()) {
      return payload.error.message.trim()
    }
  }

  return fallbackMessage
}