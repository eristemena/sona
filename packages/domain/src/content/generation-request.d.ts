import type { ValidationOutcome } from './content-library-item.js';
import type { RequiredDifficultyLevel } from './difficulty.js';
export declare const PRACTICE_SENTENCE_MODELS: {
    readonly generator: "anthropic/claude-3-5-haiku";
    readonly validator: "openai/gpt-4o-mini";
};
export interface GeneratedPracticeContent {
    title: string;
    sentences: string[];
}
export declare function normalizeGenerationTopic(topic: string): string;
export declare function assertGenerationTopic(topic: string): string;
export declare function normalizeGeneratedSentences(sentences: string[]): string[];
export declare function deriveGeneratedTitle(topic: string): string;
export declare function createGeneratedSearchText(title: string, topic: string, sentences: string[]): string;
export declare function createGeneratedDuplicateCheckText(sentences: string[]): string;
export declare function formatGenerationProvenanceDetail(input: {
    topic: string;
    requestedDifficulty: RequiredDifficultyLevel;
    validatedDifficulty: RequiredDifficultyLevel;
    validationOutcome: Exclude<ValidationOutcome, 'rejected'>;
    requestedDifficultyBadge: string;
    validatedDifficultyBadge: string;
}): string;
//# sourceMappingURL=generation-request.d.ts.map