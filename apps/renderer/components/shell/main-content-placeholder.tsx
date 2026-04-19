'use client'

import type { NavigationDestinationId } from '@sona/domain/contracts/shell-bootstrap'

import { ThemeSettings } from '../settings/theme-settings'

const COPY: Record<NavigationDestinationId, { eyebrow: string; title: string; description: string }> = {
  dashboard: {
    eyebrow: 'Today',
    title: 'Dashboard is ready for your study rhythm.',
    description: 'This space will hold session summaries, review counts, and your return point into active lessons.',
  },
  library: {
    eyebrow: 'Library',
    title: 'Your personal Korean material will live here.',
    description: 'Imports, source content, and learner-approved materials will appear in this panel once the next feature lands.',
  },
  review: {
    eyebrow: 'Review',
    title: 'Spaced repetition will anchor here.',
    description: 'The shell is reserving a calm, focused space for review sessions without overloading the frame prematurely.',
  },
  settings: {
    eyebrow: 'Settings',
    title: 'Appearance is available now.',
    description: 'Theme preference is the first persistent shell setting and is applied locally on launch.',
  },
}

interface MainContentPlaceholderProps {
  activeDestination: NavigationDestinationId
}

export function MainContentPlaceholder({ activeDestination }: MainContentPlaceholderProps) {
  const copy = COPY[activeDestination]

  return (
    <main className="flex min-h-dvh flex-1 flex-col px-6 py-6 md:px-10 md:py-8" id="main-content" tabIndex={-1}>
      <div className="flex flex-1 flex-col rounded-4xl border border-(--border) bg-(--bg-surface)/58 p-6 shadow-(--shadow-soft) backdrop-blur-2xl md:p-8">
        <header className="max-w-3xl space-y-4 border-b border-(--border) pb-8">
          <p className="text-xs uppercase tracking-[0.32em] text-(--text-muted)">{copy.eyebrow}</p>
          <h1 className="max-w-2xl text-[28px] font-bold leading-tight text-(--text-primary)">{copy.title}</h1>
          <p className="max-w-2xl text-[15px] leading-7 text-(--text-secondary)">{copy.description}</p>
        </header>

        <section className="flex flex-1 items-center justify-center py-12">
          <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
            <div className="rounded-[1.75rem] border border-dashed border-[color:var(--border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_9%,transparent),transparent_62%)] p-8">
              <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--text-muted)]">Empty main area</p>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[color:var(--text-secondary)]">
                The shell is deliberately quiet in this phase. It establishes navigation, theming, and packaging without inventing fake study data or premature workflows.
              </p>
            </div>
            {activeDestination === 'settings' ? <ThemeSettings /> : null}
          </div>
        </section>
      </div>
    </main>
  )
}