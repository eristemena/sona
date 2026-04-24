import { describe, expect, it, vi } from 'vitest'

import { OpenRouterContentGenerator } from '../../apps/desktop/src/main/providers/openrouter-content-generator.js'
import { OpenRouterReadingAnnotationProvider } from '../../apps/desktop/src/main/providers/openrouter-reading-annotation-provider.js'

describe('OpenRouter settings key wiring', () => {
  it('reads the current settings-backed key lazily for reading lookup and generated content requests', async () => {
    let currentKey: string | null = null
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  surface: '안녕하세요',
                  meaning: 'hello',
                  romanization: 'annyeonghaseyo',
                  pattern: 'greeting',
                  register: 'polite',
                  sentence_translation: 'Hello.',
                  grammarExplanation: null,
                }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    )

    const annotationProvider = new OpenRouterReadingAnnotationProvider({
      fetch: fetchMock,
      getApiKey: () => currentKey,
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      appTitle: 'Sona Desktop',
    })

    const generator = new OpenRouterContentGenerator({
      fetch: fetchMock,
      getApiKey: () => currentKey,
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      appTitle: 'Sona Desktop',
    })

    currentKey = 'sk-or-updated'

    await annotationProvider.lookupWord({
      token: '안녕하세요',
      sentenceContext: '안녕하세요.',
      canonicalForm: '안녕하세요',
    })

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-or-updated',
        }),
      }),
    )

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: 'Cafe Practice',
                  sentences: ['따뜻한 커피 한 잔 주세요.'],
                }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    )
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  validationOutcome: 'accepted',
                  validatedDifficulty: 2,
                  explanation: 'Looks good.',
                }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    )

    const generated = await generator.generateSentences({
      topic: 'coffee shop',
      difficulty: 2,
    })
    const validation = await generator.validateDifficulty({
      topic: 'coffee shop',
      requestedDifficulty: 2,
      sentences: generated.sentences,
    })

    expect(generated.sentences).toEqual(['따뜻한 커피 한 잔 주세요.'])
    expect(validation.validatedDifficulty).toBe(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-or-updated',
        }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-or-updated',
        }),
      }),
    )
  })
})