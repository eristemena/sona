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
            back: {
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

describe('review card missing details', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders fallback copy and provenance context when a card is missing saved answer details', async () => {
    const user = userEvent.setup()
    installReviewWindowSona()

    render(<ReviewScreen />)

    await screen.findByRole('heading', { name: '천천히' })
    await user.click(screen.getByRole('button', { name: 'Reveal answer' }))

    expect(await screen.findByText('No saved meaning yet. Add one so this card stays useful offline.')).toBeInTheDocument()
    expect(screen.getByText('Captured from reading')).toBeInTheDocument()
    expect(screen.getByText('오늘도 천천히 읽어요')).toBeInTheDocument()
  })
})