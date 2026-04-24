'use client'

import { Search } from 'lucide-react'

import type { LibraryFilter } from '@sona/domain/contracts/content-library'

import {
  CONTENT_LIBRARY_FILTER_OPTIONS,
  CONTENT_LIBRARY_SORT_OPTIONS,
  type LibrarySortOption,
} from "../../lib/content-library-filters";
import { Button } from '../ui/button'

interface ContentLibraryToolbarProps {
  activeFilter: LibraryFilter;
  activeSort: LibrarySortOption;
  onOpenAddContent: () => void;
  resultCount: number;
  search: string;
  onFilterChange: (filter: LibraryFilter) => void;
  onSearchChange: (value: string) => void;
  onSortChange: (sort: LibrarySortOption) => void;
}

export function ContentLibraryToolbar({
  activeFilter,
  activeSort,
  onOpenAddContent,
  resultCount,
  search,
  onFilterChange,
  onSearchChange,
  onSortChange,
}: ContentLibraryToolbarProps) {
  return (
    <section
      aria-label="Content Library controls"
      className="panel-enter space-y-4"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-[22px] font-semibold leading-tight text-(--text-primary)">
            Saved content
          </h2>
          <p className="text-[13px] text-(--text-secondary)">
            {resultCount} item{resultCount === 1 ? "" : "s"} in your local
            library
          </p>
        </div>

        <div className="flex justify-start lg:justify-end">
          <Button
            className="h-9 self-start px-4 lg:self-auto"
            onClick={onOpenAddContent}
            variant="primary"
          >
            Add content
          </Button>
        </div>
      </div>

      <label className="block min-w-0">
        <span className="sr-only">Search library</span>
        <span className="flex h-9 items-center gap-2 rounded-[6px] border border-(--border) bg-(--bg-surface) px-3 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--accent)">
          <Search
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-(--text-muted)"
          />
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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Content type filters"
        >
          {CONTENT_LIBRARY_FILTER_OPTIONS.map((option) => {
            const active = option.id === activeFilter;

            return (
              <button
                aria-pressed={active}
                className={
                  active
                    ? "rounded-full bg-(--accent) px-4 py-1.5 text-[14px] font-medium text-white transition-colors duration-150"
                    : "rounded-full border border-(--border) px-4 py-1.5 text-[14px] font-medium text-(--text-secondary) transition-colors duration-150 hover:bg-(--bg-elevated) hover:text-(--text-primary)"
                }
                key={option.id}
                onClick={() => onFilterChange(option.id)}
                title={option.description}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2 self-start lg:self-auto">
          <span className="text-[13px] text-(--text-secondary)">Sort</span>
          <select
            aria-label="Sort library"
            className="h-9 min-w-42 rounded-[6px] border border-(--border) bg-(--bg-surface) px-3 text-[14px] text-(--text-primary) outline-none focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-(--accent)"
            onChange={(event) =>
              onSortChange(event.target.value as LibrarySortOption)
            }
            value={activeSort}
          >
            {CONTENT_LIBRARY_SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}