"use client";

import { Sparkles } from "lucide-react";
import { useRef } from "react";

import type {
  NavigationDestination,
  NavigationDestinationId,
} from "@sona/domain/contracts/shell-bootstrap";

import { getNextNavigationDestination } from "../../lib/navigation";
import { SidebarNavItem } from "./sidebar-nav-item";

interface SidebarNavProps {
  activeDestination: NavigationDestinationId;
  appName: string;
  navigation: NavigationDestination[];
  reviewDueCount: number;
  onSelect: (destinationId: NavigationDestinationId) => void;
}

export function SidebarNav({
  activeDestination,
  appName,
  navigation,
  reviewDueCount,
  onSelect,
}: SidebarNavProps) {
  const itemRefs = useRef<
    Record<NavigationDestinationId, HTMLButtonElement | null>
  >({
    dashboard: null,
    library: null,
    review: null,
    settings: null,
  });

  function handleArrowNavigate(direction: "next" | "previous") {
    const nextDestination = getNextNavigationDestination(
      activeDestination,
      direction,
    );
    onSelect(nextDestination);
    itemRefs.current[nextDestination]?.focus();
  }

  return (
    <aside className="flex h-full w-full max-w-55 shrink-0 flex-col overflow-hidden border-r border-(--border) bg-[color-mix(in_srgb,var(--bg-surface)_78%,transparent)] px-4 py-5 backdrop-blur-2xl">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="mb-5 flex items-center gap-3 px-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-(--border) bg-(--bg-elevated) text-(--accent) shadow-[0_8px_24px_rgba(8,12,22,0.18)]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[16px] font-bold text-(--text-primary)">
            {appName}
          </p>
        </div>
      </div>

      <nav aria-label="Primary" className="flex flex-col gap-1">
        {navigation.map((destination) => (
          <SidebarNavItem
            active={activeDestination === destination.id}
            buttonRef={(element) => {
              itemRefs.current[destination.id] = element;
            }}
            destination={destination}
            key={destination.id}
            onArrowNavigate={handleArrowNavigate}
            onSelect={onSelect}
            reviewDueCount={reviewDueCount}
          />
        ))}
      </nav>
    </aside>
  );
}