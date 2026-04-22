// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ReviewScreen } from '../../apps/renderer/components/review/review-screen.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

function installReviewWindowSona() {
  let queueVersion = 0
  const updateCardDetails = vi.fn(async () => {
    queueVersion = 1
    return {
      reviewCardId: 'card-1',
      updatedAt: 1_716_630_000_000,
    }
  })

  const getQueue = vi.fn(async () => {
    const back = queueVersion === 0
      ? {
          meaning: null,
          grammarPattern: null,
          grammarDetails: null,
          romanization: 'cheoncheonhi',
          sentenceContext: '오늘도 천천히 읽어요',
          sentenceTranslation: null,
          provenance: {
            sourceBlockId: 'block-1',
            sourceContentItemId: 'item-1',
            sentenceContextHash: 'ctx-1',
          },
        }
      : {
          meaning: 'slowly in this sentence',
          grammarPattern: 'Adverbial pacing',
          grammarDetails: 'Neutral register. Describes the reading tempo.',
          romanization: 'cheoncheonhi',
          sentenceContext: '오늘도 천천히 읽어요',
          sentenceTranslation: 'Even today, I read slowly.',
          provenance: {
            sourceBlockId: 'block-1',
            sourceContentItemId: 'item-1',
            sentenceContextHash: 'ctx-1',
          },
        }

    return {
      generatedAt: 1_716_530_000_000 + queueVersion,
      dueCount: 1,
      sessionLimit: 50,
      cards: [
        {
          front: {
            id: 'card-1',
            surface: '천천히',
            dueAt: 1_716_520_000_000,
            fsrsState: 'Review',
          },
          back,
          activationState: 'active' as const,
        },
      ],
    }
  })

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
      getQueue,
      submitRating: vi.fn(),
      updateCardDetails,
      getKnownWordOnboardingStatus: vi.fn(),
      completeKnownWordOnboarding: vi.fn(),
      markKnownWord: vi.fn(),
      clearKnownWord: vi.fn(),
    },
  } as unknown as WindowSona

  return { updateCardDetails, getQueue }
}

describe('review card detail edit', () => {
  afterEach(() => {
    cleanup()
  })

  it('lets the learner fill missing review-card details and refreshes the card after save', async () => {
    const user = userEvent.setup()
    const { updateCardDetails, getQueue } = installReviewWindowSona()

    render(<ReviewScreen />)

    await screen.findByRole('heading', { name: '천천히' })
    await user.click(screen.getByRole('button', { name: 'Reveal answer' }))
    await user.click(screen.getByRole('button', { name: 'Edit details' }))

    await user.type(screen.getByLabelText('Meaning'), 'slowly in this sentence')
    await user.type(screen.getByLabelText('Grammar pattern'), 'Adverbial pacing')
    await user.type(screen.getByLabelText('Grammar details'), 'Neutral register. Describes the reading tempo.')
    await user.click(screen.getByRole('button', { name: 'Save details' }))

    expect(updateCardDetails).toHaveBeenCalledWith({
      reviewCardId: 'card-1',
      meaning: 'slowly in this sentence',
      grammarPattern: 'Adverbial pacing',
      grammarDetails: 'Neutral register. Describes the reading tempo.',
    })

    await waitFor(() => {
      expect(getQueue).toHaveBeenCalledTimes(2)
      expect(screen.getByRole('button', { name: 'Edit details' })).toBeInTheDocument()
      expect(screen.getByText('slowly in this sentence')).toBeInTheDocument()
      expect(screen.getByText('Even today, I read slowly.')).toBeInTheDocument()
    })
  })
})