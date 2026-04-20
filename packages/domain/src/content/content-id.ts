import type { ContentSourceType } from './content-block.js'

function encodeSourceLocator(locator: string): string {
  return encodeURIComponent(locator)
}

export function normalizeSearchText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

export function buildContentItemId(input: {
  sourceType: ContentSourceType
  sourceLocator: string
  createdAt: number
}): string {
  return [input.sourceType, encodeSourceLocator(input.sourceLocator), String(input.createdAt)].join(':')
}

export function buildContentBlockId(input: {
  sourceType: ContentSourceType
  sourceLocator: string
  contentItemCreatedAt: number
  sentenceOrdinal: number
}): string {
  return [
    input.sourceType,
    encodeSourceLocator(input.sourceLocator),
    String(input.contentItemCreatedAt),
    String(input.sentenceOrdinal),
  ].join(':')
}