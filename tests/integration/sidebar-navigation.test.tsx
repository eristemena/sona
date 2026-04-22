// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SidebarNav } from '../../apps/renderer/components/shell/sidebar-nav.js'
import { DEFAULT_NAVIGATION_DESTINATIONS } from '../../packages/domain/src/contracts/shell-bootstrap.js'

describe('sidebar navigation integration', () => {
  it('renders the persistent shell destinations and reports pointer selection', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    const { rerender } = render(
      <SidebarNav
        activeDestination="dashboard"
        appName="Sona"
        navigation={DEFAULT_NAVIGATION_DESTINATIONS}
        reviewDueCount={12}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByText('Sona')).toBeInTheDocument()
    expect(screen.queryByText("Study Shell")).not.toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.queryByText("01")).not.toBeInTheDocument();
    expect(screen.queryByText("02")).not.toBeInTheDocument();
    expect(screen.queryByText("03")).not.toBeInTheDocument();
    expect(screen.queryByText("04")).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /review/i }))

    expect(onSelect).toHaveBeenCalledWith('review')

    rerender(
      <SidebarNav
        activeDestination="review"
        appName="Sona"
        navigation={DEFAULT_NAVIGATION_DESTINATIONS}
        reviewDueCount={12}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByRole('button', { name: /review/i })).toHaveAttribute('aria-current', 'page')
  })

  it("hides the review badge when there are no due cards", () => {
    render(
      <SidebarNav
        activeDestination="dashboard"
        appName="Sona"
        navigation={DEFAULT_NAVIGATION_DESTINATIONS}
        reviewDueCount={0}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
})