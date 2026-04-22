// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ReviewScreen } from '../../apps/renderer/components/review/review-screen.js'
import { KNOWN_WORD_SEED_PACKS_BY_ID } from '../../packages/domain/src/content/known-word-seeds.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

function installReviewWindowSona() {
  const completeKnownWordOnboarding = vi.fn(async () => ({
    insertedCount: 16,
    onboardingCompletedAt: 1_716_530_100_000,
  }))

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
              meaning: 'slowly',
              grammarPattern: 'Adverbial pacing',
              grammarDetails: 'Softens the tempo of the sentence.',
              romanization: 'cheoncheonhi',
              sentenceContext: '오늘도 천천히 읽어요',
              sentenceTranslation: 'Even today, I read slowly.',
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
      getKnownWordOnboardingStatus: vi.fn(async () => ({
        shouldOnboard: true,
        completedAt: null,
        availableSeedPacks: [
          {
            id: 'topik-i-core',
            label: 'TOPIK I core',
            description: 'A practical starter set for high-frequency everyday Korean.',
            wordCount: 3,
          },
        ],
      })),
      completeKnownWordOnboarding,
      markKnownWord: vi.fn(),
      clearKnownWord: vi.fn(),
    },
  } as unknown as WindowSona

  return { completeKnownWordOnboarding }
}

describe('known-word onboarding first launch', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows the optional onboarding panel in Review and completes a bundled seed pack without blocking due cards', async () => {
    const user = userEvent.setup()
    const { completeKnownWordOnboarding } = installReviewWindowSona()

    render(<ReviewScreen />)

    expect(await screen.findByText('Known words you already own')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '천천히' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Use TOPIK I core' }))

    expect(completeKnownWordOnboarding).toHaveBeenCalledWith({
      seedPackId: 'topik-i-core',
      selectedWords: KNOWN_WORD_SEED_PACKS_BY_ID.get('topik-i-core')!.words,
    })
    expect(await screen.findByText('Added 16 known words from TOPIK I core.')).toBeInTheDocument()
  })
})