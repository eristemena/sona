'use client'

import { useEffect } from 'react'

import { useActiveDestination } from '../../lib/use-active-destination'
import { useShellBootstrap } from '../../lib/use-shell-bootstrap'
import { MainContentPlaceholder } from './main-content-placeholder'
import { SidebarNav } from './sidebar-nav'

export function AppShell() {
  const { ready, state } = useShellBootstrap()
  const { activeDestination, setActiveDestination } = useActiveDestination()

  useEffect(() => {
    setActiveDestination(state.navigation[0]?.id ?? 'dashboard')
  }, [setActiveDestination, state.navigation])

  if (!ready) {
    return (
      <div className="shell-loading">
        <div className="shell-loading-panel">
          <p className="text-xs uppercase tracking-[0.3em] text-(--text-muted)">Sona</p>
          <p className="mt-2 text-sm text-(--text-secondary)">Preparing your local shell…</p>
        </div>
        <div className="grain-overlay" />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-dvh bg-transparent text-(--text-primary)">
      <SidebarNav
        activeDestination={activeDestination}
        appName={state.appName}
        navigation={state.navigation}
        onSelect={setActiveDestination}
      />
      <MainContentPlaceholder
        activeDestination={activeDestination}
        key={activeDestination}
      />
      <div className="grain-overlay" />
    </div>
  );
}