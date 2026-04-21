'use client'

import {
  Clapperboard,
  Ellipsis,
  FileText,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { LibraryItemSummary } from '../../lib/content-library-filters'
import { cn } from '../../lib/utils'
import { getEstimatedReadTimeLabel, getSentenceCountLabel, getSourceTypeLabel } from '../../lib/content-library-filters'
import { Button } from '../ui/button'

function getSourceIcon(sourceType: LibraryItemSummary['sourceType']) {
  switch (sourceType) {
    case 'article':
      return FileText;
    case 'generated':
      return Sparkles
    case 'srt':
      return Clapperboard
  }
}

function getDifficultyTone(difficultyBadge: LibraryItemSummary['difficultyBadge']) {
  switch (difficultyBadge) {
    case '초급':
      return "bg-[color-mix(in_srgb,var(--success)_18%,transparent)] text-(--success)";
    case '중급':
      return "bg-[color-mix(in_srgb,var(--warning)_18%,transparent)] text-(--warning)";
    case '고급':
      return "bg-[color-mix(in_srgb,var(--danger)_18%,transparent)] text-(--danger)";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <article
      className={cn(
        "panel-enter relative min-h-30 rounded-lg border bg-(--bg-surface) px-5 py-4 transition-colors duration-150",
        menuOpen ? "z-40" : "z-0",
        active
          ? "border-(--accent) bg-(--accent-subtle)"
          : "border-(--border) hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-(--text-muted)">
            <Icon aria-hidden="true" className="h-4 w-4" />
            <span>{getSourceTypeLabel(item.sourceType)}</span>
          </div>
          <h3 className="truncate text-[18px] font-semibold text-(--text-primary)">
            {item.title}
          </h3>
        </div>

        <span
          className={cn(
            "rounded-sm px-2 py-1 text-[11px] font-medium",
            getDifficultyTone(item.difficultyBadge),
          )}
        >
          {item.difficultyBadge}
        </span>
      </div>

      <p className="mt-4 text-[13px] text-(--text-secondary)">
        {getSentenceCountLabel(item.blockCount)} ·{" "}
        {getEstimatedReadTimeLabel(item.blockCount)}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Button
          aria-label={`Open ${item.title}`}
          onClick={() => onInspect(item.id)}
          variant={active ? "primary" : "secondary"}
        >
          Open
        </Button>
        <div className="relative" ref={menuRef}>
          <Button
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={`More options for ${item.title}`}
            className="h-8 w-8 px-0"
            onClick={() => setMenuOpen((value) => !value)}
            variant="ghost"
          >
            <Ellipsis aria-hidden="true" className="h-4 w-4" />
          </Button>

          {menuOpen ? (
            <div
              aria-label={`Card actions for ${item.title}`}
              className="absolute right-0 top-10 z-50 min-w-32 rounded-lg border border-(--border) bg-(--bg-elevated) p-1 shadow-[0_10px_24px_rgba(0,0,0,0.22)]"
              role="menu"
            >
              <button
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[14px] text-(--danger) transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--danger)_12%,transparent)]"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(item);
                }}
                role="menuitem"
                type="button"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}