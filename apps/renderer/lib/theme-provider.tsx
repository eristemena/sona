'use client'

import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import type { ResolvedTheme, ThemePreferenceMode } from '@sona/domain/contracts/window-sona'

import { fallbackShellBootstrapState, loadShellBootstrapState } from './shell-bootstrap'

interface ThemeContextValue {
  themePreference: ThemePreferenceMode
  resolvedTheme: ResolvedTheme
  setThemePreference: (mode: ThemePreferenceMode) => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyTheme(resolvedTheme: ResolvedTheme) {
  document.documentElement.dataset.theme = resolvedTheme
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreferenceMode>('system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark')

  useEffect(() => {
    let isActive = true

    void loadShellBootstrapState().then((bootstrapState) => {
      if (!isActive) {
        return
      }

      setThemePreferenceState(bootstrapState.themePreference)
      setResolvedTheme(bootstrapState.resolvedTheme)
      applyTheme(bootstrapState.resolvedTheme)
    })

    if (typeof window === 'undefined' || typeof window.sona === 'undefined') {
      applyTheme(fallbackShellBootstrapState.resolvedTheme)
      return () => {
        isActive = false
      }
    }

    const unsubscribe = window.sona.settings.subscribeThemeChanges((update) => {
      setThemePreferenceState(update.themePreference)
      setResolvedTheme(update.resolvedTheme)
      applyTheme(update.resolvedTheme)
    })

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      themePreference,
      resolvedTheme,
      async setThemePreference(mode) {
        if (typeof window === 'undefined' || typeof window.sona === 'undefined') {
          setThemePreferenceState(mode)
          return
        }

        const update = await window.sona.settings.setThemePreference(mode)
        setThemePreferenceState(update.themePreference)
        setResolvedTheme(update.resolvedTheme)
        applyTheme(update.resolvedTheme)
      },
    }),
    [resolvedTheme, themePreference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeContext() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider.')
  }

  return context
}