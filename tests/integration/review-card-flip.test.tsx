// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewScreen } from '../../apps/renderer/components/review/review-screen.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

const playMock = vi.fn().mockResolvedValue(undefined);
const loadMock = vi.fn();

function installReviewWindowSona(configured = true) {
  const submitRating = vi.fn(async () => ({
    reviewCardId: "card-1",
    rating: "good" as const,
    fsrsGrade: 3 as const,
    reviewedAt: 1_716_530_000_000,
    nextDueAt: 1_716_616_400_000,
    fsrsState: "Review",
    scheduledDays: 2,
  }));
  const ensureSentenceAudio = vi.fn(async () => ({
    reviewCardId: "card-1",
    state: "ready" as const,
    audioFilePath: "/tmp/review-sentence.mp3",
    modelId: "tts-1",
    voice: "alloy",
    fromCache: false,
  }));

  window.sona = {
    shell: { getBootstrapState: vi.fn() },
    settings: {
      getThemePreference: vi.fn(),
      getOpenAiApiKeyStatus: vi.fn(async () => ({ configured })),
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
              id: "card-1",
              surface: "천천히",
              dueAt: 1_716_520_000_000,
              fsrsState: "Review",
            },
            back: {
              meaning: "slowly",
              grammarPattern: "Adverbial pacing",
              grammarDetails: "Softens the tempo of the sentence.",
              romanization: "cheoncheonhi",
              sentenceContext: "오늘도 천천히 읽어요",
              sentenceTranslation: "Even today, I read slowly.",
              provenance: {
                sourceBlockId: "block-1",
                sourceContentItemId: "item-1",
                sentenceContextHash: "ctx-1",
              },
            },
            activationState: "active" as const,
          },
        ],
      })),
      ensureSentenceAudio,
      submitRating,
      updateCardDetails: vi.fn(),
      getKnownWordOnboardingStatus: vi.fn(),
      completeKnownWordOnboarding: vi.fn(),
      markKnownWord: vi.fn(),
      clearKnownWord: vi.fn(),
    },
  } as unknown as WindowSona;

  return { ensureSentenceAudio, submitRating };
}

describe('review card flip', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(playMock);
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(loadMock);
  });

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks();
    playMock.mockClear();
    loadMock.mockClear();
  })

  it('reveals the answer side only after the learner flips the current card', async () => {
    const user = userEvent.setup()
    const { ensureSentenceAudio, submitRating } = installReviewWindowSona();

    render(<ReviewScreen />)

    expect(await screen.findByRole('heading', { name: 'Daily review' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '천천히' })).toBeInTheDocument()
    expect(screen.queryByText('slowly')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reveal answer' }))

    expect(await screen.findByText('slowly')).toBeInTheDocument()
    expect(screen.getByText('Even today, I read slowly.')).toBeInTheDocument()
    expect(
      await screen.findByRole("button", { name: "Replay sentence audio" }),
    ).toBeInTheDocument();
    expect(ensureSentenceAudio).toHaveBeenCalledWith({
      reviewCardId: "card-1",
    });
    expect(playMock).toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Replay sentence audio" }),
    );
    expect(playMock).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole('button', { name: /^Good/ }))
    expect(submitRating).toHaveBeenCalledWith(
      expect.objectContaining({
        reviewCardId: 'card-1',
        rating: 'good',
      }),
    )
  })

  it("keeps review cards text-only when no OpenAI key is configured", async () => {
    const user = userEvent.setup();
    const { ensureSentenceAudio } = installReviewWindowSona(false);

    render(<ReviewScreen />);

    expect(
      await screen.findByRole("heading", { name: "Daily review" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "천천히" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reveal answer" }));

    expect(await screen.findByText("slowly")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Replay sentence audio" }),
    ).not.toBeInTheDocument();
    expect(ensureSentenceAudio).not.toHaveBeenCalled();
    expect(playMock).not.toHaveBeenCalled();
  });
})