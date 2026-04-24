'use client'

import { useEffect, useState } from 'react'

import type { HomeDashboardSnapshot } from '@sona/domain/content/home-dashboard'

function getShellApi() {
  if (
    typeof window === 'undefined' ||
    typeof window.sona === 'undefined' ||
    typeof window.sona.shell?.getHomeDashboard !== 'function'
  ) {
    return null
  }

  return window.sona.shell
}

export function useHomeDashboard() {
  const [snapshot, setSnapshot] = useState<HomeDashboardSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const shellApi = getShellApi()

    if (!shellApi) {
      setSnapshot(null)
      setErrorMessage('The desktop dashboard bridge is unavailable.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    void shellApi
      .getHomeDashboard()
      .then((nextSnapshot) => {
        if (active) {
          setSnapshot(nextSnapshot)
        }
      })
      .catch(() => {
        if (active) {
          setSnapshot(null)
          setErrorMessage('The home dashboard could not be loaded from local study data.')
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  return {
    snapshot,
    isLoading,
    errorMessage,
  }
}