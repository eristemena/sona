export type DifficultyLevel = 1 | 2 | 3 | null
export type RequiredDifficultyLevel = Exclude<DifficultyLevel, null>
export type DifficultyBadge = '초급' | '중급' | '고급'

const DIFFICULTY_BADGES: Record<RequiredDifficultyLevel, DifficultyBadge> = {
  1: '초급',
  2: '중급',
  3: '고급',
}

export function isRequiredDifficultyLevel(value: unknown): value is RequiredDifficultyLevel {
  return value === 1 || value === 2 || value === 3
}

export function toDifficultyBadge(value: RequiredDifficultyLevel): DifficultyBadge {
  return DIFFICULTY_BADGES[value]
}

export function assertRequiredDifficultyLevel(value: unknown): RequiredDifficultyLevel {
  if (!isRequiredDifficultyLevel(value)) {
    throw new Error('Expected a difficulty level of 1, 2, or 3.')
  }

  return value
}