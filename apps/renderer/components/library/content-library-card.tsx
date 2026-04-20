'use client'

import { Clapperboard, Newspaper, Sparkles, Trash2 } from 'lucide-react'

import type { LibraryItemSummary } from '../../lib/content-library-filters'
import { cn } from '../../lib/utils'
import { getEstimatedReadTimeLabel, getSentenceCountLabel, getSourceTypeLabel } from '../../lib/content-library-filters'
import { Button } from '../ui/button'

function getSourceIcon(sourceType: LibraryItemSummary['sourceType']) {
  switch (sourceType) {
    case 'article':
      return Newspaper
    case 'generated':
      return Sparkles
    case 'srt':
      return Clapperboard
  }
}

function getDifficultyTone(difficultyBadge: LibraryItemSummary['difficultyBadge']) {
  switch (difficultyBadge) {
    case '초급':
      return 'bg-[color:color-mix(in_srgb,var(--success)_18%,transparent)] text-[color:var(--success)]'
    case '중급':
      return 'bg-[color:color-mix(in_srgb,var(--warning)_18%,transparent)] text-[color:var(--warning)]'
    case '고급':
      return 'bg-[color:color-mix(in_srgb,var(--danger)_18%,transparent)] text-[color:var(--danger)]'
  }
}

interface ContentLibraryCardProps {
  active: boolean
  item: LibraryItemSummary
  onDelete: (item: LibraryItemSummary) => void
  onInspect: (contentItemId: string) => void
}

export function ContentLibraryCard({ active, item, onDelete, onInspect }: ContentLibraryCardProps) {
  const Icon = getSourceIcon(item.sourceType)

  return (
    <article
      className={cn(
        'panel-enter min-h-[120px] rounded-lg border bg-(--bg-surface) px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-all duration-150',
        active
          ? 'border-(--accent) bg-(--accent-subtle)'
          : 'border-(--border) hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-(--text-muted)">
            <Icon aria-hidden="true" className="h-4 w-4" />
            <span>{getSourceTypeLabel(item.sourceType)}</span>
          </div>
          <h3 className="truncate text-[18px] font-semibold text-(--text-primary)">{item.title}</h3>
        </div>

        <span className={cn('rounded-sm px-2 py-1 text-[11px] font-medium', getDifficultyTone(item.difficultyBadge))}>
          {item.difficultyBadge}
        </span>
      </div>

      <p className="mt-4 text-[13px] text-(--text-secondary)">
        {getSentenceCountLabel(item.blockCount)} · {getEstimatedReadTimeLabel(item.blockCount)}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Button aria-label={`Open ${item.title}`} onClick={() => onInspect(item.id)} variant={active ? 'primary' : 'secondary'}>
          Open
        </Button>
        <Button aria-label={`Delete ${item.title}`} className="h-8 w-8 px-0" onClick={() => onDelete(item)} variant="ghost">
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </article>
  )
}