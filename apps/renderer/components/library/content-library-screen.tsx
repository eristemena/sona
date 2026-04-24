'use client'

import { BookOpen, SearchX, X } from "lucide-react";
import { useEffect, useMemo, useState } from 'react'

import { getContentLibraryEmptyState, getSourceTypeLabel, type ContentBlockSummary, type LibraryItemSummary } from '../../lib/content-library-filters'
import { useContentLibrary } from '../../lib/use-content-library'
import { cn } from '../../lib/utils'
import { AddContentDialog } from './add-content-dialog'
import { ContentDeleteDialog } from './content-delete-dialog'
import { ContentLibraryCard } from './content-library-card'
import { ContentLibraryToolbar } from './content-library-toolbar'
import { ReadingView } from "../reading/reading-view";
import { Button } from '../ui/button'

function BlockDetail({ block }: { block: ContentBlockSummary }) {
  return (
    <article className="rounded-lg border border-(--border) bg-(--bg-elevated) px-4 py-3">
      <p className="text-[15px] leading-[1.6] text-(--text-primary)">{block.korean}</p>
      {block.romanization ? <p className="mt-2 text-sm italic text-(--text-secondary)">{block.romanization}</p> : null}
    </article>
  )
}

function toReadingFallbackBlock(block: ContentBlockSummary) {
  return {
    id: block.id,
    contentItemId: "",
    korean: block.korean,
    romanization: block.romanization,
    audioOffset: block.audioOffset,
    sentenceOrdinal: block.sentenceOrdinal,
    tokens: (block.tokens ?? []).map((token, index) => ({
      index,
      surface: token.surface,
      ...(typeof token.normalized === "string"
        ? { normalized: token.normalized }
        : {}),
      ...(typeof token.start === "number" ? { start: token.start } : {}),
      ...(typeof token.end === "number" ? { end: token.end } : {}),
    })),
  };
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
      className="min-w-0 border-t border-(--border) pt-6 xl:sticky xl:top-0 xl:self-start xl:w-90 xl:border-l xl:border-t-0 xl:pl-0 xl:pt-0"
    >
      <div className="flex flex-col bg-(--bg-surface)">
        <div className="border-b border-(--border) px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-(--text-muted)">
                {getSourceTypeLabel(selectedItem.sourceType)}
              </p>
              <h2 className="mt-3 text-[22px] font-semibold leading-tight text-(--text-primary)">
                {selectedItem.title}
              </h2>
              <p className="mt-3 text-[13px] text-(--text-secondary)">
                {selectedItem.provenanceLabel}
              </p>
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
            <span className="rounded-sm border border-(--border) px-2 py-1 text-(--text-primary)">
              {selectedItem.difficultyBadge}
            </span>
            <span>{selectedItem.blockCount} sentences</span>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="flex flex-col gap-5">
            <section className="space-y-2">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.18em] text-(--text-muted)">
                Source details
              </h3>
              <p className={sourceDetailClassName}>
                {selectedItem.provenanceDetail}
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.18em] text-(--text-muted)">
                Sentence preview
              </h3>
              {isLoadingBlocks ? (
                <p className="text-sm text-(--text-secondary)">
                  Loading sentence blocks…
                </p>
              ) : null}
              {!isLoadingBlocks && selectedBlocks.length === 0 ? (
                <p className="text-sm text-(--text-secondary)">
                  No saved sentence blocks were found for this item.
                </p>
              ) : null}
              {!isLoadingBlocks ? (
                <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
                  {selectedBlocks.slice(0, 4).map((block) => (
                    <BlockDetail block={block} key={block.id} />
                  ))}
                </div>
              ) : null}
            </section>
          </div>
        </div>

        <div className="border-t border-(--border) px-6 py-4">
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() => onOpen(selectedItem.id)}
              variant="primary"
            >
              Open
            </Button>
            <Button
              className="flex-1"
              onClick={() => onDelete(selectedItem)}
              variant="danger"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ContentLibraryScreenProps {
  autoOpenContentItemId?: string | null
  onAutoOpenHandled?: () => void
}

export function ContentLibraryScreen({
  autoOpenContentItemId = null,
  onAutoOpenHandled,
}: ContentLibraryScreenProps = {}) {
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
    setSort,
  } = useContentLibrary();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<LibraryItemSummary | null>(null)
  const [openedItemId, setOpenedItemId] = useState<string | null>(null)
  const hasSelectedItem = selectedItem !== null;

  useEffect(() => {
    if (!autoOpenContentItemId) {
      return
    }

    const matchingItem = items.find((item) => item.id === autoOpenContentItemId)
    if (!matchingItem) {
      return
    }

    selectItem(matchingItem.id)
    setOpenedItemId(matchingItem.id)
    onAutoOpenHandled?.()
  }, [autoOpenContentItemId, items, onAutoOpenHandled, selectItem])

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

  const readingViewFallbackMeta = selectedItem
    ? {
        itemTitle: selectedItem.title,
        provenanceLabel: selectedItem.provenanceLabel,
        provenanceDetail: selectedItem.provenanceDetail,
      }
    : null;

  return (
    <>
      <div className="flex flex-col gap-5 py-6">
        {openedItemId ? (
          <ReadingView
            contentItemId={openedItemId}
            fallbackBlocks={selectedBlocks.map(toReadingFallbackBlock)}
            {...(readingViewFallbackMeta
              ? { fallbackMeta: readingViewFallbackMeta }
              : {})}
            onBack={handleCloseReadingView}
          />
        ) : (
          <>
            <ContentLibraryToolbar
              activeFilter={queryState.filter}
              activeSort={queryState.sort}
              onFilterChange={setFilter}
              onOpenAddContent={() => setIsAddDialogOpen(true)}
              onSearchChange={setSearch}
              onSortChange={setSort}
              resultCount={queryState.resultCount}
              search={queryState.search}
            />

            {errorMessage ? (
              <div
                className="rounded-lg border px-4 py-3 text-sm text-(--text-primary)"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--danger) 12%, transparent)",
                  borderColor:
                    "color-mix(in srgb, var(--danger) 50%, var(--border))",
                }}
              >
                {errorMessage}
              </div>
            ) : null}

            <div
              className={cn(
                "grid gap-6 xl:items-start",
                hasSelectedItem
                  ? "xl:grid-cols-[minmax(0,1fr)_360px]"
                  : "xl:grid-cols-1",
              )}
            >
              <section
                aria-label="Content Library results"
                className={cn("min-w-0 space-y-4", hasSelectedItem ? "" : "")}
              >
                {isLoadingItems ? (
                  <p className="text-sm text-(--text-secondary)">
                    Loading your local library…
                  </p>
                ) : null}

                {!isLoadingItems && items.length === 0 ? (
                  <div className="flex min-h-96 flex-col items-center justify-center rounded-lg border border-dashed border-(--border) bg-(--bg-surface) px-6 py-10 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-(--border) bg-(--bg-elevated) text-(--text-muted)">
                      {queryState.search.trim().length > 0 ||
                      queryState.filter !== "all" ? (
                        <SearchX aria-hidden="true" className="h-7 w-7" />
                      ) : (
                        <BookOpen aria-hidden="true" className="h-7 w-7" />
                      )}
                    </div>
                    <h2 className="mt-5 text-[18px] font-semibold text-(--text-primary)">
                      {emptyState.title}
                    </h2>
                    <p className="mt-3 max-w-[320px] text-[14px] leading-6 text-(--text-secondary)">
                      {emptyState.description}
                    </p>
                    {queryState.search.trim().length === 0 &&
                    queryState.filter === "all" ? (
                      <Button
                        className="mt-6"
                        onClick={() => setIsAddDialogOpen(true)}
                        variant="primary"
                      >
                        Add content
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                {!isLoadingItems ? (
                  <div
                    className={cn(
                      "grid gap-4",
                      hasSelectedItem
                        ? "md:grid-cols-2"
                        : "md:grid-cols-2 xl:grid-cols-3",
                    )}
                  >
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

      <ContentDeleteDialog
        deleting={isDeleting}
        item={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
      <AddContentDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmitArticlePaste={createArticleFromPaste}
        onSubmitArticleUrl={createArticleFromUrl}
        onSubmitGenerated={generatePracticeSentences}
        onSubmitSubtitle={importSrt}
      />
    </>
  );
}
