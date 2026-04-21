import { beforeEach, describe, expect, it, vi } from 'vitest'

import { electronMockState, resetElectronMock } from '../setup/electron-mock.js'

describe('window.sona preload contract', () => {
  beforeEach(async () => {
    vi.resetModules()
    resetElectronMock()
  })

  it('exposes the typed shell and settings surface on window.sona', async () => {
    const { exposeWindowSona } = await import('../../apps/desktop/src/preload/index.js')
    const api = exposeWindowSona(electronMockState.contextBridge, electronMockState.ipcRenderer)

    const [name] = electronMockState.contextBridge.exposeInMainWorld.mock.calls[0] as [string, unknown]

    electronMockState.ipcRenderer.invoke.mockResolvedValueOnce({ appName: 'Sona' })

    type ExposedApi = {
      shell: { getBootstrapState: () => Promise<unknown> };
      settings: {
        getThemePreference: () => Promise<unknown>;
        setThemePreference: (mode: string) => Promise<unknown>;
        getOpenAiApiKeyStatus: () => Promise<unknown>;
        setOpenAiApiKey: (apiKey: string | null) => Promise<unknown>;
        getReadingAudioMode: () => Promise<unknown>;
        setReadingAudioMode: (mode: string) => Promise<unknown>;
        getReadingAudioVoice: () => Promise<unknown>;
        setReadingAudioVoice: (voice: string) => Promise<unknown>;
        subscribeThemeChanges: (
          listener: (update: unknown) => void,
        ) => () => void;
      };
    };

    const typedApi = api as ExposedApi

    await typedApi.shell.getBootstrapState()
    await typedApi.settings.getThemePreference()
    await typedApi.settings.getOpenAiApiKeyStatus();
    await typedApi.settings.setOpenAiApiKey("sk-test");
    await typedApi.settings.getReadingAudioMode();
    await typedApi.settings.setReadingAudioMode("learner-slow");
    await typedApi.settings.getReadingAudioVoice();
    await typedApi.settings.setReadingAudioVoice("coral");

    expect(name).toBe('sona')
    expect(electronMockState.contextBridge.exposeInMainWorld).toHaveBeenCalledWith('sona', expect.any(Object))
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(1, 'sona:shell:get-bootstrap-state')
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(2, 'sona:settings:get-theme-preference')
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      3,
      "sona:settings:get-openai-api-key-status",
    );
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      4,
      "sona:settings:set-openai-api-key",
      "sk-test",
    );
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      5,
      "sona:settings:get-reading-audio-mode",
    );
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      6,
      "sona:settings:set-reading-audio-mode",
      "learner-slow",
    );
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      7,
      "sona:settings:get-reading-audio-voice",
    );
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      8,
      "sona:settings:set-reading-audio-voice",
      "coral",
    );

    await expect(typedApi.settings.setThemePreference('sepia')).rejects.toThrow('Invalid theme preference mode.')
    await expect(
      typedApi.settings.setOpenAiApiKey({} as never),
    ).rejects.toThrow("Invalid OpenAI API key value.");
    await expect(
      typedApi.settings.setReadingAudioMode("fast" as never),
    ).rejects.toThrow("Invalid reading audio mode.");
    await expect(
      typedApi.settings.setReadingAudioVoice("robot" as never),
    ).rejects.toThrow("Invalid reading audio voice.");
  })

  it('subscribes and unsubscribes to theme updates through ipcRenderer', async () => {
    const { createWindowSonaApi } = await requirePreloadModule()
    const api = createWindowSonaApi(electronMockState.ipcRenderer)

    const listener = vi.fn()
    const unsubscribe = api.settings.subscribeThemeChanges(listener)
    const [, handler] = electronMockState.ipcRenderer.on.mock.calls[0] as [string, (event: unknown, update: unknown) => void]

    handler({}, { themePreference: 'dark', resolvedTheme: 'dark' })
    unsubscribe()

    expect(listener).toHaveBeenCalledWith({ themePreference: 'dark', resolvedTheme: 'dark' })
    expect(electronMockState.ipcRenderer.on).toHaveBeenCalledWith('sona:settings:theme-changed', expect.any(Function))
    expect(electronMockState.ipcRenderer.removeListener).toHaveBeenCalledWith(
      'sona:settings:theme-changed',
      handler,
    )
  })
})

async function requirePreloadModule() {
  return import('../../apps/desktop/src/preload/index.js')
}