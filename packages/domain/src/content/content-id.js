function encodeSourceLocator(locator) {
    return encodeURIComponent(locator);
}
export function normalizeSearchText(value) {
    return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}
export function buildContentItemId(input) {
    return [input.sourceType, encodeSourceLocator(input.sourceLocator), String(input.createdAt)].join(':');
}
export function buildContentBlockId(input) {
    return [
        input.sourceType,
        encodeSourceLocator(input.sourceLocator),
        String(input.contentItemCreatedAt),
        String(input.sentenceOrdinal),
    ].join(':');
}
