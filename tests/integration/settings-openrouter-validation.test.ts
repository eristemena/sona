import { describe, expect, it, vi } from 'vitest'

import { OpenRouterSettingsService } from '../../apps/desktop/src/main/providers/openrouter-settings-service.js'

describe('OpenRouter settings validation', () => {
  it('reports success for a reachable models endpoint and tracks the last validation state', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: [] }), { status: 200 }))
    const service = new OpenRouterSettingsService({
      fetch: fetchMock,
      getApiKey: () => 'sk-or-test',
    })

    const result = await service.validateStoredKey()

    expect(result.ok).toBe(true)
    expect(result.message).toBe('OpenRouter key is valid.')
    expect(fetchMock).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: 'Bearer sk-or-test',
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
    const service = new OpenRouterSettingsService({
      fetch: fetchMock,
      getApiKey: () => null,
    })

    const result = await service.validateStoredKey()

    expect(result).toEqual({
      ok: false,
      checkedAt: expect.any(Number),
      message: 'Add an OpenRouter API key before testing the connection.',
    })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(service.getProviderKeyStatus()).toEqual({
      configured: false,
      lastValidatedAt: null,
      lastValidationState: 'idle',
    })
  })
})