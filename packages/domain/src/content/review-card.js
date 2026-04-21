export function createReviewCaptureUnavailableResult() {
    return {
        disposition: 'deferred',
        reviewCardId: null,
        message: 'Add to deck is not available yet for synced reading.',
    };
}
