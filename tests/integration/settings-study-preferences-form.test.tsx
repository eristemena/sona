// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../apps/renderer/lib/use-theme-preference', () => ({
  useThemePreference: () => ({
    themePreference: 'system',
    resolvedTheme: 'dark',
    setThemePreference: vi.fn(async () => undefined),
  }),
}))

import { ThemeSettings } from '../../apps/renderer/components/settings/theme-settings'

const getStudyPreferences = vi.fn()
const saveStudyPreferences = vi.fn()
const validateOpenAiKey = vi.fn()
const validateOpenRouterKey = vi.fn()
const previewTtsVoice = vi.fn()
const clearAnnotationCache = vi.fn()
const completeKnownWordOnboarding = vi.fn()

class MockAudio {
  play = vi.fn(async () => undefined)
  pause = vi.fn()
}

beforeEach(() => {
  getStudyPreferences.mockResolvedValue({
    openAiKeyStatus: {
      configured: false,
      lastValidatedAt: null,
      lastValidationState: 'idle',
    },
    openRouterKeyStatus: {
      configured: false,
      lastValidatedAt: null,
      lastValidationState: 'idle',
    },
    availableVoices: [
      {
        id: 'alloy',
        label: 'Alloy',
        description: 'Balanced and neutral for everyday listening.',
      },
      {
        id: 'nova',
        label: 'Nova',
        description: 'Clear and steady for longer study sessions.',
      },
    ],
    selectedVoice: 'alloy',
    dailyGoal: 20,
    koreanLevel: 'topik-i-core',
    maxLlmCallsPerSession: 12,
    annotationCacheDays: 14,
  })
  saveStudyPreferences.mockResolvedValue({
    openAiKeyStatus: {
      configured: true,
      lastValidatedAt: null,
      lastValidationState: 'idle',
    },
    openRouterKeyStatus: {
      configured: true,
      lastValidatedAt: null,
      lastValidationState: 'idle',
    },
    selectedVoice: 'nova',
    dailyGoal: 35,
    koreanLevel: 'topik-ii-core',
    maxLlmCallsPerSession: 16,
    annotationCacheDays: 10,
  })
  validateOpenAiKey.mockResolvedValue({
    ok: true,
    checkedAt: Date.now(),
    message: 'OpenAI TTS is ready.',
  })
  validateOpenRouterKey.mockResolvedValue({
    ok: true,
    checkedAt: Date.now(),
    message: 'OpenRouter key is valid.',
  })
  previewTtsVoice.mockResolvedValue({
    ok: true,
    voice: 'nova',
    sampleText: '안녕하세요, 소나입니다.',
    message: 'Previewing nova.',
    audioDataUrl: 'data:audio/mpeg;base64,AQID',
  })
  clearAnnotationCache.mockResolvedValue({ removedEntries: 4 })
  completeKnownWordOnboarding.mockResolvedValue({ insertedCount: 18, onboardingCompletedAt: Date.now() })

  window.sona = {
    settings: {
      getStudyPreferences,
      saveStudyPreferences,
      validateOpenAiKey,
      validateOpenRouterKey,
      previewTtsVoice,
      clearAnnotationCache,
    },
    review: {
      completeKnownWordOnboarding,
    },
  } as typeof window.sona

  vi.stubGlobal('Audio', MockAudio)
})

afterEach(() => {
  cleanup()
  delete (window as Partial<Window>).sona
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('study preferences form', () => {
  it('loads the snapshot and saves updated settings immediately', async () => {
    const user = userEvent.setup()

    render(<ThemeSettings />)

    await waitFor(() => {
      expect(getStudyPreferences).toHaveBeenCalledTimes(1)
    })

    await user.click(screen.getByRole('button', { name: 'Nova' }))

    const goalInput = screen.getByLabelText('Daily review goal')
    await user.clear(goalInput)
    await user.type(goalInput, '35')

    await user.click(screen.getByRole('button', { name: 'TOPIK II' }))

    const openAiInput = screen.getByLabelText('OpenAI API Key (TTS)')
    await user.type(openAiInput, ' sk-openai-user ')

    const openRouterInput = screen.getByLabelText('OpenRouter API Key (LLM)')
    await user.type(openRouterInput, '  sk-or-user  ')

    await waitFor(() => {
      expect(saveStudyPreferences).toHaveBeenCalledWith({
        openAiApiKey: 'sk-openai-user',
        openRouterApiKey: 'sk-or-user',
        selectedVoice: 'nova',
        dailyGoal: 35,
        koreanLevel: 'topik-ii-core',
        maxLlmCallsPerSession: 12,
        annotationCacheDays: 14,
      })
    })
  })

  it('runs inline key tests and voice preview actions', async () => {
    const user = userEvent.setup()

    render(<ThemeSettings />)

    await waitFor(() => {
      expect(getStudyPreferences).toHaveBeenCalledTimes(1)
    })

    await user.click(screen.getAllByRole('button', { name: 'Test' })[0])
    await user.click(screen.getAllByRole('button', { name: 'Test' })[1])
    await user.click(screen.getByRole('button', { name: 'Preview' }))

    await waitFor(() => {
      expect(validateOpenAiKey).toHaveBeenCalledTimes(1)
      expect(validateOpenRouterKey).toHaveBeenCalledTimes(1)
      expect(previewTtsVoice).toHaveBeenCalledWith({ voice: 'alloy' })
    })

    expect(await screen.findByText('OpenAI TTS is ready.')).toBeInTheDocument()
    expect(await screen.findByText('OpenRouter key is valid.')).toBeInTheDocument()
    expect(await screen.findByText('Previewing nova.')).toBeInTheDocument()
  })
})