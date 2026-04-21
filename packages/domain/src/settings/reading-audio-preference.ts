export type ReadingAudioMode = 'standard' | 'learner-slow'
export type ReadingAudioVoice = 'alloy' | 'coral' | 'shimmer'

export const READING_AUDIO_MODE_SETTING_KEY = 'reading.audioMode'
export const READING_AUDIO_VOICE_SETTING_KEY = 'reading.audioVoice'

export interface ReadingAudioPreferenceRecord {
  mode: ReadingAudioMode
}

export interface ReadingAudioVoicePreferenceRecord {
  voice: ReadingAudioVoice
}

export function isReadingAudioMode(value: unknown): value is ReadingAudioMode {
  return value === 'standard' || value === 'learner-slow'
}

export function isReadingAudioVoice(value: unknown): value is ReadingAudioVoice {
  return value === 'alloy' || value === 'coral' || value === 'shimmer'
}

export function normalizeReadingAudioPreferenceRecord(value: unknown): ReadingAudioPreferenceRecord | null {
  if (!value || typeof value !== 'object' || !('mode' in value)) {
    return null
  }

  const mode = (value as { mode?: unknown }).mode
  return isReadingAudioMode(mode) ? { mode } : null
}

export function normalizeReadingAudioVoicePreferenceRecord(value: unknown): ReadingAudioVoicePreferenceRecord | null {
  if (!value || typeof value !== 'object' || !('voice' in value)) {
    return null
  }

  const voice = (value as { voice?: unknown }).voice
  return isReadingAudioVoice(voice) ? { voice } : null
}
