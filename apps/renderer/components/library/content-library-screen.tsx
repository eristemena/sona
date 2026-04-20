'use client'

import { ArrowLeft, BookOpen, SearchX, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { getContentLibraryEmptyState, getSourceTypeLabel, type ContentBlockSummary, type LibraryItemSummary } from '../../lib/content-library-filters'
import { useContentLibrary } from '../../lib/use-content-library'
import { cn } from '../../lib/utils'
import { AddContentDialog } from './add-content-dialog'
import { ContentDeleteDialog } from './content-delete-dialog'
import { ContentLibraryCard } from './content-library-card'
import { ContentLibraryToolbar } from './content-library-toolbar'
import { Button } from '../ui/button'

function BlockDetail({ block }: { block: ContentBlockSummary }) {
  return (
    <article className="rounded-lg border border-(--border) bg-(--bg-elevated) px-4 py-3">
      <p className="text-[15px] leading-[1.6] text-(--text-primary)">{block.korean}</p>
      {block.romanization ? <p className="mt-2 text-sm italic text-(--text-secondary)">{block.romanization}</p> : null}
    </article>
  )
}

function ReadingSurface({
  item,
  blocks,
  isLoading,
  onBack,
}: {
  item: LibraryItemSummary
  blocks: ContentBlockSummary[]
  isLoading: boolean
  onBack: () => void
}) {
  return (
    <section aria-label="Reading view" className="panel-enter flex flex-1 flex-col py-2">
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-(--border) pb-5">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-(--text-muted)">{item.provenanceLabel}</p>
          <h2 className="mt-3 text-[22px] font-semibold leading-tight text-(--text-primary)">{item.title}</h2>
          <p className="mt-2 text-[13px] text-(--text-secondary)">{item.provenanceDetail}</p>
        </div>

        <Button className="shrink-0" onClick={onBack} variant="secondary">
          <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />
          Back to library
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="rounded-sm border border-(--border) px-2 py-1 text-[11px] font-medium text-(--text-primary)">{item.difficultyBadge}</span>
        <span className="text-[13px] text-(--text-secondary)">{item.blockCount} saved sentence{item.blockCount === 1 ? '' : 's'}</span>
      </div>

      <div className="mx-auto flex w-full max-w-180 flex-1 flex-col gap-4 pt-2">
        {isLoading ? <p className="text-sm text-(--text-secondary)">Loading reading content…</p> : null}
        {!isLoading && blocks.length === 0 ? (
          <div className="rounded-lg border border-(--border) bg-(--bg-surface) px-6 py-8 text-center text-sm text-(--text-secondary)">
            No saved reading blocks were found for this item.
          </div>
        ) : null}
        {!isLoading
          ? blocks.map((block) => (
              <article key={block.id} className="rounded-lg border border-(--border) bg-[linear-gradient(180deg,color-mix(in_srgb,var(--bg-surface)_92%,transparent),var(--bg-surface))] px-6 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.16)]">
                <p className="text-[20px] leading-[1.8] tracking-[0.02em] text-(--text-primary)">{block.korean}</p>
                {block.romanization ? <p className="mt-3 text-sm italic text-(--text-secondary)">{block.romanization}</p> : null}
              </article>
            ))
          : null}
      </div>
    </section>
  )
}

function ContentDetailPane({
  onClose,
  onDelete,
  onOpen,
  isLoadingBlocks,
  selectedBlocks,
  selectedItem,
}: {
  onClose: () => void
  onDelete: (item: LibraryItemSummary) => void
  onOpen: (contentItemId: string) => void
  isLoadingBlocks: boolean
  selectedBlocks: ContentBlockSummary[]
  selectedItem: LibraryItemSummary | null
}) {
  if (!selectedItem) {
    return null
  }

  const sourceDetailClassName = selectedItem.sourceType === 'srt' ? 'font-mono text-[13px] text-(--text-primary)' : 'text-[13px] text-(--text-primary)'

  return (
    <section
      aria-label="Selected content detail"
      className="min-w-0 border-t border-(--border) pt-6 xl:sticky xl:top-6 xl:h-[calc(100dvh-9rem)] xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0"
    >
      <div className="flex h-full flex-col rounded-lg bg-(--bg-surface)">
        <div className="border-b border-(--border) px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-(--text-muted)">{getSourceTypeLabel(selectedItem.sourceType)}</p>
              <h2 className="mt-3 text-[22px] font-semibold leading-tight text-(--text-primary)">{selectedItem.title}</h2>
              <p className="mt-2 text-[13px] text-(--text-secondary)">{selectedItem.provenanceLabel}</p>
            </div>
            <button
              aria-label="Close selected content detail"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-(--text-secondary) transition-colors duration-150 hover:bg-(--bg-elevated) hover:text-(--text-primary) focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg-surface)"
              onClick={onClose}
              type="button"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-(--text-muted)">
            <span className="rounded-sm border border-(--border) px-2 py-1 text-(--text-primary)">{selectedItem.difficultyBadge}</span>
            <span>{selectedItem.blockCount} sentences</span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-6 py-5">
          <div className="flex h-full flex-col gap-5 overflow-hidden">
            <section className="space-y-2">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.18em] text-(--text-muted)">Source details</h3>
              <p className={sourceDetailClassName}>{selectedItem.provenanceDetail}</p>
            </section>

            <section className="flex min-h-0 flex-1 flex-col space-y-3">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.18em] text-(--text-muted)">Sentence preview</h3>
              {isLoadingBlocks ? <p className="text-sm text-(--text-secondary)">Loading sentence blocks…</p> : null}
              {!isLoadingBlocks && selectedBlocks.length === 0 ? (
                <p className="text-sm text-(--text-secondary)">No saved sentence blocks were found for this item.</p>
              ) : null}
              {!isLoadingBlocks ? (
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                  {selectedBlocks.slice(0, 4).map((block) => <BlockDetail block={block} key={block.id} />)}
                </div>
              ) : null}
            </section>
          </div>
        </div>

        <div className="border-t border-(--border) px-6 py-4">
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => onOpen(selectedItem.id)} variant="primary">
              Open
            </Button>
            <Button className="flex-1" onClick={() => onDelete(selectedItem)} variant="danger">
              Delete
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function ContentLibraryScreen() {
  const {
    createArticleFromPaste,
    createArticleFromUrl,
    deleteContent,
    errorMessage,
    generatePracticeSentences,
    importSrt,
    isDeleting,
    isImporting,
    isLoadingBlocks,
    isLoadingItems,
    items,
    queryState,
    selectItem,
    selectedBlocks,
    selectedItem,
    setFilter,
    setSearch,
  } = useContentLibrary()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<LibraryItemSummary | null>(null)
  const [openedItemId, setOpenedItemId] = useState<string | null>(null)
  const hasSelectedItem = selectedItem !== null
  const openedItem = useMemo(() => items.find((item) => item.id === openedItemId) ?? null, [items, openedItemId])

  const emptyState = useMemo(
    () => getContentLibraryEmptyState({ filter: queryState.filter, search: queryState.search }),
    [queryState.filter, queryState.search],
  )

  async function handleDeleteConfirm(contentItemId: string) {
    await deleteContent(contentItemId)
    setPendingDelete(null)
  }

  function handleCloseDetail() {
    selectItem(null)
  }

  function handleOpenContent(contentItemId: string) {
    selectItem(contentItemId)
    setOpenedItemId(contentItemId)
  }

  function handleCloseReadingView() {
    setOpenedItemId(null)
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-5 py-6">
        {openedItem ? (
          <ReadingSurface blocks={selectedBlocks} isLoading={isLoadingBlocks} item={openedItem} onBack={handleCloseReadingView} />
        ) : (
          <>
        <ContentLibraryToolbar
          activeFilter={queryState.filter}
          onFilterChange={setFilter}
          onOpenAddContent={() => setIsAddDialogOpen(true)}
          onSearchChange={setSearch}
          resultCount={queryState.resultCount}
          search={queryState.search}
        />

        {errorMessage ? (
          <div
            className="rounded-lg border px-4 py-3 text-sm text-(--text-primary)"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--danger) 12%, transparent)',
              borderColor: 'color-mix(in srgb, var(--danger) 50%, var(--border))',
            }}
          >
            {errorMessage}
          </div>
        ) : null}

        <div className={cn('grid flex-1 gap-0 xl:items-start', hasSelectedItem ? 'xl:grid-cols-[minmax(0,1fr)_360px]' : 'xl:grid-cols-1')}>
          <section aria-label="Content Library results" className={cn('min-w-0 space-y-4', hasSelectedItem ? 'xl:pr-6' : '')}>
            {isLoadingItems ? <p className="text-sm text-(--text-secondary)">Loading your local library…</p> : null}

            {!isLoadingItems && items.length === 0 ? (
              <div className="flex min-h-96 flex-col items-center justify-center rounded-lg border border-dashed border-(--border) bg-(--bg-surface) px-6 py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-(--border) bg-(--bg-elevated) text-(--text-muted)">
                  {queryState.search.trim().length > 0 || queryState.filter !== 'all' ? (
                    <SearchX aria-hidden="true" className="h-7 w-7" />
                  ) : (
                    <BookOpen aria-hidden="true" className="h-7 w-7" />
                  )}
                </div>
                <h2 className="mt-5 text-[18px] font-semibold text-(--text-primary)">{emptyState.title}</h2>
                <p className="mt-3 max-w-[320px] text-[14px] leading-6 text-(--text-secondary)">{emptyState.description}</p>
                {queryState.search.trim().length === 0 && queryState.filter === 'all' ? (
                  <Button className="mt-6" onClick={() => setIsAddDialogOpen(true)} variant="primary">
                    Add content
                  </Button>
                ) : null}
              </div>
            ) : null}

            {!isLoadingItems ? (
              <div className={cn('grid gap-3.5', hasSelectedItem ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3')}>
                {items.map((item) => (
                  <ContentLibraryCard
                    active={item.id === selectedItem?.id}
                    item={item}
                    key={item.id}
                    onDelete={setPendingDelete}
                    onInspect={selectItem}
                  />
                ))}
              </div>
            ) : null}
          </section>

          <ContentDetailPane
            isLoadingBlocks={isLoadingBlocks}
            onClose={handleCloseDetail}
            onDelete={setPendingDelete}
            onOpen={handleOpenContent}
            selectedBlocks={selectedBlocks}
            selectedItem={selectedItem}
          />
        </div>
          </>
        )}
      </div>

      <ContentDeleteDialog deleting={isDeleting} item={pendingDelete} onCancel={() => setPendingDelete(null)} onConfirm={handleDeleteConfirm} />
      <AddContentDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmitArticlePaste={createArticleFromPaste}
        onSubmitArticleUrl={createArticleFromUrl}
        onSubmitGenerated={generatePracticeSentences}
        onSubmitSubtitle={importSrt}
      />
    </>
  )
}
