'use client'

import type { NavigationDestinationId } from '@sona/domain/contracts/shell-bootstrap'

import { ContentLibraryScreen } from "../library/content-library-screen";
import { ReviewScreen } from "../review/review-screen";
import { ThemeSettings } from '../settings/theme-settings'

const COPY: Record<
  NavigationDestinationId,
  { eyebrow: string; title: string; description: string }
> = {
  dashboard: {
    eyebrow: "Today",
    title: "Dashboard is ready for your study rhythm.",
    description:
      "This space will hold session summaries, review counts, and your return point into active lessons.",
  },
  library: {
    eyebrow: "Library",
    title: "Your saved Korean material is ready to browse.",
    description:
      "Articles, subtitles, and generated practice live together here with source details, sentence previews, and local-first deletion.",
  },
  review: {
    eyebrow: "Review",
    title: "Spaced repetition will anchor here.",
    description:
      "The shell is reserving a calm, focused space for review sessions without overloading the frame prematurely.",
  },
  settings: {
    eyebrow: "Settings",
    title: "Appearance and reading audio are available now.",
    description:
      "Theme preference and the local OpenAI reading-audio key both persist on launch without leaving the desktop shell.",
  },
};

interface MainContentPlaceholderProps {
  activeDestination: NavigationDestinationId
}

export function MainContentPlaceholder({ activeDestination }: MainContentPlaceholderProps) {
  const copy = COPY[activeDestination]
  const isLibrary = activeDestination === "library";
  const isReview = activeDestination === "review";

  return (
    <main
      className="stage-enter flex min-h-dvh flex-1 flex-col px-5 py-5 md:px-8 md:py-6"
      id="main-content"
      tabIndex={-1}
    >
      <div
        className={
          isLibrary
            ? "flex flex-1 flex-col rounded-[28px] border border-(--border) bg-(--bg-surface)/58 p-5 shadow-(--shadow-soft) backdrop-blur-2xl md:p-6"
            : "flex flex-1 flex-col rounded-[28px] border border-(--border) bg-(--bg-surface)/58 p-6 shadow-(--shadow-soft) backdrop-blur-2xl md:p-8"
        }
      >
        {isLibrary || isReview ? null : (
          <header className="max-w-3xl space-y-4 border-b border-(--border) pb-8 panel-enter">
            <p className="text-xs uppercase tracking-[0.32em] text-(--text-muted)">
              {copy.eyebrow}
            </p>
            <h1 className="max-w-2xl text-[28px] font-bold leading-tight text-(--text-primary)">
              {copy.title}
            </h1>
            <p className="max-w-2xl text-[15px] leading-7 text-(--text-secondary)">
              {copy.description}
            </p>
          </header>
        )}

        {isLibrary ? (
          <section className="panel-enter flex flex-1 flex-col">
            <ContentLibraryScreen />
          </section>
        ) : isReview ? (
          <section className="panel-enter flex flex-1 flex-col">
            <ReviewScreen />
          </section>
        ) : (
          <section className="panel-enter flex flex-1 items-center justify-center py-12">
            <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
              <div className="rounded-[1.75rem] border border-dashed border-(--border) bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_9%,transparent),transparent_62%)] p-8">
                <p className="text-xs uppercase tracking-[0.32em] text-(--text-muted)">
                  Empty main area
                </p>
                <p className="mt-4 max-w-xl text-sm leading-7 text-(--text-secondary)">
                  The shell is deliberately quiet in this phase. It establishes
                  navigation, theming, and packaging without inventing fake
                  study data or premature workflows.
                </p>
              </div>
              {activeDestination === "settings" ? <ThemeSettings /> : null}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}