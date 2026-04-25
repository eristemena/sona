import { createHash } from 'node:crypto'
import { existsSync, statSync } from 'node:fs'

const AUDIO_CACHE_PROFILE_VERSION = 'v1'
const AUDIO_CACHE_FORMAT = 'mp3'

export function buildContentAddressedAudioFileName(
  text: string,
  modelId: string,
  mode: string,
  voice: string,
): string {
  const normalized = text.trim().replace(/\s+/g, ' ')
  const hash = createHash('sha256')
    .update(`${AUDIO_CACHE_PROFILE_VERSION}:${modelId}:${mode}:${voice}:${normalized}`)
    .digest('hex')

  return `${hash}.${AUDIO_CACHE_FORMAT}`
}

export function hasCachedAudioFile(filePath: string): boolean {
  if (!existsSync(filePath)) {
    return false
  }

  try {
    return statSync(filePath).size > 0
  } catch {
    return false
  }
}
