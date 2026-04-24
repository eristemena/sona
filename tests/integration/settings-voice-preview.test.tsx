import { describe, expect, it, vi } from 'vitest'

import { OpenAiSettingsService } from '../../apps/desktop/src/main/providers/openai-settings-service.js'

describe('settings voice preview', () => {
  it('returns a playable data URL for a validated preview request', async () => {
    const fetchMock = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: {
        'content-type': 'audio/mpeg',
      },
    }))
    const service = new OpenAiSettingsService({
      fetch: fetchMock,
      getApiKey: () => 'sk-openai-preview',
      modelsEndpoint: 'https://api.openai.com/v1/models',
      speechEndpoint: 'https://api.openai.com/v1/audio/speech',
    })

    const result = await service.previewVoice('nova')

    expect(result.ok).toBe(true)
    expect(result.voice).toBe('nova')
    expect(result.sampleText).toBe('안녕하세요, 소나입니다.')
    expect(result.message).toBe('Previewing nova.')
    expect(result.audioDataUrl).toMatch(/^data:audio\/mpeg;base64,/) 
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('keeps voice selection usable when no provider key is configured', async () => {
    const service = new OpenAiSettingsService({
      fetch: vi.fn(),
      getApiKey: () => null,
      modelsEndpoint: 'https://api.openai.com/v1/models',
      speechEndpoint: 'https://api.openai.com/v1/audio/speech',
    })

    const result = await service.previewVoice('alloy')

    expect(result).toEqual({
      ok: false,
      voice: 'alloy',
      sampleText: '안녕하세요, 소나입니다.',
      message: 'Add an OpenAI API key before previewing voices.',
      audioDataUrl: null,
    })
  })
})