import type { ValidationOutcome } from './content-library-item.js';
import { type RequiredDifficultyLevel } from './difficulty.js';
export interface DifficultyValidationResult {
    validatedDifficulty: RequiredDifficultyLevel | null;
    validationOutcome: ValidationOutcome;
    explanation: string;
}
export declare function buildGenerationSystemPrompt(): string;
export declare function buildGenerationUserPrompt(input: {
    topic: string;
    difficulty: RequiredDifficultyLevel;
}): string;
export declare function buildValidationSystemPrompt(): string;
export declare function buildValidationUserPrompt(input: {
    topic: string;
    requestedDifficulty: RequiredDifficultyLevel;
    sentences: string[];
}): string;
export declare function normalizeDifficultyValidationResult(input: {
    validatedDifficulty?: unknown;
    validationOutcome?: unknown;
    explanation?: unknown;
}, requestedDifficulty: RequiredDifficultyLevel): DifficultyValidationResult;
//# sourceMappingURL=difficulty-policy.d.ts.map