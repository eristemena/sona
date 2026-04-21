const DIFFICULTY_BADGES = {
    1: '초급',
    2: '중급',
    3: '고급',
};
export function isRequiredDifficultyLevel(value) {
    return value === 1 || value === 2 || value === 3;
}
export function toDifficultyBadge(value) {
    return DIFFICULTY_BADGES[value];
}
export function assertRequiredDifficultyLevel(value) {
    if (!isRequiredDifficultyLevel(value)) {
        throw new Error('Expected a difficulty level of 1, 2, or 3.');
    }
    return value;
}
