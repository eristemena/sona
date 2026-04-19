'use client'

import { useEffect, useState } from 'react'

import type { ShellBootstrapState } from '@sona/domain/contracts/shell-bootstrap'

import { fallbackShellBootstrapState, loadShellBootstrapState } from './shell-bootstrap'

export function useShellBootstrap() {
  const [state, setState] = useState<ShellBootstrapState>(fallbackShellBootstrapState)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    void loadShellBootstrapState().then((nextState) => {
      if (!active) {
        return
      }

      setState(nextState)
      setReady(true)
    })

    return () => {
      active = false
    }
  }, [])

  return { state, ready }
}