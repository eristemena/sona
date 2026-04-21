export type AddToDeckDisposition = 'created' | 'duplicate-blocked' | 'deferred';
export interface AddToDeckInput {
    blockId: string;
    token: string;
    canonicalForm: string;
    sentenceContext: string;
}
export interface AddToDeckResult {
    disposition: AddToDeckDisposition;
    reviewCardId: string | null;
    message: string;
}
export interface ExposureLogEntry {
    blockId: string;
    token: string;
    seenAt: number;
}
export interface ExposureLogInput {
    entries: ExposureLogEntry[];
}
export interface ExposureLogResult {
    written: number;
}
export interface ReviewCardRecord {
    id: string;
    canonicalForm: string;
    surface: string;
    sourceBlockId: string;
    sourceContentItemId: string;
    sentenceContextHash: string;
    fsrsState: string;
    dueAt: number;
    stability: number;
    difficulty: number;
    elapsedDays: number;
    scheduledDays: number;
    reps: number;
    lapses: number;
    lastReviewAt: number | null;
    activationState: AddToDeckDisposition;
    createdAt: number;
}
export declare function createReviewCaptureUnavailableResult(): AddToDeckResult;
//# sourceMappingURL=review-card.d.ts.map