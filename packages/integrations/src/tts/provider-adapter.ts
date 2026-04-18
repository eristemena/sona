export interface TtsProviderRequest {
  text: string
  voice?: string
}

export interface TtsProviderResponse {
  audioPath: string
  latencyMs: number
  estimatedCostUsd: number
}

export interface TtsProviderAdapter {
  id: 'openai' | 'google-cloud-tts'
  synthesize(request: TtsProviderRequest): Promise<TtsProviderResponse>
}
export interface TtsProviderRequest {
  text: string
  voice?: string
}

export interface TtsProviderResponse {
  audioPath: string
  latencyMs: number
  estimatedCostUsd: number
}

export interface TtsProviderAdapter {
  id: 'openai' | 'google-cloud-tts'
  synthesize(request: TtsProviderRequest): Promise<TtsProviderResponse>
}
