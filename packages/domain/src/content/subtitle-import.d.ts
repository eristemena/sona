export interface ParsedSubtitleCue {
    id: string;
    startSeconds: number;
    endSeconds: number;
    text: string;
}
export declare function isSupportedSubtitlePath(filePath: string): boolean;
export declare function deriveSubtitleTitle(filePath: string, providedTitle?: string): string;
export declare function normalizeSubtitleCueText(text: string): string;
export declare function hasUsableKoreanSubtitleText(text: string): boolean;
export declare function splitSubtitleCueText(text: string): string[];
export declare function createSubtitleSearchText(title: string, lines: string[]): string;
export declare function createSubtitleDuplicateCheckText(lines: string[]): string;
//# sourceMappingURL=subtitle-import.d.ts.map