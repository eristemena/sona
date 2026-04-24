// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HomeDashboardScreen } from '../../apps/renderer/components/review/home-dashboard-screen.js'
import type { HomeDashboardSnapshot } from '../../packages/domain/src/content/home-dashboard.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

function installWindowSona(snapshot: HomeDashboardSnapshot) {
  const getHomeDashboard = vi.fn(async () => snapshot)

  window.sona = {
    shell: {
      getHomeDashboard,
    },
  } as unknown as WindowSona

  return { getHomeDashboard }
}

describe('home dashboard summary integration', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows the study summary and forwards dashboard actions', async () => {
    const startReview = vi.fn()
    const openLibrary = vi.fn()
    const continueReading = vi.fn()
    const user = userEvent.setup()

    const { getHomeDashboard } = installWindowSona({
      generatedAt: 1_777_032_800_000,
      todayDueCount: 12,
      streakDays: 4,
      dailyGoal: 20,
      recentVocabulary: [
        {
          reviewCardId: 'card-1',
          surface: '천천히',
          meaning: 'slowly',
          createdAt: 1_777_032_700_000,
          sourceContentItemId: 'item-1',
        },
      ],
      weeklyActivity: [
        { date: '2026-04-18', cardsReviewed: 0, minutesStudied: 0, isToday: false },
        { date: '2026-04-19', cardsReviewed: 3, minutesStudied: 7, isToday: false },
        { date: '2026-04-20', cardsReviewed: 4, minutesStudied: 9, isToday: false },
        { date: '2026-04-21', cardsReviewed: 0, minutesStudied: 0, isToday: false },
        { date: '2026-04-22', cardsReviewed: 5, minutesStudied: 10, isToday: false },
        { date: '2026-04-23', cardsReviewed: 6, minutesStudied: 12, isToday: false },
        { date: '2026-04-24', cardsReviewed: 7, minutesStudied: 14, isToday: true },
      ],
      resumeContext: {
        contentItemId: 'item-1',
        title: 'Drama Episode 3',
        provenanceLabel: 'Subtitle import',
        activeBlockId: 'block-9',
        updatedAt: 1_777_032_750_000,
      },
    })

    render(
      <HomeDashboardScreen
        onContinueReading={continueReading}
        onOpenLibrary={openLibrary}
        onStartReview={startReview}
      />,
    )

    expect(await screen.findByRole('heading', { name: '12 cards are ready for review.' })).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('20 cards')).toBeInTheDocument()
    expect(screen.getByText('Newest vocabulary')).toBeInTheDocument()
    expect(screen.getByText('천천히')).toBeInTheDocument()
    expect(screen.getByText('slowly')).toBeInTheDocument()
    expect(screen.getByText('Drama Episode 3')).toBeInTheDocument()
    expect(screen.getByText('Subtitle import')).toBeInTheDocument()
    expect(screen.queryByText('No study activity yet')).not.toBeInTheDocument()
    expect(getHomeDashboard).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Start review' }))
    await user.click(screen.getByRole('button', { name: 'Open library' }))
    await user.click(screen.getAllByRole('button', { name: 'Continue reading' })[0])

    expect(startReview).toHaveBeenCalledTimes(1)
    expect(openLibrary).toHaveBeenCalledTimes(1)
    expect(continueReading).toHaveBeenCalledWith('item-1')
  })

  it('shows calm empty states when there is no dashboard activity yet', async () => {
    installWindowSona({
      generatedAt: 1_777_032_800_000,
      todayDueCount: 0,
      streakDays: 0,
      dailyGoal: 18,
      recentVocabulary: [],
      weeklyActivity: [
        { date: '2026-04-18', cardsReviewed: 0, minutesStudied: 0, isToday: false },
        { date: '2026-04-19', cardsReviewed: 0, minutesStudied: 0, isToday: false },
        { date: '2026-04-20', cardsReviewed: 0, minutesStudied: 0, isToday: false },
        { date: '2026-04-21', cardsReviewed: 0, minutesStudied: 0, isToday: false },
        { date: '2026-04-22', cardsReviewed: 0, minutesStudied: 0, isToday: false },
        { date: '2026-04-23', cardsReviewed: 0, minutesStudied: 0, isToday: false },
        { date: '2026-04-24', cardsReviewed: 0, minutesStudied: 0, isToday: true },
      ],
      resumeContext: null,
    })

    render(
      <HomeDashboardScreen
        onContinueReading={vi.fn()}
        onOpenLibrary={vi.fn()}
        onStartReview={vi.fn()}
      />,
    )

    expect(await screen.findByRole('heading', { name: 'Your review queue is calm right now.' })).toBeInTheDocument()
    expect(screen.getByText('No study activity yet')).toBeInTheDocument()
    expect(screen.getByText('New review cards will appear here after your next capture or study session.')).toBeInTheDocument()
    expect(screen.getByText('No reading session is ready to resume yet. Open something from your library and your place will appear here.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continue reading' })).not.toBeInTheDocument()
  })
})