'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { RequiredDifficultyLevel } from '@sona/domain/contracts/content-library'
import type { UpdateContentInput, UpdateContentResult } from '@sona/domain/contracts/content-library'

import type { ContentBlockSummary } from '../../lib/content-library-filters'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'

const DIFFICULTY_OPTIONS = [
  { value: 1, label: '초급' },
  { value: 2, label: '중급' },
  { value: 3, label: '고급' },
] as const

interface EditBlock {
  tempId: string
  blockId: string | null
  korean: string
  originalKorean: string
  isNew: boolean
  sentenceOrdinal: number
}

interface ContentEditViewProps {
  contentItemId: string
  initialTitle: string
  initialDifficulty: RequiredDifficultyLevel
  initialBlocks: ContentBlockSummary[]
  onSave: (input: UpdateContentInput) => Promise<UpdateContentResult>
  onDiscard: () => void
}

export function ContentEditView({
  contentItemId,
  initialTitle,
  initialDifficulty,
  initialBlocks,
  onSave,
  onDiscard,
}: ContentEditViewProps) {
  const [title, setTitle] = useState(initialTitle)
  const [difficulty, setDifficulty] = useState<RequiredDifficultyLevel>(initialDifficulty)
  const [blocks, setBlocks] = useState<EditBlock[]>(() =>
    initialBlocks.map((b) => ({
      tempId: b.id,
      blockId: b.id,
      korean: b.korean,
      originalKorean: b.korean,
      isNew: false,
      sentenceOrdinal: b.sentenceOrdinal,
    })),
  )
  const [deletedBlockIds, setDeletedBlockIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reviewCardWarning, setReviewCardWarning] = useState<{
    message: string
    pendingInput: UpdateContentInput
  } | null>(null)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const nextTempIdRef = useRef(1)

  const hasChanges = useMemo(() => {
    if (title !== initialTitle) return true
    if (difficulty !== initialDifficulty) return true
    if (deletedBlockIds.length > 0) return true
    if (blocks.some((b) => b.isNew)) return true
    if (blocks.some((b) => !b.isNew && b.korean !== b.originalKorean)) return true
    return false
  }, [title, initialTitle, difficulty, initialDifficulty, deletedBlockIds, blocks])

  const canSave = blocks.length > 0 && hasChanges

  function handleBlockTextChange(tempId: string, value: string) {
    setBlocks((prev) =>
      prev.map((b) => (b.tempId === tempId ? { ...b, korean: value } : b)),
    )
  }

  function handleDeleteBlock(tempId: string) {
    setBlocks((prev) => {
      const block = prev.find((b) => b.tempId === tempId)
      if (!block) return prev

      if (!block.isNew && block.blockId) {
        setDeletedBlockIds((ids) => [...ids, block.blockId!])
      }

      return prev.filter((b) => b.tempId !== tempId)
    })
  }

  function handleAddBlock(afterIndex: number) {
    const newTempId = `new-${nextTempIdRef.current++}`
    const newBlock: EditBlock = {
      tempId: newTempId,
      blockId: null,
      korean: '',
      originalKorean: '',
      isNew: true,
      sentenceOrdinal: 0,
    }

    setBlocks((prev) => {
      const next = [...prev]
      next.splice(afterIndex + 1, 0, newBlock)
      return next
    })
  }

  function buildUpdateInput(acknowledgeReviewCardDeletion?: boolean): UpdateContentInput {
    const blockOps: UpdateContentInput['blockOps'] = []

    for (const id of deletedBlockIds) {
      blockOps.push({ op: 'delete', blockId: id })
    }

    for (const block of blocks) {
      if (!block.isNew && block.blockId && block.korean !== block.originalKorean) {
        blockOps.push({ op: 'edit', blockId: block.blockId, korean: block.korean })
      }
    }

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]!
      if (!block.isNew) continue

      let insertAfterOrdinal = 0
      for (let j = i - 1; j >= 0; j--) {
        const prev = blocks[j]!
        if (!prev.isNew && prev.blockId) {
          insertAfterOrdinal = prev.sentenceOrdinal
          break
        }
      }

      blockOps.push({ op: 'add', korean: block.korean, insertAfterOrdinal })
    }

    return {
      contentItemId,
      ...(title !== initialTitle ? { title } : {}),
      ...(difficulty !== initialDifficulty ? { difficulty } : {}),
      blockOps,
      ...(acknowledgeReviewCardDeletion ? { acknowledgeReviewCardDeletion: true } : {}),
    }
  }

  async function handleSave(acknowledgeReviewCardDeletion?: boolean) {
    setIsSaving(true)
    setErrorMessage(null)

    try {
      const input = buildUpdateInput(acknowledgeReviewCardDeletion)
      const result = await onSave(input)

      if (result.ok) {
        return
      }

      if (result.reason === 'block-has-review-cards') {
        setReviewCardWarning({
          message: result.message,
          pendingInput: input,
        })
        return
      }

      setErrorMessage(result.message)
    } catch {
      setErrorMessage('An unexpected error occurred while saving.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleConfirmReviewCardDeletion() {
    setReviewCardWarning(null)
    await handleSave(true)
  }

  function handleDiscard() {
    if (hasChanges) {
      setShowDiscardConfirm(true)
    } else {
      onDiscard()
    }
  }

  const focusNewBlock = useCallback((el: HTMLTextAreaElement | null) => {
    if (el && el.value === '') {
      el.focus()
    }
  }, [])

  return (
    <section aria-label="Edit content" className="flex min-h-0 flex-1 flex-col">
      <header className="grid h-13 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-b border-(--border) bg-(--bg-base) px-4 md:px-6">
        <Button
          className="h-8 px-3 text-[13px]"
          onClick={handleDiscard}
          variant="ghost"
        >
          Discard
        </Button>

        <h2 className="truncate text-center text-[16px] font-semibold text-(--text-primary)">
          Editing
        </h2>

        <Button
          className="h-8 px-4 text-[13px]"
          disabled={!canSave || isSaving}
          onClick={() => handleSave()}
          variant="primary"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-180 px-6 pb-30 pt-8">
          {errorMessage ? (
            <div className="mb-6 rounded-lg border border-[color-mix(in_srgb,var(--danger)_45%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-4 py-3 text-sm text-(--text-primary)">
              {errorMessage}
            </div>
          ) : null}

          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.18em] text-(--text-muted)">
                Title
              </label>
              <input
                className="mt-2 h-10 w-full rounded-[6px] border border-(--border) bg-(--bg-surface) px-3 text-[15px] text-(--text-primary) outline-none focus:ring-2 focus:ring-(--accent) focus:ring-offset-2 focus:ring-offset-(--bg-base)"
                onChange={(e) => setTitle(e.target.value)}
                type="text"
                value={title}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.18em] text-(--text-muted)">
                Difficulty
              </label>
              <select
                className="mt-2 h-10 rounded-[6px] border border-(--border) bg-(--bg-surface) px-3 text-sm text-(--text-primary) outline-none focus:ring-2 focus:ring-(--accent) focus:ring-offset-2 focus:ring-offset-(--bg-base)"
                onChange={(e) =>
                  setDifficulty(Number(e.target.value) as RequiredDifficultyLevel)
                }
                value={difficulty}
              >
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.18em] text-(--text-muted)">
                Sentences ({blocks.length})
              </h3>
            </div>

            <div className="mt-4 space-y-2">
              <AddBlockButton onClick={() => handleAddBlock(-1)} />

              {blocks.map((block, index) => (
                <div key={block.tempId}>
                  <EditBlockRow
                    block={block}
                    index={index}
                    onDelete={() => handleDeleteBlock(block.tempId)}
                    onTextChange={(value) =>
                      handleBlockTextChange(block.tempId, value)
                    }
                    {...(block.isNew ? { textareaRef: focusNewBlock } : {})}
                  />
                  <AddBlockButton onClick={() => handleAddBlock(index)} />
                </div>
              ))}
            </div>

            {blocks.length === 0 ? (
              <p className="mt-4 text-center text-sm text-(--text-secondary)">
                No sentences. Add at least one to save.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setReviewCardWarning(null)
        }}
        open={reviewCardWarning !== null}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review progress will be affected</DialogTitle>
            <DialogDescription>
              {reviewCardWarning?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setReviewCardWarning(null)} variant="secondary">
              Cancel
            </Button>
            <Button
              disabled={isSaving}
              onClick={handleConfirmReviewCardDeletion}
              variant="danger"
            >
              {isSaving ? 'Saving…' : 'Continue anyway'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setShowDiscardConfirm(false)
        }}
        open={showDiscardConfirm}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              You have unsaved changes that will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowDiscardConfirm(false)} variant="secondary">
              Keep editing
            </Button>
            <Button onClick={onDiscard} variant="danger">
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function EditBlockRow({
  block,
  index,
  onDelete,
  onTextChange,
  textareaRef,
}: {
  block: EditBlock
  index: number
  onDelete: () => void
  onTextChange: (value: string) => void
  textareaRef?: (el: HTMLTextAreaElement | null) => void
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null)
  const isModified = !block.isNew && block.korean !== block.originalKorean

  useEffect(() => {
    const el = ref.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }, [block.korean])

  return (
    <div className="group relative rounded-lg border border-(--border) bg-(--bg-surface) transition-colors duration-100 focus-within:border-(--accent)">
      <div className="flex items-start gap-2 px-4 py-3">
        <span className="mt-1.5 shrink-0 text-[11px] font-medium tabular-nums text-(--text-muted)">
          {index + 1}
        </span>
        <textarea
          className="min-h-[2.4em] flex-1 resize-none bg-transparent text-[16px] leading-[1.8] text-(--text-primary) outline-none placeholder:text-(--text-muted) md:text-[18px]"
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Enter Korean sentence…"
          ref={(el) => {
            ref.current = el
            textareaRef?.(el)
          }}
          rows={1}
          value={block.korean}
        />
        <div className="mt-1 flex shrink-0 items-center gap-1.5">
          {block.isNew ? (
            <span className="rounded-sm bg-(--accent-subtle) px-1.5 py-0.5 text-[10px] font-medium text-(--accent)">
              New
            </span>
          ) : null}
          {isModified ? (
            <span className="rounded-sm bg-[color-mix(in_srgb,var(--warning)_15%,transparent)] px-1.5 py-0.5 text-[10px] font-medium text-(--warning)">
              Edited
            </span>
          ) : null}
          <button
            aria-label={`Delete sentence ${index + 1}`}
            className="flex h-7 w-7 items-center justify-center rounded-md text-(--text-muted) opacity-0 transition-all duration-100 hover:bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] hover:text-(--danger) focus-visible:opacity-100 group-hover:opacity-100"
            onClick={onDelete}
            type="button"
          >
            <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function AddBlockButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-center py-1">
      <button
        className="flex h-7 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium text-(--text-muted) transition-colors duration-100 hover:bg-(--bg-elevated) hover:text-(--text-secondary)"
        onClick={onClick}
        type="button"
      >
        <Plus aria-hidden="true" className="h-3 w-3" />
        Add sentence
      </button>
    </div>
  )
}
