export interface LlmProviderRequest {
  featureArea: 'tokenization-help' | 'annotation-help' | 'translation-help'
  prompt: string
  text: string
}

export interface LlmProviderResponse {
  content: string
  latencyMs: number
  estimatedCostUsd: number
}

export interface LlmProviderAdapter {
  id: 'openai' | 'anthropic'
  invoke(request: LlmProviderRequest): Promise<LlmProviderResponse>
}
export interface LlmProviderRequest {
  featureArea: 'tokenization-help' | 'annotation-help' | 'translation-help'
  prompt: string
  text: string
}

export interface LlmProviderResponse {
  content: string
  latencyMs: number
  estimatedCostUsd: number
}

export interface LlmProviderAdapter {
  id: 'openai' | 'anthropic'
  invoke(request: LlmProviderRequest): Promise<LlmProviderResponse>
}
