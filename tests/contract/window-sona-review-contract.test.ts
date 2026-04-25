import { beforeEach, describe, expect, it, vi } from 'vitest'

import { electronMockState, resetElectronMock } from '../setup/electron-mock.js'

describe('window.sona review preload contract', () => {
  beforeEach(() => {
    vi.resetModules()
    resetElectronMock()
  })

  it('exposes the typed review surface and invokes the review channels', async () => {
    const { createWindowSonaApi } = await import('../../apps/desktop/src/preload/index.js')
    const api = createWindowSonaApi(electronMockState.ipcRenderer)

    await api.review.getQueue(12)
    await api.review.ensureSentenceAudio({ reviewCardId: "card-1" });
    await api.review.submitRating({ reviewCardId: 'card-1', rating: 'good' })
    await api.review.updateCardDetails({
      reviewCardId: 'card-1',
      meaning: 'slowly',
      grammarPattern: 'Adverbial pacing',
      grammarDetails: 'Used to soften reading pace.',
    })
    await api.review.getKnownWordOnboardingStatus()
    await api.review.completeKnownWordOnboarding({
      seedPackId: 'topik-i-core',
      selectedWords: [{ canonicalForm: '천천히', surface: '천천히' }],
    })
    await api.review.markKnownWord({
      canonicalForm: '천천히',
      surface: '천천히',
      source: 'manual',
      sourceDetail: 'Learner already owns this word.',
      reviewCardId: 'card-1',
    })
    await api.review.clearKnownWord({ canonicalForm: '천천히', reviewCardId: 'card-1' })
    await api.reading.getWordStudyStatus({ canonicalForm: '천천히', surface: '천천히' })

    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(1, 'sona:review:get-queue', 12)
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      2,
      "sona:review:ensure-sentence-audio",
      {
        reviewCardId: "card-1",
      },
    );
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      3,
      "sona:review:submit-rating",
      {
        reviewCardId: "card-1",
        rating: "good",
      },
    );
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      4,
      "sona:review:update-card-details",
      {
        reviewCardId: "card-1",
        meaning: "slowly",
        grammarPattern: "Adverbial pacing",
        grammarDetails: "Used to soften reading pace.",
      },
    );
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      5,
      "sona:review:get-known-word-onboarding-status",
    );
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      6,
      "sona:review:complete-known-word-onboarding",
      {
        seedPackId: "topik-i-core",
        selectedWords: [{ canonicalForm: "천천히", surface: "천천히" }],
      },
    );
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      7,
      "sona:review:mark-known-word",
      {
        canonicalForm: "천천히",
        surface: "천천히",
        source: "manual",
        sourceDetail: "Learner already owns this word.",
        reviewCardId: "card-1",
      },
    );
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      8,
      "sona:review:clear-known-word",
      {
        canonicalForm: "천천히",
        reviewCardId: "card-1",
      },
    );
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      9,
      "sona:reading:get-word-study-status",
      {
        canonicalForm: "천천히",
        surface: "천천히",
      },
    );
  })
})