import type { LibraryFilter, SaveContentSuccess } from '@sona/domain/contracts/content-library'

export interface ContentLibraryFilterOption {
  id: LibraryFilter
  label: string
  description: string
}

export const CONTENT_LIBRARY_FILTER_OPTIONS: ContentLibraryFilterOption[] = [
  { id: 'all', label: 'All', description: 'Every saved source' },
  { id: 'article', label: 'Articles', description: 'Pasted or scraped reading material' },
  { id: 'srt', label: 'Subtitles', description: 'Imported drama dialogue' },
  { id: 'generated', label: 'Generated', description: 'AI-created practice sentences' },
]

export type LibraryItemSummary = SaveContentSuccess['item']
export type ContentBlockSummary = SaveContentSuccess['blocks'][number]

const SOURCE_TYPE_LABELS: Record<LibraryItemSummary['sourceType'], string> = {
  article: 'Article',
  generated: 'Generated',
  srt: 'Subtitle',
}

export function getSourceTypeLabel(sourceType: LibraryItemSummary['sourceType']): string {
  return SOURCE_TYPE_LABELS[sourceType]
}

export function getContentLibraryEmptyState(input: { filter: LibraryFilter; search: string }) {
  const hasSearch = input.search.trim().length > 0
  const isFiltered = input.filter !== 'all'

  if (hasSearch || isFiltered) {
    return {
      title: hasSearch ? `No results for "${input.search.trim()}"` : 'No items in this view',
      description: 'Try a different search term or clear the filter.',
    }
  }

  return {
    title: 'Your library is empty',
    description: 'Import a drama subtitle file, paste a Korean article, or generate practice sentences to get started.',
  }
}

export function getSentenceCountLabel(blockCount: number): string {
  return `${blockCount} ${blockCount === 1 ? 'sentence' : 'sentences'}`
}

export function getEstimatedReadTimeLabel(blockCount: number): string {
  const minutes = Math.max(1, Math.round(blockCount / 36))
  return `~${minutes} min read`
}