import type {
  LibraryFilter,
  SaveContentSuccess,
} from "@sona/domain/contracts/content-library";

export interface ContentLibraryFilterOption {
  id: LibraryFilter;
  label: string;
  description: string;
}

export const CONTENT_LIBRARY_FILTER_OPTIONS: ContentLibraryFilterOption[] = [
  { id: "all", label: "All", description: "Every saved source" },
  {
    id: "article",
    label: "Articles",
    description: "Pasted or scraped reading material",
  },
  { id: "srt", label: "Subtitles", description: "Imported drama dialogue" },
  {
    id: "generated",
    label: "Generated",
    description: "AI-created practice sentences",
  },
];

export type LibrarySortOption =
  | "newest"
  | "oldest"
  | "title-asc"
  | "title-desc";

export const CONTENT_LIBRARY_SORT_OPTIONS: Array<{
  id: LibrarySortOption;
  label: string;
}> = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "title-asc", label: "Title (A-Z)" },
  { id: "title-desc", label: "Title (Z-A)" },
];

export type LibraryItemSummary = SaveContentSuccess["item"];
export type ContentBlockSummary = SaveContentSuccess["blocks"][number];

const SOURCE_TYPE_LABELS: Record<LibraryItemSummary["sourceType"], string> = {
  article: "Article",
  generated: "Generated",
  srt: "Subtitle",
};

export function getSourceTypeLabel(
  sourceType: LibraryItemSummary["sourceType"],
): string {
  return SOURCE_TYPE_LABELS[sourceType];
}

export function getContentLibraryEmptyState(input: {
  filter: LibraryFilter;
  search: string;
}) {
  const hasSearch = input.search.trim().length > 0;
  const isFiltered = input.filter !== "all";

  if (hasSearch || isFiltered) {
    return {
      title: hasSearch
        ? `No results for "${input.search.trim()}"`
        : "No items in this view",
      description: "Try a different search term or clear the filter.",
    };
  }

  return {
    title: "Your library is empty",
    description:
      "Import a drama subtitle file, paste a Korean article, or generate practice sentences to get started.",
  };
}

export function getSentenceCountLabel(blockCount: number): string {
  return `${blockCount} ${blockCount === 1 ? "sentence" : "sentences"}`;
}

export function getEstimatedReadTimeLabel(blockCount: number): string {
  const minutes = Math.max(1, Math.round(blockCount / 36));
  return `~${minutes} min read`;
}

export function applyContentLibraryQuery(input: {
  items: LibraryItemSummary[];
  filter: LibraryFilter;
  search: string;
  sort: LibrarySortOption;
}) {
  const normalizedSearch = input.search.trim().toLocaleLowerCase();

  const filteredItems = input.items.filter((item) => {
    const matchesFilter =
      input.filter === "all" || item.sourceType === input.filter;
    const haystack =
      `${item.title} ${item.provenanceLabel} ${item.provenanceDetail}`.toLocaleLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 || haystack.includes(normalizedSearch);

    return matchesFilter && matchesSearch;
  });

  return [...filteredItems].sort((left, right) => {
    switch (input.sort) {
      case "newest":
        return right.createdAt - left.createdAt;
      case "oldest":
        return left.createdAt - right.createdAt;
      case "title-asc":
        return left.title.localeCompare(right.title);
      case "title-desc":
        return right.title.localeCompare(left.title);
    }
  });
}