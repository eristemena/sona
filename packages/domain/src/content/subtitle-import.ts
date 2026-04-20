import path from 'node:path'

import { normalizeSearchText } from './content-id.js'

export interface ParsedSubtitleCue {
  id: string
  startSeconds: number
  endSeconds: number
  text: string
}

const KOREAN_TEXT_PATTERN = /[\u3131-\u318E\uAC00-\uD7A3]/
const SENTENCE_PATTERN = /[^.!?。！？\n]+[.!?。！？]?/g

export function isSupportedSubtitlePath(filePath: string): boolean {
  return path.extname(filePath).toLowerCase() === '.srt'
}

export function deriveSubtitleTitle(filePath: string, providedTitle?: string): string {
  const trimmedTitle = providedTitle?.trim()
  if (trimmedTitle) {
    return trimmedTitle
  }

  const baseName = path.basename(filePath, path.extname(filePath)).trim()
  return baseName || 'Imported subtitles'
}

export function normalizeSubtitleCueText(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function hasUsableKoreanSubtitleText(text: string): boolean {
  return KOREAN_TEXT_PATTERN.test(text)
}

export function splitSubtitleCueText(text: string): string[] {
  const normalized = normalizeSubtitleCueText(text)

  if (!normalized) {
    return []
  }

  const matches = normalized.match(SENTENCE_PATTERN)?.map((segment) => segment.trim()).filter(Boolean) ?? []
  return matches.length > 0 ? matches : [normalized]
}

export function createSubtitleSearchText(title: string, lines: string[]): string {
  return normalizeSearchText([title, ...lines].join(' '))
}

export function createSubtitleDuplicateCheckText(lines: string[]): string {
  return normalizeSearchText(lines.join(' '))
}