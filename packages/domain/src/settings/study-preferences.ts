import {
  isReadingAudioVoice,
  type ReadingAudioVoice,
} from './reading-audio-preference.js'

export const OPENROUTER_API_KEY_SETTING_KEY = 'integrations.openRouterApiKey'
export const STUDY_TTS_VOICE_SETTING_KEY = 'study.ttsVoice'
export const STUDY_KOREAN_LEVEL_SETTING_KEY = 'study.koreanLevel'
export const STUDY_MAX_LLM_CALLS_SETTING_KEY = 'study.maxLlmCallsPerSession'
export const STUDY_ANNOTATION_CACHE_DAYS_SETTING_KEY = 'study.annotationCacheDays'
export const DEFAULT_DAILY_STUDY_GOAL = 20
export const DEFAULT_STUDY_KOREAN_LEVEL = 'topik-i-core' as const
export const DEFAULT_MAX_LLM_CALLS_PER_SESSION = 12
export const DEFAULT_ANNOTATION_CACHE_DAYS = 14
export const STUDY_PREFERENCES_SAMPLE_TEXT = '안녕하세요, 소나입니다.' as const

export type StudyKoreanLevel = 'topik-i-core' | 'topik-ii-core'

export interface StudyTtsVoiceRecord {
  voice: ReadingAudioVoice
  updatedAt: number
}

export const STUDY_TTS_VOICE_OPTIONS: Array<{
  id: ReadingAudioVoice
  label: string
  description: string
}> = [
  {
    id: 'alloy',
    label: 'Alloy',
    description: 'Balanced and neutral for everyday listening.',
  },
  {
    id: 'nova',
    label: 'Nova',
    description: 'Clear and steady for longer study sessions.',
  },
  {
    id: 'shimmer',
    label: 'Shimmer',
    description: 'Softer and brighter if you want a lighter tone.',
  },
  {
    id: 'echo',
    label: 'Echo',
    description: 'Crisp and direct for short listening reps.',
  },
  {
    id: 'fable',
    label: 'Fable',
    description: 'Smoother and warmer for relaxed playback.',
  },
  {
    id: 'onyx',
    label: 'Onyx',
    description: 'Lower and grounded for contrast-heavy speech.',
  },
]

export const STUDY_KOREAN_LEVEL_OPTIONS: Array<{
  id: StudyKoreanLevel
  label: string
}> = [
  {
    id: 'topik-i-core',
    label: 'TOPIK I',
  },
  {
    id: 'topik-ii-core',
    label: 'TOPIK II',
  },
]

export function isStudyKoreanLevel(value: unknown): value is StudyKoreanLevel {
  return value === 'topik-i-core' || value === 'topik-ii-core'
}

export function normalizeStudyKoreanLevelRecord(
  value: unknown,
): { level: StudyKoreanLevel; updatedAt: number } | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as { level?: unknown; updatedAt?: unknown }
  if (!isStudyKoreanLevel(record.level)) {
    return null
  }

  const updatedAt =
    typeof record.updatedAt === 'number' && Number.isFinite(record.updatedAt)
      ? record.updatedAt
      : Date.now()

  return {
    level: record.level,
    updatedAt,
  }
}

export function normalizeStudyTtsVoiceRecord(value: unknown): StudyTtsVoiceRecord | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as { voice?: unknown; updatedAt?: unknown }
  if (!isReadingAudioVoice(record.voice)) {
    return null
  }

  const updatedAt =
    typeof record.updatedAt === 'number' && Number.isFinite(record.updatedAt)
      ? record.updatedAt
      : Date.now()

  return {
    voice: record.voice,
    updatedAt,
  }
}