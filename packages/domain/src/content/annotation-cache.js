export function createLookupUnavailableResult(token) {
    return {
        canonicalForm: token,
        surface: token,
        meaning: 'Unavailable offline',
        romanization: '',
        pattern: 'Lookup unavailable',
        register: 'Offline',
        sentenceTranslation: 'Lookup is not available yet for this reading session.',
        grammarExplanation: null,
        cacheState: 'miss',
        modelId: null,
    };
}
export function toWordLookupResult(entry) {
    return {
        canonicalForm: entry.canonicalForm,
        surface: entry.surface,
        meaning: entry.meaning,
        romanization: entry.romanization,
        pattern: entry.pattern,
        register: entry.register,
        sentenceTranslation: entry.sentenceTranslation,
        grammarExplanation: entry.grammarExplanation,
        cacheState: entry.refreshState,
        modelId: entry.modelId,
    };
}
