export type DifficultyLevel = 1 | 2 | 3 | null;
export type RequiredDifficultyLevel = Exclude<DifficultyLevel, null>;
export type DifficultyBadge = '초급' | '중급' | '고급';
export declare function isRequiredDifficultyLevel(value: unknown): value is RequiredDifficultyLevel;
export declare function toDifficultyBadge(value: RequiredDifficultyLevel): DifficultyBadge;
export declare function assertRequiredDifficultyLevel(value: unknown): RequiredDifficultyLevel;
//# sourceMappingURL=difficulty.d.ts.map