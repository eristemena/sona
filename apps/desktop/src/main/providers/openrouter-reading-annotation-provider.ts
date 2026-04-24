import type {
  ReadingAnnotationLookupRequest,
  ReadingAnnotationProviderAdapter,
  ReadingAnnotationResponse,
  ReadingGrammarExplanationRequest,
} from '@sona/integrations/llm/provider-adapter'

export class OpenRouterReadingAnnotationProviderUnavailableError extends Error {}

interface OpenRouterRuntime {
  fetch: typeof fetch;
  apiKey?: string | null;
  getApiKey?: () => string | null;
  endpoint: string;
  siteUrl?: string;
  appTitle?: string;
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

interface AnnotationPayload {
  surface?: unknown
  meaning?: unknown
  romanization?: unknown
  pattern?: unknown
  register?: unknown
  sentence_translation?: unknown
  sentenceTranslation?: unknown
  grammarExplanation?: unknown
}

export class OpenRouterReadingAnnotationProvider implements ReadingAnnotationProviderAdapter {
  readonly id = "openrouter" as const;
  readonly modelId: string;

  constructor(
    private readonly runtime: OpenRouterRuntime = {
      fetch,
      getApiKey: () => null,
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      appTitle: "Sona Desktop",
    },
    modelId = "openai/gpt-4o-mini",
  ) {
    this.modelId = modelId;
  }

  async lookupWord(
    request: ReadingAnnotationLookupRequest,
  ): Promise<ReadingAnnotationResponse> {
    return this.request({
      request,
      includeGrammarExplanation: false,
      schemaName: "reading_word_lookup",
    });
  }

  async explainGrammar(
    request: ReadingGrammarExplanationRequest,
  ): Promise<ReadingAnnotationResponse> {
    return this.request({
      request,
      includeGrammarExplanation: true,
      schemaName: "reading_grammar_explanation",
    });
  }

  private async request(input: {
    request: ReadingAnnotationLookupRequest | ReadingGrammarExplanationRequest;
    includeGrammarExplanation: boolean;
    schemaName: string;
  }): Promise<ReadingAnnotationResponse> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      throw new OpenRouterReadingAnnotationProviderUnavailableError(
        "Word lookup is unavailable without an OpenRouter API key.",
      );
    }

    let response: Response;
    try {
      response = await this.runtime.fetch(this.runtime.endpoint, {
        method: "POST",
        headers: this.getHeaders(apiKey),
        body: JSON.stringify({
          model: this.modelId,
          messages: buildMessages(
            input.request,
            input.includeGrammarExplanation,
          ),
          response_format: {
            type: "json_schema",
            json_schema: {
              name: input.schemaName,
              strict: true,
              schema: buildSchema(input.includeGrammarExplanation),
            },
          },
        }),
      });
    } catch {
      throw new OpenRouterReadingAnnotationProviderUnavailableError(
        "Word lookup is unavailable right now. Continue reading and try again later.",
      );
    }

    const payload = (await response.json()) as OpenRouterResponse;
    if (!response.ok) {
      throw new OpenRouterReadingAnnotationProviderUnavailableError(
        payload.error?.message?.trim() ||
          "Word lookup is unavailable right now. Continue reading and try again later.",
      );
    }

    const content = extractMessageContent(payload);
    if (!content) {
      throw new OpenRouterReadingAnnotationProviderUnavailableError(
        "Word lookup returned an empty response. Continue reading and try again later.",
      );
    }

    const parsed = JSON.parse(content) as AnnotationPayload;
    const canonicalForm = normalizeField(
      input.request.canonicalForm,
      input.request.token,
    );
    const surface = normalizeField(parsed.surface, input.request.token);
    const meaning = normalizeField(parsed.meaning, "Unavailable offline");
    const romanization = normalizeField(parsed.romanization, "");
    const pattern = normalizeField(parsed.pattern, "Unknown pattern");
    const register = normalizeField(parsed.register, "Unknown register");
    const sentenceTranslation = normalizeField(
      parsed.sentence_translation ?? parsed.sentenceTranslation,
      "A sentence-level translation is unavailable right now. Continue reading and try again later.",
    );
    const grammarExplanation = normalizeOptionalField(
      parsed.grammarExplanation,
    );

    return {
      canonicalForm,
      surface,
      meaning,
      romanization,
      pattern,
      register,
      sentenceTranslation,
      grammarExplanation,
      modelId: this.modelId,
      responseJson: JSON.stringify({
        canonicalForm,
        surface,
        meaning,
        romanization,
        pattern,
        register,
        sentenceTranslation,
        grammarExplanation,
      }),
    };
  }

  private getApiKey(): string | null {
    if (typeof this.runtime.getApiKey === "function") {
      return this.runtime.getApiKey();
    }

    return this.runtime.apiKey ?? null;
  }

  private getHeaders(apiKey: string): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    if (this.runtime.siteUrl) {
      headers["HTTP-Referer"] = this.runtime.siteUrl;
    }

    if (this.runtime.appTitle) {
      headers["X-OpenRouter-Title"] = this.runtime.appTitle;
    }

    return headers;
  }
}

function buildMessages(request: ReadingAnnotationLookupRequest | ReadingGrammarExplanationRequest, includeGrammarExplanation: boolean) {
  return [
    {
      role: 'system',
      content:
        'Given the Korean sentence and the tapped word, return compact JSON only. Explain the tapped word or construction in this sentence, not as a dictionary gloss. Keep English natural and learner-safe.',
    },
    {
      role: 'user',
      content: [
        `Sentence context: ${request.sentenceContext}`,
        `Tapped token: ${request.token}`,
        request.canonicalForm ? `Known canonical form for internal caching only: ${request.canonicalForm}` : null,
        includeGrammarExplanation
          ? 'Return JSON with: surface, romanization, meaning, pattern, register, sentence_translation, grammarExplanation. Keep grammarExplanation concise and specific to this sentence.'
          : 'Return JSON with: surface, romanization, meaning, pattern, register, sentence_translation. Set grammarExplanation to null.',
      ]
        .filter(Boolean)
        .join('\n'),
    },
  ]
}

function buildSchema(includeGrammarExplanation: boolean) {
  return {
    type: 'object',
    properties: {
      surface: { type: 'string' },
      meaning: { type: 'string' },
      romanization: { type: 'string' },
      pattern: { type: 'string' },
      register: { type: 'string' },
      sentence_translation: { type: 'string' },
      grammarExplanation: includeGrammarExplanation
        ? { type: 'string' }
        : {
            anyOf: [{ type: 'string' }, { type: 'null' }],
          },
    },
    required: ['surface', 'meaning', 'romanization', 'pattern', 'register', 'sentence_translation', 'grammarExplanation'],
    additionalProperties: false,
  }
}

function extractMessageContent(payload: OpenRouterResponse): string {
  const content = payload.choices?.[0]?.message?.content
  if (typeof content === 'string') {
    return content.trim()
  }

  if (Array.isArray(content)) {
    return content.map((part) => part.text ?? '').join('').trim()
  }

  return ''
}

function normalizeField(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

function normalizeOptionalField(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}