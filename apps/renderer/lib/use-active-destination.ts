'use client'

import { useState } from 'react'

import type { NavigationDestinationId } from '@sona/domain/contracts/shell-bootstrap'

export function useActiveDestination(initialDestination: NavigationDestinationId = 'dashboard') {
  const [activeDestination, setActiveDestination] = useState<NavigationDestinationId>(initialDestination)

  return {
    activeDestination,
    setActiveDestination,
  }
}