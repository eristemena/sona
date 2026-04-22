"use client";

import type { KeyboardEvent } from "react";
import type { Ref } from "react";

import type {
  NavigationDestination,
  NavigationDestinationId,
} from "@sona/domain/contracts/shell-bootstrap";

import { cn } from "../../lib/utils";

interface SidebarNavItemProps {
  destination: NavigationDestination;
  active: boolean;
  reviewDueCount: number;
  onSelect: (destinationId: NavigationDestinationId) => void;
  onArrowNavigate: (direction: "next" | "previous") => void;
  buttonRef?: Ref<HTMLButtonElement>;
}

export function SidebarNavItem({
  destination,
  active,
  reviewDueCount,
  onSelect,
  onArrowNavigate,
  buttonRef,
}: SidebarNavItemProps) {
  const shouldShowReviewBadge =
    destination.id === "review" && reviewDueCount > 0;

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      onArrowNavigate("next");
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      onArrowNavigate("previous");
    }
  }

  return (
    <button
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex w-full items-center justify-between rounded-xl border border-transparent px-3.5 py-2.5 text-left text-[14px] font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)",
        active
          ? "border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] bg-(--accent-subtle) text-(--text-primary) shadow-[inset_2px_0_0_var(--accent)]"
          : "text-(--text-secondary) hover:border-(--border) hover:bg-(--bg-elevated) hover:text-(--text-primary)",
      )}
      onClick={() => onSelect(destination.id)}
      onKeyDown={handleKeyDown}
      ref={buttonRef}
      type="button"
    >
      <span>{destination.label}</span>
      {shouldShowReviewBadge ? (
        <span className="inline-flex min-w-7 items-center justify-center rounded-md bg-(--accent-subtle) px-2 py-1 text-[11px] font-medium text-(--accent)">
          {reviewDueCount}
        </span>
      ) : null}
    </button>
  );
}