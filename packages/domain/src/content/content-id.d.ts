import type { ContentSourceType } from './content-block.js';
export declare function normalizeSearchText(value: string): string;
export declare function buildContentItemId(input: {
    sourceType: ContentSourceType;
    sourceLocator: string;
    createdAt: number;
}): string;
export declare function buildContentBlockId(input: {
    sourceType: ContentSourceType;
    sourceLocator: string;
    contentItemCreatedAt: number;
    sentenceOrdinal: number;
}): string;
//# sourceMappingURL=content-id.d.ts.map