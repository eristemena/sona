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
  type RequiredDifficultyLevel,
} from "@sona/domain/content";

export interface PracticeSentenceGenerator {
  generateSentences(input: {
    topic: string;
    sentenceCount: number;
    difficulty: RequiredDifficultyLevel;
  }): Promise<{ sentences: string[] }>;
  validateDifficulty(input: {
    topic: string;
    requestedDifficulty: RequiredDifficultyLevel;
    sentences: string[];
  }): Promise<DifficultyValidationResult>;
}

export class OpenRouterProviderUnavailableError extends Error {}

interface OpenRouterRuntime {
  fetch: typeof fetch;
  apiKey?: string | null;
  getApiKey?: () => string | null;
  endpoint: string;
  siteUrl?: string;
  appTitle?: string;
  warn?: (message: string) => void;
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
      getApiKey: () => null,
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      appTitle: "Sona Desktop",
    },
  ) {}

  async generateSentences(input: {
    topic: string;
    sentenceCount: number;
    difficulty: RequiredDifficultyLevel;
  }): Promise<{ sentences: string[] }> {
    const topic = assertGenerationTopic(input.topic);
    const sentenceCount = this.assertSentenceCount(input.sentenceCount);
    const firstAttempt = await this.requestGeneration({
      topic,
      sentenceCount,
      difficulty: input.difficulty,
    });

    if (this.isCountWithinTolerance(firstAttempt.length, sentenceCount)) {
      return {
        sentences: firstAttempt,
      };
    }

    this.warnCountMismatch(sentenceCount, firstAttempt.length, 1);

    try {
      const retryAttempt = await this.requestGeneration({
        topic,
        sentenceCount,
        difficulty: input.difficulty,
      });

      if (!this.isCountWithinTolerance(retryAttempt.length, sentenceCount)) {
        this.warnCountMismatch(sentenceCount, retryAttempt.length, 2);
      }

      return {
        sentences: retryAttempt,
      };
    } catch {
      return {
        sentences: firstAttempt,
      };
    }
  }

  private async requestGeneration(input: {
    topic: string;
    sentenceCount: number;
    difficulty: RequiredDifficultyLevel;
  }): Promise<string[]> {
    const content = await this.request({
      model: PRACTICE_SENTENCE_MODELS.generator,
      messages: [
        {
          role: "system",
          content: buildGenerationSystemPrompt({
            topic: input.topic,
            sentenceCount: input.sentenceCount,
            difficulty: input.difficulty,
          }),
        },
        {
          role: "user",
          content: buildGenerationUserPrompt({
            topic: input.topic,
            sentenceCount: input.sentenceCount,
            difficulty: input.difficulty,
          }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "generated_practice_sentences",
          strict: true,
          schema: {
            type: "object",
            properties: {
              sentences: {
                type: "array",
                items: { type: "string" },
                minItems: input.sentenceCount,
                maxItems: input.sentenceCount,
              },
            },
            required: ["sentences"],
            additionalProperties: false,
          },
        },
      },
    });

    const parsed = JSON.parse(content) as {
      sentences?: unknown;
    };

    const sentences = Array.isArray(parsed.sentences)
      ? normalizeGeneratedSentences(
          parsed.sentences.filter(
            (sentence): sentence is string => typeof sentence === "string",
          ),
        )
      : [];

    if (sentences.length === 0) {
      throw new OpenRouterProviderUnavailableError(
        "Generated content could not be created right now.",
      );
    }

    return sentences;
  }

  async validateDifficulty(input: {
    topic: string;
    requestedDifficulty: RequiredDifficultyLevel;
    sentences: string[];
  }): Promise<DifficultyValidationResult> {
    const topic = assertGenerationTopic(input.topic);
    const sentences = normalizeGeneratedSentences(input.sentences);
    const content = await this.request({
      model: PRACTICE_SENTENCE_MODELS.validator,
      messages: [
        { role: "system", content: buildValidationSystemPrompt() },
        {
          role: "user",
          content: buildValidationUserPrompt({
            topic,
            requestedDifficulty: input.requestedDifficulty,
            sentences,
          }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "difficulty_validation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              validationOutcome: {
                type: "string",
                enum: ["accepted", "relabeled", "rejected"],
              },
              validatedDifficulty: {
                anyOf: [{ type: "integer", enum: [1, 2, 3] }, { type: "null" }],
              },
              explanation: { type: "string" },
            },
            required: [
              "validationOutcome",
              "validatedDifficulty",
              "explanation",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const parsed = JSON.parse(content) as {
      validationOutcome?: unknown;
      validatedDifficulty?: unknown;
      explanation?: unknown;
    };

    return normalizeDifficultyValidationResult(
      parsed,
      input.requestedDifficulty,
    );
  }

  private async request(body: Record<string, unknown>): Promise<string> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      throw new OpenRouterProviderUnavailableError(
        "Generated practice sentences require an OpenRouter API key.",
      );
    }

    let response: Response;
    try {
      response = await this.runtime.fetch(this.runtime.endpoint, {
        method: "POST",
        headers: this.getHeaders(apiKey),
        body: JSON.stringify(body),
      });
    } catch {
      throw new OpenRouterProviderUnavailableError(
        "Generated content could not be created right now. The local library remains available.",
      );
    }

    const payload = (await response.json()) as OpenRouterResponse;
    if (!response.ok) {
      throw new OpenRouterProviderUnavailableError(
        payload.error?.message?.trim() ||
          "Generated content could not be created right now. The local library remains available.",
      );
    }

    const content = this.extractMessageContent(payload);
    if (!content) {
      throw new OpenRouterProviderUnavailableError(
        "Generated content could not be created right now. The provider returned an empty response.",
      );
    }

    return content;
  }

  private extractMessageContent(payload: OpenRouterResponse): string {
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content === "string") {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((part) => part.text ?? "")
        .join("")
        .trim();
    }

    return "";
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

  private assertSentenceCount(sentenceCount: number): number {
    if (!Number.isInteger(sentenceCount) || sentenceCount < 5 || sentenceCount > 30) {
      throw new Error('Generated sentence count must be an integer between 5 and 30.')
    }

    return sentenceCount
  }

  private isCountWithinTolerance(actualCount: number, requestedCount: number): boolean {
    return Math.abs(actualCount - requestedCount) <= 1
  }

  private warnCountMismatch(requestedCount: number, actualCount: number, attempt: number): void {
    const warn = this.runtime.warn ?? ((message: string) => console.warn(message))
    warn(`Generated sentence count mismatch on attempt ${attempt}: requested ${requestedCount}, received ${actualCount}.`)
  }
}