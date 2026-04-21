export declare function normalizeArticleUrl(url: string): string;
export declare function extractArticleSource(html: string): {
    title: string | null;
    text: string;
};
export declare function deriveArticleTitle(input: {
    providedTitle?: string;
    scrapedTitle?: string | null;
    url?: string;
    text: string;
}): string;
export declare function createArticleSearchText(title: string, sentences: string[], sourceDetail?: string): string;
export declare function createArticleDuplicateCheckText(sentences: string[]): string;
//# sourceMappingURL=article-source.d.ts.map