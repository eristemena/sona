export function createDefaultReadingProgress() {
    return {
        activeBlockId: null,
        playbackState: 'idle',
        playbackRate: 1,
        currentTimeMs: 0,
        highlightedTokenIndex: null,
    };
}
