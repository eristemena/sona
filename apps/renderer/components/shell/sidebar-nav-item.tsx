'use client'

import type { KeyboardEvent } from 'react'
import type { Ref } from 'react'

import type { NavigationDestination, NavigationDestinationId } from '@sona/domain/contracts/shell-bootstrap'

import { cn } from '../../lib/utils'

interface SidebarNavItemProps {
  destination: NavigationDestination
  active: boolean
  onSelect: (destinationId: NavigationDestinationId) => void
  onArrowNavigate: (direction: 'next' | 'previous') => void
  buttonRef?: Ref<HTMLButtonElement>
}

export function SidebarNavItem({ destination, active, onSelect, onArrowNavigate, buttonRef }: SidebarNavItemProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      onArrowNavigate('next')
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      onArrowNavigate('previous')
    }
  }

  return (
    <button
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex w-full items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-left text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)',
        active
          ? 'bg-(--accent-subtle) text-(--text-primary) shadow-[inset_2px_0_0_var(--accent)]'
          : 'text-(--text-secondary) hover:border-(--border) hover:bg-(--bg-elevated) hover:text-(--text-primary)',
      )}
      onClick={() => onSelect(destination.id)}
      onKeyDown={handleKeyDown}
      ref={buttonRef}
      type="button"
    >
      <span>{destination.label}</span>
      <span className="text-xs text-(--text-muted) group-hover:text-(--text-secondary)">
        0{destination.order}
      </span>
    </button>
  )
}