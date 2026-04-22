// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ReviewScreen } from '../../apps/renderer/components/review/review-screen.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

function installReviewWindowSona() {
  window.sona = {
    shell: { getBootstrapState: vi.fn() },
    settings: {
      getThemePreference: vi.fn(),
      setThemePreference: vi.fn(),
      subscribeThemeChanges: vi.fn(() => () => undefined),
    },
    content: {
      listLibraryItems: vi.fn(),
      getContentBlocks: vi.fn(),
      browseSubtitleFile: vi.fn(),
      importSrt: vi.fn(),
      createArticleFromPaste: vi.fn(),
      createArticleFromUrl: vi.fn(),
      generatePracticeSentences: vi.fn(),
      deleteContent: vi.fn(),
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
        generatedAt: 1_716_530_000_000,
        dueCount: 2,
        sessionLimit: 50,
        cards: [
          {
            front: {
              id: 'card-1',
              surface: '천천히',
              dueAt: 1_716_520_000_000,
              fsrsState: 'Review',
            },
            back: {
              meaning: 'slowly',
              grammarPattern: null,
              grammarDetails: null,
              romanization: 'cheoncheonhi',
              sentenceContext: null,
              sentenceTranslation: null,
              provenance: {
                sourceBlockId: 'block-1',
                sourceContentItemId: 'item-1',
                sentenceContextHash: 'ctx-1',
              },
            },
            activationState: 'active' as const,
          },
        ],
      })),
      submitRating: vi.fn(),
      updateCardDetails: vi.fn(),
      getKnownWordOnboardingStatus: vi.fn(),
      completeKnownWordOnboarding: vi.fn(),
      markKnownWord: vi.fn(),
      clearKnownWord: vi.fn(),
    },
  } as unknown as WindowSona
}

describe('review rating buttons layout', () => {
  afterEach(() => {
    cleanup()
  })

  it('keeps the four recall ratings present, visible, and disabled until the card is flipped', async () => {
    const user = userEvent.setup()
    installReviewWindowSona()

    render(<ReviewScreen />)

    await screen.findByRole('heading', { name: '천천히' })

    const ratingGrid = screen.getByRole('group', { name: 'Recall rating' })
    expect(ratingGrid.className).toContain('grid-cols-2')

    for (const label of ['Again', 'Hard', 'Good', 'Easy']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${label}`) })).toBeDisabled()
    }

    await user.click(screen.getByRole('button', { name: 'Reveal answer' }))

    for (const label of ['Again', 'Hard', 'Good', 'Easy']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${label}`) })).toBeEnabled()
    }
  })
})