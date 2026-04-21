'use client'

import { Pause, Play, RotateCcw } from 'lucide-react'

import type { ReadingPlaybackState } from '@sona/domain/content'

import { Button } from '../ui/button'

interface ReadingAudioControlsProps {
  playbackState: ReadingPlaybackState
  playbackRate: number
  currentTimeMs: number
  durationMs: number
  disabled: boolean
  isConfigured: boolean
  isUnavailable: boolean
  onPause: () => void
  onPlay: () => void
  onRateChange: (playbackRate: number) => void
  onReplay: () => void
  onRetry?: () => void
  onSeek: (nextTimeMs: number) => void
}

const PLAYBACK_RATES = [0.75, 1, 1.25] as const

export function ReadingAudioControls(props: ReadingAudioControlsProps) {
  if (!props.isConfigured) {
    return null
  }

  const isPlaying = props.playbackState === 'playing' || props.playbackState === 'buffering'
  const canSeek = !props.disabled && props.durationMs > 0
  const sliderMax = Math.max(props.durationMs, props.currentTimeMs, 0)
  const activePlaybackRate = PLAYBACK_RATES.reduce((closest, candidate) => {
    return Math.abs(candidate - props.playbackRate) < Math.abs(closest - props.playbackRate) ? candidate : closest
  }, PLAYBACK_RATES[0])

  return (
    <section
      aria-label="Reading audio controls"
      className="sticky bottom-0 z-20 border-t border-(--border) px-4 py-3 backdrop-blur"
      style={{ backgroundColor: 'color-mix(in srgb, var(--bg-surface) 92%, var(--bg-base))' }}
    >
      <div className="mx-auto flex max-w-180 flex-col gap-3">
        <div className="flex items-center gap-2">
          <Button
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
            className="h-9 w-9 rounded-md px-0"
            disabled={props.disabled || props.isUnavailable}
            onClick={isPlaying ? props.onPause : props.onPlay}
            variant="ghost"
          >
            {isPlaying ? <Pause aria-hidden="true" className="h-5 w-5" /> : <Play aria-hidden="true" className="h-5 w-5" />}
          </Button>
          <Button
            aria-label="Replay sentence"
            className="h-9 w-9 rounded-md px-0"
            disabled={props.disabled || props.isUnavailable}
            onClick={props.onReplay}
            variant="ghost"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
          </Button>

          <input
            aria-label="Audio progress"
            className="ml-1 h-2 flex-1 accent-(--accent)"
            disabled={!canSeek || props.isUnavailable}
            max={sliderMax}
            min={0}
            onChange={(event) => props.onSeek(Number(event.target.value))}
            step={50}
            type="range"
            value={Math.min(props.currentTimeMs, sliderMax)}
          />

          <div className="ml-2 flex items-center gap-1.5">
            {PLAYBACK_RATES.map((rate) => {
              const active = activePlaybackRate === rate

              return (
                <button
                  className={
                    active
                      ? 'rounded-full bg-(--accent) px-2.5 py-1 text-[12px] font-medium text-white transition-colors duration-150 sm:px-3 sm:text-[13px]'
                      : 'rounded-full border border-(--border) px-2.5 py-1 text-[12px] font-medium text-(--text-secondary) transition-colors duration-150 hover:bg-(--bg-elevated) hover:text-(--text-primary) sm:px-3 sm:text-[13px]'
                  }
                  key={rate}
                  onClick={() => props.onRateChange(rate)}
                  type="button"
                >
                  {rate}x
                </button>
              )
            })}
          </div>
        </div>

        {props.isUnavailable ? (
          <div className="flex items-center justify-between gap-3 text-[13px] text-(--text-secondary)">
            <span>Audio unavailable</span>
            {props.onRetry ? (
              <Button className="h-8 rounded-md px-3 text-[13px]" onClick={props.onRetry} variant="ghost">
                <RotateCcw aria-hidden="true" className="mr-2 h-4 w-4" />
                Retry audio
              </Button>
            ) : null}
          </div>
        ) : props.disabled ? (
          <div className="text-[13px] text-(--text-secondary)">Preparing audio</div>
        ) : null}
      </div>
    </section>
  )
}