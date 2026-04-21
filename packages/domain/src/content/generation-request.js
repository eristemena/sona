import { normalizeSearchText } from './content-id.js';
export const PRACTICE_SENTENCE_MODELS = {
    generator: 'anthropic/claude-3-5-haiku',
    validator: 'openai/gpt-4o-mini',
};
export function normalizeGenerationTopic(topic) {
    return topic.trim().replace(/\s+/g, ' ');
}
export function assertGenerationTopic(topic) {
    const normalizedTopic = normalizeGenerationTopic(topic);
    if (!normalizedTopic) {
        throw new Error('Enter a topic to generate practice sentences.');
    }
    return normalizedTopic;
}
export function normalizeGeneratedSentences(sentences) {
    return sentences.map((sentence) => sentence.trim().replace(/\s+/g, ' ')).filter((sentence) => sentence.length > 0);
}
export function deriveGeneratedTitle(topic) {
    return `${assertGenerationTopic(topic)} Practice`;
}
export function createGeneratedSearchText(title, topic, sentences) {
    return normalizeSearchText([title, topic, ...normalizeGeneratedSentences(sentences)].join(' '));
}
export function createGeneratedDuplicateCheckText(sentences) {
    return normalizeSearchText(normalizeGeneratedSentences(sentences).join(' '));
}
export function formatGenerationProvenanceDetail(input) {
    const parts = [
        `Topic: ${assertGenerationTopic(input.topic)}`,
        `requested difficulty: ${input.requestedDifficultyBadge}`,
        `validated difficulty: ${input.validatedDifficultyBadge}`,
    ];
    if (input.validationOutcome === 'relabeled' && input.requestedDifficulty !== input.validatedDifficulty) {
        parts.push('validation outcome: relabeled');
    }
    return parts.join(' · ');
}
