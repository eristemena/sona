'use client'

import { ArrowRight, BookOpen, Flame, Library, PlayCircle } from 'lucide-react'

import { useHomeDashboard } from '../../lib/use-home-dashboard'
import { Button } from '../ui/button'
import { WeeklyActivityChart } from './weekly-activity-chart'

interface HomeDashboardScreenProps {
  onStartReview: () => void
  onContinueReading: (contentItemId: string) => void
  onOpenLibrary: () => void
}

export function HomeDashboardScreen({
  onContinueReading,
  onOpenLibrary,
  onStartReview,
}: HomeDashboardScreenProps) {
  const { snapshot, isLoading, errorMessage } = useHomeDashboard()

  if (isLoading) {
    return (
      <section className="grid min-h-112 place-items-center rounded-[1.75rem] border border-(--border) bg-(--bg-surface)/70 p-8">
        <p className="text-sm text-(--text-secondary)">Loading your dashboard…</p>
      </section>
    )
  }

  if (errorMessage || !snapshot) {
    return (
      <section className="grid min-h-112 place-items-center rounded-[1.75rem] border border-(--border) bg-(--bg-surface)/70 p-8">
        <div className="max-w-md space-y-3 text-center">
          <p className="text-[22px] font-semibold text-(--text-primary)">Dashboard unavailable</p>
          <p className="text-sm leading-7 text-(--text-secondary)">
            {errorMessage ?? 'The home dashboard could not be loaded from local study data.'}
          </p>
        </div>
      </section>
    )
  }

  const hasResumeContext = snapshot.resumeContext !== null
  const hasRecentVocabulary = snapshot.recentVocabulary.length > 0
  const hasWeeklyActivity = snapshot.weeklyActivity.some((point) => point.cardsReviewed > 0)

  return (
    <section className="flex flex-col gap-6">
      <header className="grid gap-5 rounded-[1.9rem] border border-(--border) bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_16%,transparent),transparent_62%)] p-6 md:grid-cols-[minmax(0,1.2fr)_minmax(18rem,24rem)] md:p-8">
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-(--text-muted)">
              Today
            </p>
            <h1 className="max-w-2xl text-[32px] font-bold leading-tight text-(--text-primary)">
              {snapshot.todayDueCount > 0
                ? `${snapshot.todayDueCount} cards are ready for review.`
                : "Your review queue is calm right now."}
            </h1>
            <p className="max-w-2xl text-[15px] leading-7 text-(--text-secondary)">
              Track recent vocabulary, see your last seven days at a glance, and
              jump straight back into the next study action.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={onStartReview} variant="primary">
              <PlayCircle aria-hidden="true" className="mr-2 h-4 w-4" />
              Start review
            </Button>
            <Button onClick={onOpenLibrary} variant="secondary">
              <Library aria-hidden="true" className="mr-2 h-4 w-4" />
              Open library
            </Button>
            {snapshot.resumeContext ? (
              <Button
                onClick={() =>
                  onContinueReading(snapshot.resumeContext!.contentItemId)
                }
                variant="ghost"
              >
                <BookOpen aria-hidden="true" className="mr-2 h-4 w-4" />
                Continue reading
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 rounded-[1.4rem] border border-(--border) bg-(--bg-surface)/78 p-5 shadow-(--shadow-soft)">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] uppercase tracking-[0.18em] text-(--text-muted)">
              Streak
            </span>
            <Flame aria-hidden="true" className="h-4 w-4 text-(--accent)" />
          </div>
          <div>
            <p className="text-[34px] font-semibold leading-none text-(--text-primary)">
              {snapshot.streakDays}
            </p>
            <p className="mt-2 text-sm text-(--text-secondary)">
              consecutive {snapshot.streakDays === 1 ? "day" : "days"} with
              review activity
            </p>
          </div>
          <div className="rounded-xl border border-(--border) bg-(--bg-elevated) px-4 py-3">
            <p className="text-[12px] uppercase tracking-[0.18em] text-(--text-muted)">
              Daily goal
            </p>
            <p className="mt-2 text-[20px] font-semibold text-(--text-primary)">
              {snapshot.dailyGoal} cards
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(19rem,24rem)]">
        <section className="rounded-[1.75rem] border border-(--border) bg-(--bg-surface)/75 p-6 shadow-(--shadow-soft)">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-(--text-muted)">
                This week
              </p>
              <h2 className="mt-2 text-[22px] font-semibold text-(--text-primary)">
                Study activity
              </h2>
            </div>
            <p className="text-sm text-(--text-secondary)">Last 7 days</p>
          </div>
          {hasWeeklyActivity ? (
            <WeeklyActivityChart points={snapshot.weeklyActivity} />
          ) : (
            <div className="grid min-h-44 place-items-center rounded-[1.2rem] border border-dashed border-(--border) bg-(--bg-elevated)/65 p-6 text-center">
              <div className="max-w-sm space-y-2">
                <p className="text-[18px] font-semibold text-(--text-primary)">
                  No study activity yet
                </p>
                <p className="text-sm leading-7 text-(--text-secondary)">
                  Finish one review session and your weekly activity will start
                  filling in here.
                </p>
              </div>
            </div>
          )}
        </section>

        <div className="grid gap-6">
          <section className="rounded-[1.75rem] border border-(--border) bg-(--bg-surface)/75 p-6 shadow-(--shadow-soft)">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-(--text-muted)">
                  Recent
                </p>
                <h2 className="mt-2 text-[22px] font-semibold text-(--text-primary)">
                  Newest vocabulary
                </h2>
              </div>
              <Button onClick={onStartReview} variant="ghost">
                Review
                <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
              </Button>
            </div>
            {hasRecentVocabulary ? (
              <ul className="space-y-3">
                {snapshot.recentVocabulary.map((item) => (
                  <li
                    className="rounded-xl border border-(--border) bg-(--bg-elevated) px-4 py-3"
                    key={item.reviewCardId}
                  >
                    <p className="text-[18px] font-semibold text-(--text-primary)">
                      {item.surface}
                    </p>
                    <p className="mt-1 text-sm text-(--text-secondary)">
                      {item.meaning ?? "Meaning not added yet."}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-(--border) bg-(--bg-elevated)/65 px-4 py-5">
                <p className="text-sm leading-7 text-(--text-secondary)">
                  New review cards will appear here after your next capture or
                  study session.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-[1.75rem] border border-(--border) bg-(--bg-surface)/75 p-6 shadow-(--shadow-soft)">
            <p className="text-xs uppercase tracking-[0.28em] text-(--text-muted)">
              Resume
            </p>
            <h2 className="mt-2 text-[22px] font-semibold text-(--text-primary)">
              Continue reading
            </h2>
            {hasResumeContext ? (
              <div className="mt-4 space-y-4 rounded-xl border border-(--border) bg-(--bg-elevated) p-4">
                <div>
                  <p className="text-[17px] font-semibold text-(--text-primary)">
                    {snapshot.resumeContext?.title}
                  </p>
                  <p className="mt-1 text-sm text-(--text-secondary)">
                    {snapshot.resumeContext?.provenanceLabel}
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() =>
                    onContinueReading(snapshot.resumeContext!.contentItemId)
                  }
                  variant="secondary"
                >
                  Reopen reading session
                </Button>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-(--border) bg-(--bg-elevated)/65 px-4 py-5">
                <p className="text-sm leading-7 text-(--text-secondary)">
                  No reading session is ready to resume yet. Open something from
                  your library and your place will appear here.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}