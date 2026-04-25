import { assertRequiredDifficultyLevel, toDifficultyBadge } from './difficulty.js';
export function buildGenerationSystemPrompt(input) {
    return [
        'You create Korean practice content for a self-directed learner.',
        `Generate exactly ${input.sentenceCount} Korean sentences on the topic "${input.topic}" at ${toDifficultyBadge(input.difficulty)} (${input.difficulty}) difficulty level.`,
        `Return exactly ${input.sentenceCount} sentences, no more and no less.`,
        'Return natural Korean sentences only, with no translations, romanization, numbering, or markdown.',
        'Keep the sentences focused on one topic and make the difficulty match the requested level.',
    ].join(' ');
}
export function buildGenerationUserPrompt(input) {
    return [
        `Generate exactly ${input.sentenceCount} Korean practice sentences about: ${input.topic}.`,
        `Target difficulty: ${toDifficultyBadge(input.difficulty)} (${input.difficulty}).`,
        `Return exactly ${input.sentenceCount} sentences in JSON using the sentences array only.`,
    ].join(' ');
}
export function buildValidationSystemPrompt() {
    return [
        'You validate the overall difficulty of Korean practice sentences.',
        'Respond with accepted when the generated content matches the requested level.',
        'Respond with relabeled when the content is still useful but better fits a neighboring level.',
        'Respond with rejected when the content is unusable, off-topic, or too far from the requested level to save safely.',
    ].join(' ');
}
export function buildValidationUserPrompt(input) {
    return [
        `Topic: ${input.topic}`,
        `Requested difficulty: ${toDifficultyBadge(input.requestedDifficulty)} (${input.requestedDifficulty})`,
        'Sentences:',
        ...input.sentences.map((sentence, index) => `${index + 1}. ${sentence}`),
    ].join('\n');
}
export function normalizeDifficultyValidationResult(input, requestedDifficulty) {
    const validationOutcome = input.validationOutcome;
    if (validationOutcome !== 'accepted' && validationOutcome !== 'relabeled' && validationOutcome !== 'rejected') {
        throw new Error('The generation validator returned an invalid result.');
    }
    if (validationOutcome === 'rejected') {
        return {
            validatedDifficulty: null,
            validationOutcome,
            explanation: typeof input.explanation === 'string' && input.explanation.trim().length > 0
                ? input.explanation.trim()
                : 'The generated practice sentences did not match the requested difficulty closely enough to save.',
        };
    }
    const validatedDifficulty = assertRequiredDifficultyLevel(input.validatedDifficulty);
    const normalizedOutcome = validationOutcome === 'accepted' && validatedDifficulty !== requestedDifficulty ? 'relabeled' : validationOutcome;
    return {
        validatedDifficulty,
        validationOutcome: normalizedOutcome,
        explanation: typeof input.explanation === 'string' && input.explanation.trim().length > 0
            ? input.explanation.trim()
            : normalizedOutcome === 'accepted'
                ? `Validated difficulty matches ${toDifficultyBadge(validatedDifficulty)}.`
                : `Validated difficulty was relabeled to ${toDifficultyBadge(validatedDifficulty)}.`,
    };
}
