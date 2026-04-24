import { ipcMain, nativeTheme } from 'electron'

import { createShellBootstrapState, DEFAULT_NAVIGATION_DESTINATIONS } from '@sona/domain/contracts/shell-bootstrap'

import type { DailyReviewService } from '../content/daily-review-service.js'
import type { SqliteSettingsRepository } from '@sona/data/sqlite/settings-repository'

const GET_BOOTSTRAP_STATE_CHANNEL = 'sona:shell:get-bootstrap-state'
const GET_HOME_DASHBOARD_CHANNEL = 'sona:shell:get-home-dashboard'

interface ShellElectronRuntime {
  ipcMain: {
    handle: (channel: string, listener: (...args: unknown[]) => unknown) => void
  }
  nativeTheme: {
    shouldUseDarkColors: boolean
  }
}

interface RegisterShellHandlersOptions {
  dailyReviewService: DailyReviewService
  settingsRepository: SqliteSettingsRepository
}

export function registerShellHandlers(
  { dailyReviewService, settingsRepository }: RegisterShellHandlersOptions,
  runtime: ShellElectronRuntime = { ipcMain, nativeTheme },
) {
  runtime.ipcMain.handle(GET_BOOTSTRAP_STATE_CHANNEL, () => {
    const themePreference = settingsRepository.getThemePreferenceMode()

    return createShellBootstrapState({
      defaultDestination: 'dashboard',
      navigation: DEFAULT_NAVIGATION_DESTINATIONS,
      themePreference,
      systemTheme: runtime.nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
    })
  })

  runtime.ipcMain.handle(GET_HOME_DASHBOARD_CHANNEL, () => {
    return dailyReviewService.getHomeDashboard()
  })
}