import { beforeEach, describe, expect, it, vi } from 'vitest'

import { electronMockState, resetElectronMock } from '../setup/electron-mock.js'

describe('window.sona home, library, and settings contract', () => {
  beforeEach(() => {
    vi.resetModules()
    resetElectronMock()
  })

  it('exposes dashboard and study-preferences methods through the preload bridge', async () => {
    const { createWindowSonaApi } = await import('../../apps/desktop/src/preload/index.js')
    const api = createWindowSonaApi(electronMockState.ipcRenderer)

    type HomeLibrarySettingsApi = {
      shell: {
        getHomeDashboard: () => Promise<unknown>
      }
      settings: {
        getStudyPreferences: () => Promise<unknown>
        saveStudyPreferences: (input: {
          openRouterApiKey: string | null
          selectedVoice: string
          dailyGoal: number
        }) => Promise<unknown>
        validateOpenRouterKey: () => Promise<unknown>
        previewTtsVoice: (input: { voice: string }) => Promise<unknown>
      }
    }

    const typedApi = api as HomeLibrarySettingsApi

    await typedApi.shell.getHomeDashboard()
    await typedApi.settings.getStudyPreferences()
    await typedApi.settings.saveStudyPreferences({
      openRouterApiKey: 'sk-or-test',
      selectedVoice: 'coral',
      dailyGoal: 20,
    })
    await typedApi.settings.validateOpenRouterKey()
    await typedApi.settings.previewTtsVoice({ voice: 'coral' })

    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      1,
      'sona:shell:get-home-dashboard',
    )
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      2,
      'sona:settings:get-study-preferences',
    )
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      3,
      'sona:settings:save-study-preferences',
      {
        openRouterApiKey: 'sk-or-test',
        selectedVoice: 'coral',
        dailyGoal: 20,
      },
    )
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      4,
      'sona:settings:validate-openrouter-key',
    )
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      5,
      'sona:settings:preview-tts-voice',
      { voice: 'coral' },
    )
  })

  it('rejects invalid study-preferences payloads before invoking IPC', async () => {
    const { createWindowSonaApi } = await import('../../apps/desktop/src/preload/index.js')
    const api = createWindowSonaApi(electronMockState.ipcRenderer)

    await expect(
      api.settings.saveStudyPreferences({
        openRouterApiKey: {} as never,
        selectedVoice: 'coral',
        dailyGoal: 20,
      }),
    ).rejects.toThrow('Invalid study preferences payload.')

    await expect(
      api.settings.saveStudyPreferences({
        openRouterApiKey: 'sk-or-test',
        selectedVoice: '',
        dailyGoal: 20,
      }),
    ).rejects.toThrow('Invalid study preferences payload.')

    await expect(
      api.settings.saveStudyPreferences({
        openRouterApiKey: 'sk-or-test',
        selectedVoice: 'coral',
        dailyGoal: 0,
      }),
    ).rejects.toThrow('Invalid study preferences payload.')

    await expect(
      api.settings.previewTtsVoice({ voice: '' }),
    ).rejects.toThrow('Invalid TTS preview request.')

    expect(electronMockState.ipcRenderer.invoke).not.toHaveBeenCalled()
  })
})