'use client'

import type { KnownWordOnboardingStatus } from '@sona/domain/contracts/content-review'

import { Button } from '../ui/button'

interface KnownWordOnboardingProps {
  status: KnownWordOnboardingStatus
  isCompleting: boolean
  onComplete: (seedPackId: string) => Promise<void>
}

export function KnownWordOnboarding({ status, isCompleting, onComplete }: KnownWordOnboardingProps) {
  if (!status.shouldOnboard || status.availableSeedPacks.length === 0) {
    return null
  }

  return (
    <section aria-labelledby="known-word-onboarding-title" className="overflow-hidden rounded-[1.75rem] border border-(--border) bg-[linear-gradient(145deg,color-mix(in_srgb,var(--accent)_14%,transparent),color-mix(in_srgb,var(--bg-surface)_92%,transparent)_52%,transparent)] shadow-(--shadow-soft)">
      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)] lg:px-8 lg:py-8">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.32em] text-(--text-muted)">Optional onboarding</p>
          <h2 className="text-[30px] font-semibold leading-tight text-(--text-primary)" id="known-word-onboarding-title">
            Known words you already own
          </h2>
          <p className="max-w-2xl text-[15px] leading-7 text-(--text-secondary)">
            Seed a starter list of vocabulary you do not need surfaced as fresh deck captures. This stays local, reversible, and does not block today&apos;s due review.
          </p>
        </div>

        <div className="rounded-[1.35rem] border border-[color:color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color:color-mix(in_srgb,var(--bg-elevated)_88%,transparent)] p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Seed packs</p>
          <div className="mt-4 space-y-4">
            {status.availableSeedPacks.map((pack) => (
              <div className="rounded-[1.1rem] border border-(--border) bg-(--bg-surface)/70 p-4" key={pack.id}>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-(--text-primary)">{pack.label}</h3>
                  <p className="text-sm leading-6 text-(--text-secondary)">{pack.description}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-(--text-muted)">{pack.wordCount} words</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button disabled={isCompleting} onClick={() => void onComplete(pack.id)} type="button" variant="primary">
                    {isCompleting ? 'Saving…' : `Use ${pack.label.replace(/^Core beginner vocabulary$/u, 'TOPIK I core')}`}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}