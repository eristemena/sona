import path from 'node:path';
import { normalizeSearchText } from './content-id.js';
const KOREAN_TEXT_PATTERN = /[\u3131-\u318E\uAC00-\uD7A3]/;
const SENTENCE_PATTERN = /[^.!?。！？\n]+[.!?。！？]?/g;
export function isSupportedSubtitlePath(filePath) {
    return path.extname(filePath).toLowerCase() === '.srt';
}
export function deriveSubtitleTitle(filePath, providedTitle) {
    const trimmedTitle = providedTitle?.trim();
    if (trimmedTitle) {
        return trimmedTitle;
    }
    const baseName = path.basename(filePath, path.extname(filePath)).trim();
    return baseName || 'Imported subtitles';
}
export function normalizeSubtitleCueText(text) {
    return text
        .replace(/<[^>]+>/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
export function hasUsableKoreanSubtitleText(text) {
    return KOREAN_TEXT_PATTERN.test(text);
}
export function splitSubtitleCueText(text) {
    const normalized = normalizeSubtitleCueText(text);
    if (!normalized) {
        return [];
    }
    const matches = normalized.match(SENTENCE_PATTERN)?.map((segment) => segment.trim()).filter(Boolean) ?? [];
    return matches.length > 0 ? matches : [normalized];
}
export function createSubtitleSearchText(title, lines) {
    return normalizeSearchText([title, ...lines].join(' '));
}
export function createSubtitleDuplicateCheckText(lines) {
    return normalizeSearchText(lines.join(' '));
}
