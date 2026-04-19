'use client'

import { Sparkles } from 'lucide-react'
import { useRef } from 'react'

import type { NavigationDestination, NavigationDestinationId } from '@sona/domain/contracts/shell-bootstrap'

import { getNextNavigationDestination } from '../../lib/navigation'
import { SidebarNavItem } from './sidebar-nav-item'

interface SidebarNavProps {
  activeDestination: NavigationDestinationId
  appName: string
  navigation: NavigationDestination[]
  onSelect: (destinationId: NavigationDestinationId) => void
}

export function SidebarNav({ activeDestination, appName, navigation, onSelect }: SidebarNavProps) {
  const itemRefs = useRef<Record<NavigationDestinationId, HTMLButtonElement | null>>({
    dashboard: null,
    library: null,
    review: null,
    settings: null,
  })

  function handleArrowNavigate(direction: 'next' | 'previous') {
    const nextDestination = getNextNavigationDestination(activeDestination, direction)
    onSelect(nextDestination)
    itemRefs.current[nextDestination]?.focus()
  }

  return (
    <aside className="flex min-h-dvh w-full max-w-55 shrink-0 flex-col border-r border-(--border) bg-(--bg-surface)/72 px-4 py-5 backdrop-blur-2xl">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-(--border) bg-(--bg-elevated) text-(--accent) shadow-(--shadow-soft)">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-(--text-muted)">Study Shell</p>
          <p className="text-lg font-semibold text-(--text-primary)">{appName}</p>
        </div>
      </div>

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-2">
        {navigation.map((destination) => (
          <SidebarNavItem
            active={activeDestination === destination.id}
            buttonRef={(element) => {
              itemRefs.current[destination.id] = element
            }}
            destination={destination}
            key={destination.id}
            onArrowNavigate={handleArrowNavigate}
            onSelect={onSelect}
          />
        ))}
      </nav>

      <div className="mt-8 rounded-3xl border border-(--border) bg-(--bg-elevated)/72 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-(--text-muted)">Local-first</p>
        <p className="mt-2 text-sm text-(--text-secondary)">
          Theme, shell state, and study progress stay on this device.
        </p>
      </div>
    </aside>
  )
}