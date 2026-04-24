'use client'

import { startTransition } from 'react'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'

import type {
  CreateArticleFromPasteInput,
  CreateArticleFromUrlInput,
  GeneratePracticeSentencesInput,
  ImportSrtInput,
  LibraryFilter,
  SaveContentResult,
} from "@sona/domain/contracts/content-library";
import type { WindowSona } from '@sona/domain/contracts/window-sona'

import {
  applyContentLibraryQuery,
  type ContentBlockSummary,
  type LibraryItemSummary,
  type LibrarySortOption,
} from "./content-library-filters";

let lastSelectedLibraryItemId: string | null = null

function getContentApi(): WindowSona['content'] | null {
  if (typeof window === 'undefined' || typeof window.sona === 'undefined') {
    return null
  }

  return window.sona.content
}

export function useContentLibrary() {
  const [filter, setFilter] = useState<LibraryFilter>('all')
  const [sort, setSort] = useState<LibrarySortOption>("newest");
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [catalogItems, setCatalogItems] = useState<LibraryItemSummary[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(lastSelectedLibraryItemId)
  const [selectedBlocks, setSelectedBlocks] = useState<ContentBlockSummary[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function refreshItems(preferredItemId?: string) {
    const contentApi = getContentApi()
    if (!contentApi) {
      setCatalogItems([]);
      setSelectedItemId(null)
      return
    }

    const nextItems = await contentApi.listLibraryItems();
    setCatalogItems(nextItems);
    startTransition(() => {
      setSelectedItemId((current) => {
        const candidateId = preferredItemId ?? current
        if (candidateId && nextItems.some((item) => item.id === candidateId)) {
          return candidateId
        }

        return null
      })
    })
  }

  useEffect(() => {
    let active = true;
    const contentApi = getContentApi();

    if (!contentApi) {
      setCatalogItems([]);
      setIsLoadingItems(false);
      setErrorMessage(null);
      return;
    }

    setIsLoadingItems(true);
    setErrorMessage(null);

    void refreshItems()
      .then(() => {
        if (!active) {
          return;
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setCatalogItems([]);
        setSelectedItemId(null);
        setSelectedBlocks([]);
        setErrorMessage(
          "The Content Library could not be loaded from the local desktop bridge.",
        );
      })
      .finally(() => {
        if (active) {
          setIsLoadingItems(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const items = useMemo(
    () =>
      applyContentLibraryQuery({
        items: catalogItems,
        filter,
        search: deferredSearch,
        sort,
      }),
    [catalogItems, deferredSearch, filter, sort],
  );

  useEffect(() => {
    if (!selectedItemId) {
      return;
    }

    if (!items.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(null);
      setSelectedBlocks([]);
    }
  }, [items, selectedItemId]);

  useEffect(() => {
    let active = true
    const contentApi = getContentApi()

    if (!contentApi || !selectedItemId) {
      setSelectedBlocks([])
      setIsLoadingBlocks(false)
      return
    }

    setIsLoadingBlocks(true)

    void contentApi
      .getContentBlocks(selectedItemId)
      .then((blocks) => {
        if (active) {
          setSelectedBlocks(blocks)
        }
      })
      .catch(() => {
        if (active) {
          setSelectedBlocks([])
          setErrorMessage('Sentence blocks could not be loaded for the selected item.')
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingBlocks(false)
        }
      })

    return () => {
      active = false
    }
  }, [selectedItemId])

  useEffect(() => {
    lastSelectedLibraryItemId = selectedItemId
  }, [selectedItemId])

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId],
  )

  async function deleteContent(contentItemId: string) {
    const contentApi = getContentApi()
    if (!contentApi) {
      return
    }

    setIsDeleting(true)
    setErrorMessage(null)

    try {
      await contentApi.deleteContent(contentItemId)
      await refreshItems()
    } catch {
      setErrorMessage('The selected library item could not be deleted.')
    } finally {
      setIsDeleting(false)
    }
  }

  async function browseSubtitleFile(): Promise<string | null> {
    const contentApi = getContentApi()
    if (!contentApi) {
      setErrorMessage('The desktop content bridge is unavailable.')
      return null
    }

    try {
      return await contentApi.browseSubtitleFile()
    } catch {
      setErrorMessage('The subtitle file picker could not be opened.')
      return null
    }
  }

  async function importSrt(input: ImportSrtInput): Promise<SaveContentResult> {
    const contentApi = getContentApi()
    if (!contentApi) {
      return {
        ok: false,
        reason: 'invalid-input',
        message: 'The desktop content bridge is unavailable.',
      }
    }

    setIsImporting(true)
    setErrorMessage(null)

    try {
      const result = await contentApi.importSrt(input)

      if (result.ok) {
        await refreshItems(result.item.id)
        setSelectedBlocks(result.blocks)
      }

      if (!result.ok && result.reason !== 'duplicate-warning') {
        setErrorMessage(result.message)
      }

      return result
    } catch {
      const failure: SaveContentResult = {
        ok: false,
        reason: 'invalid-input',
        message: 'Subtitle import could not be completed.',
      }
      setErrorMessage(failure.message)
      return failure
    } finally {
      setIsImporting(false)
    }
  }

  async function createArticleFromPaste(input: CreateArticleFromPasteInput): Promise<SaveContentResult> {
    const contentApi = getContentApi()
    if (!contentApi) {
      return {
        ok: false,
        reason: 'invalid-input',
        message: 'The desktop content bridge is unavailable.',
      }
    }

    setIsImporting(true)
    setErrorMessage(null)

    try {
      const result = await contentApi.createArticleFromPaste(input)

      if (result.ok) {
        await refreshItems(result.item.id)
        setSelectedBlocks(result.blocks)
      }

      if (!result.ok && result.reason !== 'duplicate-warning') {
        setErrorMessage(result.message)
      }

      return result
    } catch {
      const failure: SaveContentResult = {
        ok: false,
        reason: 'invalid-input',
        message: 'Article paste could not be completed.',
      }
      setErrorMessage(failure.message)
      return failure
    } finally {
      setIsImporting(false)
    }
  }

  async function createArticleFromUrl(input: CreateArticleFromUrlInput): Promise<SaveContentResult> {
    const contentApi = getContentApi()
    if (!contentApi) {
      return {
        ok: false,
        reason: 'invalid-input',
        message: 'The desktop content bridge is unavailable.',
      }
    }

    setIsImporting(true)
    setErrorMessage(null)

    try {
      const result = await contentApi.createArticleFromUrl(input)

      if (result.ok) {
        await refreshItems(result.item.id)
        setSelectedBlocks(result.blocks)
      }

      if (!result.ok && result.reason !== 'duplicate-warning') {
        setErrorMessage(result.message)
      }

      return result
    } catch {
      const failure: SaveContentResult = {
        ok: false,
        reason: 'scrape-failed',
        message: 'Article scrape could not be completed.',
      }
      setErrorMessage(failure.message)
      return failure
    } finally {
      setIsImporting(false)
    }
  }

  async function generatePracticeSentences(input: GeneratePracticeSentencesInput): Promise<SaveContentResult> {
    const contentApi = getContentApi()
    if (!contentApi) {
      return {
        ok: false,
        reason: 'provider-unavailable',
        message: 'The desktop content bridge is unavailable.',
      }
    }

    setIsImporting(true)
    setErrorMessage(null)

    try {
      const result = await contentApi.generatePracticeSentences(input)

      if (result.ok) {
        await refreshItems(result.item.id)
        setSelectedBlocks(result.blocks)
      }

      if (!result.ok && result.reason !== 'duplicate-warning') {
        setErrorMessage(result.message)
      }

      return result
    } catch {
      const failure: SaveContentResult = {
        ok: false,
        reason: 'provider-unavailable',
        message: 'Generated practice sentences could not be created.',
      }
      setErrorMessage(failure.message)
      return failure
    } finally {
      setIsImporting(false)
    }
  }

  return {
    browseSubtitleFile,
    createArticleFromPaste,
    createArticleFromUrl,
    generatePracticeSentences,
    importSrt,
    items,
    selectedBlocks,
    selectedItem,
    queryState: {
      filter,
      search,
      sort,
      resultCount: items.length,
    },
    errorMessage,
    isDeleting,
    isImporting,
    isLoadingBlocks,
    isLoadingItems,
    selectItem: setSelectedItemId,
    setFilter,
    setSearch,
    setSort,
    deleteContent,
  };
}