// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppShell } from '../../apps/renderer/components/shell/app-shell.js'
import { createShellBootstrapState } from '../../packages/domain/src/contracts/shell-bootstrap.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

describe('content library delete integration', () => {
  const items = [
    {
      id: 'subtitle-1',
      title: 'Drama Episode 1',
      sourceType: 'srt',
      difficulty: 1,
      difficultyBadge: '초급',
      provenanceLabel: 'Subtitle import',
      provenanceDetail: '/fixtures/drama-episode-1.srt',
      createdAt: 2,
      blockCount: 1,
    },
    {
      id: 'article-1',
      title: 'Seoul Food Column',
      sourceType: 'article',
      difficulty: 2,
      difficultyBadge: '중급',
      provenanceLabel: 'Article paste',
      provenanceDetail: 'Pasted from the learner clipboard.',
      createdAt: 1,
      blockCount: 1,
    },
  ]

  beforeEach(() => {
    const state = { currentItems: [...items] }
    const deleteContent = vi.fn(async (contentItemId: string) => {
      state.currentItems = state.currentItems.filter((item) => item.id !== contentItemId)
      return { deletedId: contentItemId }
    })

    window.sona = {
      shell: {
        getBootstrapState: vi.fn(async () =>
          createShellBootstrapState({
            themePreference: 'system',
            systemTheme: 'dark',
          }),
        ),
      },
      settings: {
        getThemePreference: vi.fn(),
        setThemePreference: vi.fn(),
        subscribeThemeChanges: vi.fn(() => () => undefined),
      },
      content: {
        listLibraryItems: vi.fn(async () => state.currentItems),
        getContentBlocks: vi.fn(async () => []),
        browseSubtitleFile: vi.fn(),
        importSrt: vi.fn(),
        createArticleFromPaste: vi.fn(),
        createArticleFromUrl: vi.fn(),
        generatePracticeSentences: vi.fn(),
        deleteContent,
      },
      reading: {
        getReadingSession: vi.fn(),
        ensureBlockAudio: vi.fn(),
        lookupWord: vi.fn(),
        explainGrammar: vi.fn(),
        addToDeck: vi.fn(),
        getWordStudyStatus: vi.fn(),
        saveReadingProgress: vi.fn(),
        flushExposureLog: vi.fn(),
      },
      review: {
        getQueue: vi.fn(async () => ({
          generatedAt: 1_716_750_000_000,
          dueCount: 0,
          sessionLimit: 50,
          cards: [],
        })),
        submitRating: vi.fn(),
        updateCardDetails: vi.fn(),
        getKnownWordOnboardingStatus: vi.fn(async () => ({
          shouldShow: false,
          availableSeedPacks: [],
          completedAt: null,
          selectedSeedPackId: null,
          knownWordCount: 0,
        })),
        completeKnownWordOnboarding: vi.fn(),
        markKnownWord: vi.fn(),
        clearKnownWord: vi.fn(),
      },
    } as unknown as WindowSona
  })

  afterEach(() => {
    cleanup()
  })

  it('removes a deleted item from the library and leaves the review surface unchanged', async () => {
    const user = userEvent.setup()

    render(<AppShell />)

    await user.click(await screen.findByRole('button', { name: /library/i }))
    expect(
      await screen.findByRole("button", {
        name: "More options for Drama Episode 1",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "More options for Drama Episode 1" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(screen.getByRole('dialog', { name: 'Remove Drama Episode 1?' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete item' }))

    await waitFor(() => {
      expect(
        screen.queryByRole("button", {
          name: "More options for Drama Episode 1",
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: "More options for Seoul Food Column",
        }),
      ).toBeInTheDocument();
    })

    await user.click(screen.getByRole('button', { name: /review/i }))

    expect(await screen.findByRole('heading', { name: 'Daily review' })).toBeInTheDocument()
    expect(screen.getByText('Nothing is due right now.')).toBeInTheDocument()
  })
})