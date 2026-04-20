import {
  assertGenerationTopic,
  buildGenerationSystemPrompt,
  buildGenerationUserPrompt,
  buildValidationSystemPrompt,
  buildValidationUserPrompt,
  normalizeDifficultyValidationResult,
  normalizeGeneratedSentences,
  PRACTICE_SENTENCE_MODELS,
  type DifficultyValidationResult,
  type GeneratedPracticeContent,
  type RequiredDifficultyLevel,
} from '@sona/domain/content'

export interface PracticeSentenceGenerator {
  generateSentences(input: { topic: string; difficulty: RequiredDifficultyLevel }): Promise<GeneratedPracticeContent>
  validateDifficulty(input: {
    topic: string
    requestedDifficulty: RequiredDifficultyLevel
    sentences: string[]
  }): Promise<DifficultyValidationResult>
}

export class OpenRouterProviderUnavailableError extends Error {}

interface OpenRouterRuntime {
  fetch: typeof fetch
  apiKey: string | null
  endpoint: string
  siteUrl?: string
  appTitle?: string
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>
    }
  }>
  error?: {
    message?: string
  }
}

export class OpenRouterContentGenerator implements PracticeSentenceGenerator {
  constructor(
    private readonly runtime: OpenRouterRuntime = {
      fetch,
      apiKey: process.env.OPENROUTER_API_KEY ?? null,
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      appTitle: 'Sona Desktop',
    },
  ) {}

  async generateSentences(input: {
    topic: string
    difficulty: RequiredDifficultyLevel
  }): Promise<GeneratedPracticeContent> {
    const topic = assertGenerationTopic(input.topic)
    const content = await this.request({
      model: PRACTICE_SENTENCE_MODELS.generator,
      messages: [
        { role: 'system', content: buildGenerationSystemPrompt() },
        { role: 'user', content: buildGenerationUserPrompt({ topic, difficulty: input.difficulty }) },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'generated_practice_sentences',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              sentences: {
                type: 'array',
                items: { type: 'string' },
                minItems: 1,
              },
            },
            required: ['title', 'sentences'],
            additionalProperties: false,
          },
        },
      },
    })

    const parsed = JSON.parse(content) as {
      title?: unknown
      sentences?: unknown
    }

    const sentences = Array.isArray(parsed.sentences)
      ? normalizeGeneratedSentences(parsed.sentences.filter((sentence): sentence is string => typeof sentence === 'string'))
      : []

    if (sentences.length === 0) {
      throw new OpenRouterProviderUnavailableError('Generated content could not be created right now.')
    }

    return {
      title: typeof parsed.title === 'string' && parsed.title.trim().length > 0 ? parsed.title.trim() : `${topic} Practice`,
      sentences,
    }
  }

  async validateDifficulty(input: {
    topic: string
    requestedDifficulty: RequiredDifficultyLevel
    sentences: string[]
  }): Promise<DifficultyValidationResult> {
    const topic = assertGenerationTopic(input.topic)
    const sentences = normalizeGeneratedSentences(input.sentences)
    const content = await this.request({
      model: PRACTICE_SENTENCE_MODELS.validator,
      messages: [
        { role: 'system', content: buildValidationSystemPrompt() },
        {
          role: 'user',
          content: buildValidationUserPrompt({
            topic,
            requestedDifficulty: input.requestedDifficulty,
            sentences,
          }),
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'difficulty_validation',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              validationOutcome: {
                type: 'string',
                enum: ['accepted', 'relabeled', 'rejected'],
              },
              validatedDifficulty: {
                anyOf: [{ type: 'integer', enum: [1, 2, 3] }, { type: 'null' }],
              },
              explanation: { type: 'string' },
            },
            required: ['validationOutcome', 'validatedDifficulty', 'explanation'],
            additionalProperties: false,
          },
        },
      },
    })

    const parsed = JSON.parse(content) as {
      validationOutcome?: unknown
      validatedDifficulty?: unknown
      explanation?: unknown
    }

    return normalizeDifficultyValidationResult(parsed, input.requestedDifficulty)
  }

  private async request(body: Record<string, unknown>): Promise<string> {
    if (!this.runtime.apiKey) {
      throw new OpenRouterProviderUnavailableError('Generated practice sentences require an OpenRouter API key.')
    }

    let response: Response
    try {
      response = await this.runtime.fetch(this.runtime.endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      })
    } catch {
      throw new OpenRouterProviderUnavailableError('Generated content could not be created right now. The local library remains available.')
    }

    const payload = (await response.json()) as OpenRouterResponse
    if (!response.ok) {
      throw new OpenRouterProviderUnavailableError(
        payload.error?.message?.trim() || 'Generated content could not be created right now. The local library remains available.',
      )
    }

    const content = this.extractMessageContent(payload)
    if (!content) {
      throw new OpenRouterProviderUnavailableError('Generated content could not be created right now. The provider returned an empty response.')
    }

    return content
  }

  private extractMessageContent(payload: OpenRouterResponse): string {
    const content = payload.choices?.[0]?.message?.content
    if (typeof content === 'string') {
      return content
    }

    if (Array.isArray(content)) {
      return content.map((part) => part.text ?? '').join('').trim()
    }

    return ''
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.runtime.apiKey}`,
      'Content-Type': 'application/json',
    }

    if (this.runtime.siteUrl) {
      headers['HTTP-Referer'] = this.runtime.siteUrl
    }

    if (this.runtime.appTitle) {
      headers['X-OpenRouter-Title'] = this.runtime.appTitle
    }

    return headers
  }
}