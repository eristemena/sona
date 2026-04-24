'use client'

import { useEffect, useState } from "react";

import { useActiveDestination } from '../../lib/use-active-destination'
import { useShellBootstrap } from '../../lib/use-shell-bootstrap'
import { MainContentPlaceholder } from './main-content-placeholder'
import { SidebarNav } from './sidebar-nav'

export function AppShell() {
  const { ready, state } = useShellBootstrap()
  const { activeDestination, setActiveDestination } = useActiveDestination()
  const [reviewDueCount, setReviewDueCount] = useState(0)
  const [pendingResumeContentItemId, setPendingResumeContentItemId] = useState<string | null>(null)

  useEffect(() => {
    setActiveDestination(state.defaultDestination)
  }, [setActiveDestination, state.defaultDestination])

  useEffect(() => {
    let active = true;

    async function loadReviewDueCount() {
      if (
        !ready ||
        typeof window === "undefined" ||
        typeof window.sona?.review === "undefined"
      ) {
        if (active) {
          setReviewDueCount(0);
        }
        return;
      }

      try {
        const snapshot = await window.sona.review.getQueue(1);
        if (active) {
          setReviewDueCount(snapshot.dueCount);
        }
      } catch {
        if (active) {
          setReviewDueCount(0);
        }
      }
    }

    void loadReviewDueCount();

    return () => {
      active = false;
    };
  }, [activeDestination, ready]);

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
        reviewDueCount={reviewDueCount}
        onSelect={setActiveDestination}
      />
      <MainContentPlaceholder
        activeDestination={activeDestination}
        onNavigate={setActiveDestination}
        onResumeReading={(contentItemId) => {
          setPendingResumeContentItemId(contentItemId)
          setActiveDestination('library')
        }}
        pendingResumeContentItemId={pendingResumeContentItemId}
        onResumeHandled={() => setPendingResumeContentItemId(null)}
        key={activeDestination}
      />
      <div className="grain-overlay" />
    </div>
  );
}