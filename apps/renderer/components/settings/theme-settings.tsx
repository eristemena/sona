'use client'

import { LaptopMinimal, MoonStar, SunMedium } from 'lucide-react'

import type { ThemePreferenceMode } from '@sona/domain/settings/theme-preference'

import { useThemePreference } from '../../lib/use-theme-preference'
import { Button } from '../ui/button'

const OPTIONS: Array<{ mode: ThemePreferenceMode; label: string; description: string; icon: typeof LaptopMinimal }> = [
  { mode: 'system', label: 'System', description: 'Follow macOS appearance.', icon: LaptopMinimal },
  { mode: 'dark', label: 'Dark', description: 'Use the calm default palette.', icon: MoonStar },
  { mode: 'light', label: 'Light', description: 'Use the bright reading surface.', icon: SunMedium },
]

export function ThemeSettings() {
  const { themePreference, resolvedTheme, setThemePreference } = useThemePreference()

  return (
    <section className="rounded-3xl border border-(--border) bg-(--bg-surface)/80 p-6 shadow-(--shadow-soft) backdrop-blur">
      <header className="mb-5 space-y-1">
        <h2 className="text-lg font-semibold text-(--text-primary)">Appearance</h2>
        <p className="text-sm text-(--text-secondary)">
          Current shell theme: <span className="font-medium text-(--text-primary)">{resolvedTheme}</span>
        </p>
      </header>
      <div className="grid gap-3 md:grid-cols-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon
          const active = themePreference === option.mode

          return (
            <Button
              aria-pressed={active}
              className="h-auto items-start justify-start gap-3 rounded-2xl px-4 py-4 text-left"
              key={option.mode}
              onClick={() => void setThemePreference(option.mode)}
              variant={active ? 'primary' : 'secondary'}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="space-y-1">
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className={active ? 'block text-xs text-white/80' : 'block text-xs text-(--text-secondary)'}>
                  {option.description}
                </span>
              </span>
            </Button>
          )
        })}
      </div>
    </section>
  )
}