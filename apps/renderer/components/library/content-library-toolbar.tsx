'use client'

import { Search } from 'lucide-react'

import type { LibraryFilter } from '@sona/domain/contracts/content-library'

import { CONTENT_LIBRARY_FILTER_OPTIONS } from '../../lib/content-library-filters'
import { Button } from '../ui/button'

interface ContentLibraryToolbarProps {
  activeFilter: LibraryFilter
  onOpenAddContent: () => void
  resultCount: number
  search: string
  onFilterChange: (filter: LibraryFilter) => void
  onSearchChange: (value: string) => void
}

export function ContentLibraryToolbar({
  activeFilter,
  onOpenAddContent,
  resultCount,
  search,
  onFilterChange,
  onSearchChange,
}: ContentLibraryToolbarProps) {
  return (
    <section aria-label="Content Library controls" className="panel-enter space-y-4 border-b border-(--border) pb-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-[22px] font-semibold leading-tight text-(--text-primary)">Saved content</h2>
          <p className="text-[13px] text-(--text-secondary)">{resultCount} item{resultCount === 1 ? '' : 's'} in your local library</p>
        </div>

        <div className="flex flex-col gap-3 lg:min-w-[280px] lg:items-end">
          <Button className="self-start lg:self-auto" onClick={onOpenAddContent} variant="primary">
            Add content
          </Button>
        </div>
      </div>

      <label className="block min-w-0">
        <span className="sr-only">Search library</span>
        <span className="flex h-9 items-center gap-2 rounded-[6px] border border-(--border) bg-(--bg-surface) px-3 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--accent)">
          <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-(--text-muted)" />
          <input
            aria-label="Search library"
            className="w-full min-w-0 border-none bg-transparent text-[14px] text-(--text-primary) outline-none placeholder:text-(--text-muted)"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by title or source"
            type="text"
            value={search}
          />
        </span>
      </label>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Content type filters">
        {CONTENT_LIBRARY_FILTER_OPTIONS.map((option) => {
          const active = option.id === activeFilter

          return (
            <Button
              aria-pressed={active}
              className="rounded-full px-4"
              key={option.id}
              onClick={() => onFilterChange(option.id)}
              title={option.description}
              variant={active ? 'primary' : 'secondary'}
            >
              {option.label}
            </Button>
          )
        })}
      </div>
    </section>
  )
}