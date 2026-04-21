export type AnnotationCacheState = 'fresh' | 'stale' | 'refreshing' | 'miss';
export interface WordLookupInput {
    blockId: string;
    token: string;
    tokenIndex: number;
    sentenceContext: string;
}
export interface WordLookupResult {
    canonicalForm: string;
    surface: string;
    meaning: string;
    romanization: string;
    pattern: string;
    register: string;
    sentenceTranslation: string;
    grammarExplanation: string | null;
    cacheState: AnnotationCacheState;
    modelId: string | null;
}
export interface GrammarExplanationInput extends WordLookupInput {
    canonicalForm?: string;
}
export interface AnnotationCacheEntry {
    id: string;
    canonicalForm: string;
    sentenceContextHash: string;
    surface: string;
    meaning: string;
    romanization: string;
    pattern: string;
    register: string;
    sentenceTranslation: string;
    grammarExplanation: string | null;
    modelId: string;
    responseJson: string;
    createdAt: number;
    refreshedAt: number;
    staleAfter: number;
    lastServedAt: number;
    refreshState: Exclude<AnnotationCacheState, 'miss'>;
}
export declare function createLookupUnavailableResult(token: string): WordLookupResult;
export declare function toWordLookupResult(entry: AnnotationCacheEntry): WordLookupResult;
//# sourceMappingURL=annotation-cache.d.ts.map