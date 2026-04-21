import type { TtsProviderAdapter, TtsProviderRequest, TtsProviderResponse, TtsTimingEntry } from '@sona/integrations/tts/provider-adapter'

export class OpenAiTtsProviderUnavailableError extends Error {}

const DEFAULT_OPENAI_TTS_MODEL = 'gpt-4o-mini-tts'
const DEFAULT_TRANSCRIPTION_MODEL = 'whisper-1'

interface OpenAiTtsRuntime {
  fetch: typeof fetch
  getApiKey: () => string | null
  speechEndpoint: string
  transcriptionEndpoint: string
}

interface OpenAiErrorPayload {
  error?: {
    message?: string
  }
}

interface OpenAiVerboseJsonWord {
  word: string
  start: number
  end: number
}

interface OpenAiVerboseJsonTranscription {
  duration?: number
  words?: OpenAiVerboseJsonWord[]
}

export class OpenAiTtsProvider implements TtsProviderAdapter {
  readonly id = 'openai' as const

  constructor(
    private readonly runtime: OpenAiTtsRuntime,
  ) {}

  async synthesize(request: TtsProviderRequest): Promise<TtsProviderResponse> {
    const apiKey = this.runtime.getApiKey()?.trim() ?? ''
    if (!apiKey) {
      throw new OpenAiTtsProviderUnavailableError('Hosted block audio is unavailable without an OpenAI API key in settings.')
    }

    const startedAt = Date.now()
    let speechResponse: Response

    try {
      speechResponse = await this.runtime.fetch(this.runtime.speechEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.modelId,
          input: request.text,
          voice: request.voice,
          instructions: request.instructions,
          response_format: request.format,
        }),
      })
    } catch {
      throw new OpenAiTtsProviderUnavailableError('Hosted block audio is unavailable right now. Reading stays in text-first mode.')
    }

    if (!speechResponse.ok) {
      throw new OpenAiTtsProviderUnavailableError(await readOpenAiErrorMessage(speechResponse))
    }

    const contentType = speechResponse.headers.get('content-type') ?? `audio/${request.format}`
    const audioData = new Uint8Array(await speechResponse.arrayBuffer())
    if (audioData.byteLength === 0) {
      throw new OpenAiTtsProviderUnavailableError('Hosted block audio returned an empty response. Reading stays in text-first mode.')
    }

    const timingResult = await this.transcribeWordTimings(apiKey, request, audioData, contentType)

    return {
      audioData,
      contentType,
      latencyMs: Date.now() - startedAt,
      estimatedCostUsd: null,
      durationMs: timingResult.durationMs,
      ...(timingResult.timings ? { timings: timingResult.timings } : {}),
    }
  }

  private async transcribeWordTimings(
    apiKey: string,
    request: TtsProviderRequest,
    audioData: Uint8Array,
    contentType: string,
  ): Promise<{ durationMs: number | null; timings?: TtsTimingEntry[] }> {
    const form = new FormData()
    form.append('file', new Blob([Buffer.from(audioData)], { type: contentType }), `speech.${request.format}`)
    form.append('model', DEFAULT_TRANSCRIPTION_MODEL)
    form.append('response_format', 'verbose_json')
    form.append('timestamp_granularities[]', 'word')

    let transcriptionResponse: Response
    try {
      transcriptionResponse = await this.runtime.fetch(this.runtime.transcriptionEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: form,
      })
    } catch {
      return { durationMs: null }
    }

    if (!transcriptionResponse.ok) {
      return { durationMs: null }
    }

    const payload = (await transcriptionResponse.json()) as OpenAiVerboseJsonTranscription
    const timings = payload.words
      ?.filter((word) => typeof word.word === 'string' && Number.isFinite(word.start) && Number.isFinite(word.end) && word.end > word.start)
      .map((word) => ({
        surface: word.word,
        startMs: Math.round(word.start * 1000),
        endMs: Math.round(word.end * 1000),
      }))

    return timings && timings.length > 0
      ? {
          durationMs: typeof payload.duration === 'number' ? Math.round(payload.duration * 1000) : null,
          timings,
        }
      : {
          durationMs: typeof payload.duration === 'number' ? Math.round(payload.duration * 1000) : null,
        }
  }
}

export function createOpenAiTtsProvider(getApiKey: () => string | null): OpenAiTtsProvider {
  return new OpenAiTtsProvider({
    fetch,
    getApiKey,
    speechEndpoint: 'https://api.openai.com/v1/audio/speech',
    transcriptionEndpoint: 'https://api.openai.com/v1/audio/transcriptions',
  })
}

export function getDefaultOpenAiTtsModel(): string {
  return DEFAULT_OPENAI_TTS_MODEL
}

async function readOpenAiErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    const payload = (await response.json()) as OpenAiErrorPayload
    if (payload.error?.message?.trim()) {
      return payload.error.message.trim()
    }
  }

  return 'Hosted block audio is unavailable right now. Reading stays in text-first mode.'
}