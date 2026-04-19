'use client'

import { useThemeContext } from './theme-provider'

export function useThemePreference() {
  return useThemeContext()
}