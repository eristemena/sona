const KOREAN_TEXT_PATTERN = /[\u3131-\u318E\uAC00-\uD7A3]/u;
export function hasUsableKoreanArticleText(text) {
    return KOREAN_TEXT_PATTERN.test(text);
}
export function normalizeArticleText(text) {
    return text
        .replace(/\r/g, '\n')
        .replace(/[\t\f\v]+/g, ' ')
        .replace(/\u00a0/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/ {2,}/g, ' ')
        .trim();
}
export function splitKoreanArticleSentences(text) {
    const normalized = normalizeArticleText(text);
    if (!normalized) {
        return [];
    }
    const paragraphs = normalized
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
    const sentences = paragraphs.flatMap((paragraph) => {
        const collapsed = paragraph.replace(/\n+/g, ' ').trim();
        const fragments = collapsed
            .split(/(?<=[.!?。！？])\s+/u)
            .map((fragment) => fragment.trim())
            .filter(Boolean);
        return fragments.length > 0 ? fragments : [collapsed];
    });
    return sentences.filter(hasUsableKoreanArticleText);
}
