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
                  sentences: [
                    '따뜻한 커피 한 잔 주세요.',
                    '창가 자리에 앉아도 될까요?',
                    '오늘 추천 음료가 무엇인가요?',
                    '얼음은 조금만 넣어 주세요.',
                    '테이크아웃으로 부탁드릴게요.',
                    '시럽은 빼 주실 수 있나요?',
                    '결제는 카드로 할게요.',
                    '영수증도 함께 주세요.',
                    '음료가 나오면 이름을 불러 주세요.',
                    '다음에도 이 메뉴를 주문하고 싶어요.',
                  ],
                }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
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
      sentenceCount: 10,
      difficulty: 2,
    })
    const validation = await generator.validateDifficulty({
      topic: 'coffee shop',
      requestedDifficulty: 2,
      sentences: generated.sentences,
    })

    const generationRequest = JSON.parse(
      String(fetchMock.mock.calls[1]?.[1]?.body ?? '{}'),
    ) as {
      messages?: Array<{ role: string; content: string }>
      response_format?: {
        json_schema?: {
          schema?: {
            properties?: {
              sentences?: { minItems?: number; maxItems?: number }
            }
          }
        }
      }
    }

    expect(generated.sentences).toHaveLength(10)
    expect(generationRequest.messages?.[0]?.content).toContain('Generate exactly 10 Korean sentences on the topic "coffee shop"')
    expect(generationRequest.messages?.[1]?.content).toContain('Return exactly 10 sentences in JSON using the sentences array only.')
    expect(generationRequest.response_format?.json_schema?.schema?.properties?.sentences?.minItems).toBe(10)
    expect(generationRequest.response_format?.json_schema?.schema?.properties?.sentences?.maxItems).toBe(10)
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

  it('retries once and warns when the provider returns far fewer sentences than requested', async () => {
    const warnMock = vi.fn()
    const fetchMock = vi
      .fn(async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    sentences: [
                      '첫 번째 문장입니다.',
                      '두 번째 문장입니다.',
                      '세 번째 문장입니다.',
                      '네 번째 문장입니다.',
                    ],
                  }),
                },
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    sentences: [
                      '첫 번째 문장입니다.',
                      '두 번째 문장입니다.',
                      '세 번째 문장입니다.',
                      '네 번째 문장입니다.',
                    ],
                  }),
                },
              },
            ],
          }),
          { status: 200 },
        ),
      )

    const generator = new OpenRouterContentGenerator({
      fetch: fetchMock,
      getApiKey: () => 'sk-or-updated',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      appTitle: 'Sona Desktop',
      warn: warnMock,
    })

    const generated = await generator.generateSentences({
      topic: 'coffee shop',
      sentenceCount: 10,
      difficulty: 2,
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(warnMock).toHaveBeenCalledTimes(2)
    expect(warnMock).toHaveBeenNthCalledWith(
      1,
      'Generated sentence count mismatch on attempt 1: requested 10, received 4.',
    )
    expect(warnMock).toHaveBeenNthCalledWith(
      2,
      'Generated sentence count mismatch on attempt 2: requested 10, received 4.',
    )
    expect(generated.sentences).toHaveLength(4)
  })
})