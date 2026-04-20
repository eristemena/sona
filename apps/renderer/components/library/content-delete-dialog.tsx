'use client'

import type { LibraryItemSummary } from '../../lib/content-library-filters'
import { Button } from '../ui/button'

interface ContentDeleteDialogProps {
  deleting: boolean
  item: LibraryItemSummary | null
  onCancel: () => void
  onConfirm: (contentItemId: string) => void
}

export function ContentDeleteDialog({ deleting, item, onCancel, onConfirm }: ContentDeleteDialogProps) {
  if (!item) {
    return null
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-[color:color-mix(in_srgb,var(--bg-base)_72%,transparent)] p-4 backdrop-blur-sm">
      <div
        aria-describedby="content-delete-description"
        aria-labelledby="content-delete-title"
        aria-modal="true"
        className="w-full max-w-md rounded-[12px] border border-(--border) bg-(--bg-surface) p-6 shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
        role="dialog"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-(--text-muted)">Delete library item</p>
        <h2 className="mt-3 text-xl font-semibold text-(--text-primary)" id="content-delete-title">
          Remove {item.title}?
        </h2>
        <p className="mt-3 text-sm leading-6 text-(--text-secondary)" id="content-delete-description">
          This removes the saved content and its sentence blocks from the local library. It does not create any review work or recovery backlog.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onCancel} variant="secondary">
            Cancel
          </Button>
          <Button disabled={deleting} onClick={() => onConfirm(item.id)} variant="danger">
            {deleting ? 'Deleting…' : 'Delete item'}
          </Button>
        </div>
      </div>
    </div>
  )
}