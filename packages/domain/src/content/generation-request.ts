import type { ValidationOutcome } from './content-library-item.js'
import type { RequiredDifficultyLevel } from './difficulty.js'
import { normalizeSearchText } from './content-id.js'

export const PRACTICE_SENTENCE_MODELS = {
  generator: 'anthropic/claude-3-5-haiku',
  validator: 'openai/gpt-4o-mini',
} as const

export interface GeneratedPracticeContent {
  title: string
  sentences: string[]
}

export function normalizeGenerationTopic(topic: string): string {
  return topic.trim().replace(/\s+/g, ' ')
}

export function assertGenerationTopic(topic: string): string {
  const normalizedTopic = normalizeGenerationTopic(topic)

  if (!normalizedTopic) {
    throw new Error('Enter a topic to generate practice sentences.')
  }

  return normalizedTopic
}

export function normalizeGeneratedSentences(sentences: string[]): string[] {
  return sentences.map((sentence) => sentence.trim().replace(/\s+/g, ' ')).filter((sentence) => sentence.length > 0)
}

export function deriveGeneratedTitle(topic: string): string {
  return `${assertGenerationTopic(topic)} Practice`
}

export function createGeneratedSearchText(title: string, topic: string, sentences: string[]): string {
  return normalizeSearchText([title, topic, ...normalizeGeneratedSentences(sentences)].join(' '))
}

export function createGeneratedDuplicateCheckText(sentences: string[]): string {
  return normalizeSearchText(normalizeGeneratedSentences(sentences).join(' '))
}

export function formatGenerationProvenanceDetail(input: {
  topic: string
  requestedDifficulty: RequiredDifficultyLevel
  validatedDifficulty: RequiredDifficultyLevel
  validationOutcome: Exclude<ValidationOutcome, 'rejected'>
  requestedDifficultyBadge: string
  validatedDifficultyBadge: string
}): string {
  const parts = [
    `Topic: ${assertGenerationTopic(input.topic)}`,
    `requested difficulty: ${input.requestedDifficultyBadge}`,
    `validated difficulty: ${input.validatedDifficultyBadge}`,
  ]

  if (input.validationOutcome === 'relabeled' && input.requestedDifficulty !== input.validatedDifficulty) {
    parts.push('validation outcome: relabeled')
  }

  return parts.join(' · ')
}