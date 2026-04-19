// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SidebarNav } from '../../apps/renderer/components/shell/sidebar-nav.js'
import { DEFAULT_NAVIGATION_DESTINATIONS } from '../../packages/domain/src/contracts/shell-bootstrap.js'

describe('sidebar keyboard navigation integration', () => {
  it('moves focus and emits the next destination on ArrowDown', () => {
    const onSelect = vi.fn()

    render(
      <SidebarNav
        activeDestination="dashboard"
        appName="Sona"
        navigation={DEFAULT_NAVIGATION_DESTINATIONS}
        onSelect={onSelect}
      />,
    )

    const dashboardButton = screen.getByRole('button', { name: /dashboard/i })
    const libraryButton = screen.getByRole('button', { name: /library/i })

    dashboardButton.focus()
    fireEvent.keyDown(dashboardButton, { key: 'ArrowDown' })

    expect(onSelect).toHaveBeenCalledWith('library')
    expect(document.activeElement).toBe(libraryButton)
  })

  it('wraps focus to the last destination on ArrowUp from the first item', () => {
    const onSelect = vi.fn()

    render(
      <SidebarNav
        activeDestination="dashboard"
        appName="Sona"
        navigation={DEFAULT_NAVIGATION_DESTINATIONS}
        onSelect={onSelect}
      />,
    )

    const dashboardButton = screen.getByRole('button', { name: /dashboard/i })
    const settingsButton = screen.getByRole('button', { name: /settings/i })

    dashboardButton.focus()
    fireEvent.keyDown(dashboardButton, { key: 'ArrowUp' })

    expect(onSelect).toHaveBeenCalledWith('settings')
    expect(document.activeElement).toBe(settingsButton)
  })
})