'use client'

import { Bar, BarChart, ResponsiveContainer, Tooltip } from 'recharts'

import type { WeeklyActivityPoint } from '@sona/domain/content/home-dashboard'

interface WeeklyActivityChartProps {
  points: WeeklyActivityPoint[]
}

function formatDayLabel(date: string) {
  const parsed = new Date(`${date}T12:00:00`)
  return parsed.toLocaleDateString(undefined, { weekday: 'short' })
}

export function WeeklyActivityChart({ points }: WeeklyActivityChartProps) {
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer>
        <BarChart data={points} barCategoryGap="28%">
          <Tooltip
            cursor={{ fill: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}
            contentStyle={{
              border: '1px solid var(--border)',
              borderRadius: '16px',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
            formatter={(value, name) => {
              return [value ?? 0, name === 'cardsReviewed' ? 'Cards reviewed' : 'Minutes studied']
            }}
            labelFormatter={(label) => (typeof label === 'string' ? formatDayLabel(label) : '')}
          />
          <Bar dataKey="cardsReviewed" fill="var(--accent)" radius={[10, 10, 4, 4]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 grid grid-cols-7 gap-2 text-center text-[11px] uppercase tracking-[0.16em] text-(--text-muted)">
        {points.map((point) => (
          <span key={point.date}>{formatDayLabel(point.date)}</span>
        ))}
      </div>
    </div>
  )
}