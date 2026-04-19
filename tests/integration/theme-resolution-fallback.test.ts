import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveThemePreference } from '../../packages/domain/src/settings/theme-preference.js'
import { electronMockState, emitNativeThemeUpdated, resetElectronMock } from '../setup/electron-mock.js'

describe('theme resolution fallback integration', () => {
  beforeEach(() => {
    resetElectronMock()
    electronMockState.nativeTheme.shouldUseDarkColors = false
  })

  it('prefers the system theme for missing or invalid settings and falls back to dark otherwise', () => {
    expect(resolveThemePreference({ storedPreference: null, systemTheme: 'light' })).toEqual({
      source: 'default',
      themePreference: 'system',
      resolvedTheme: 'light',
    })

    expect(resolveThemePreference({ storedPreference: 'invalid' as never, systemTheme: null })).toEqual({
      source: 'invalid-setting-fallback',
      themePreference: 'system',
      resolvedTheme: 'dark',
    })
  })

  it('rebroadcasts system-theme updates when the stored preference remains system', async () => {
    const send = vi.fn()
    const { registerNativeThemeEvents } = await import('../../apps/desktop/src/main/theme/native-theme-events.js')

    registerNativeThemeEvents(
      {
        settingsRepository: {
          getThemePreferenceMode: () => 'system',
        } as never,
        windows: () => [{ webContents: { send } }] as never[],
      },
      {
        nativeTheme: electronMockState.nativeTheme,
      },
    )

    electronMockState.nativeTheme.shouldUseDarkColors = true
    emitNativeThemeUpdated()

    expect(send).toHaveBeenCalledWith('sona:settings:theme-changed', {
      themePreference: 'system',
      resolvedTheme: 'dark',
    })
  })
})