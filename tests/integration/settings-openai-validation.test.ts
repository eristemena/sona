import { describe, expect, it, vi } from 'vitest'

import { OpenAiSettingsService } from '../../apps/desktop/src/main/providers/openai-settings-service.js'

describe('OpenAI settings validation', () => {
  it('reports success for a reachable models endpoint and tracks the last validation state', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: [] }), { status: 200 }))
    const service = new OpenAiSettingsService({
      fetch: fetchMock,
      getApiKey: () => 'sk-openai-test',
      modelsEndpoint: 'https://api.openai.com/v1/models',
      speechEndpoint: 'https://api.openai.com/v1/audio/speech',
    })

    const result = await service.validateStoredKey()

    expect(result.ok).toBe(true)
    expect(result.message).toBe('OpenAI TTS is ready.')
    expect(fetchMock).toHaveBeenCalledWith('https://api.openai.com/v1/models', {
      headers: {
        Authorization: 'Bearer sk-openai-test',
      },
      method: 'GET',
    })
    expect(service.getProviderKeyStatus()).toEqual({
      configured: true,
      lastValidatedAt: result.checkedAt,
      lastValidationState: 'success',
    })
  })

  it('fails closed when no key is configured', async () => {
    const fetchMock = vi.fn()
    const service = new OpenAiSettingsService({
      fetch: fetchMock,
      getApiKey: () => null,
      modelsEndpoint: 'https://api.openai.com/v1/models',
      speechEndpoint: 'https://api.openai.com/v1/audio/speech',
    })

    const result = await service.validateStoredKey()

    expect(result).toEqual({
      ok: false,
      checkedAt: expect.any(Number),
      message: 'Add an OpenAI API key before testing TTS.',
    })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(service.getProviderKeyStatus()).toEqual({
      configured: false,
      lastValidatedAt: null,
      lastValidationState: 'idle',
    })
  })
})