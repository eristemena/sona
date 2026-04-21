'use client'

import { useMemo } from 'react'

import type { ReadingAudioAsset, ReadingBlock, WordTiming } from '@sona/domain/content'

export type KaraokeTimingMode = 'provider' | 'estimated' | 'none'

interface ResolvedKaraokeState {
  highlightedTokenIndex: number | null
  timings: WordTiming[]
  timingMode: KaraokeTimingMode
}

export function useKaraokeSync(block: ReadingBlock | null, audioAsset: ReadingAudioAsset | null, currentTimeMs: number): ResolvedKaraokeState {
  const resolved = useMemo(() => resolveKaraokeTimings(block, audioAsset), [audioAsset, block])

  const highlightedTokenIndex = useMemo(() => {
    if (resolved.timings.length === 0) {
      return null
    }

    const activeTiming = resolved.timings.find((timing) => currentTimeMs >= timing.startMs && currentTimeMs < timing.endMs)
    if (activeTiming) {
      return activeTiming.tokenIndex
    }

    if (currentTimeMs >= resolved.timings[resolved.timings.length - 1]!.endMs) {
      return resolved.timings[resolved.timings.length - 1]!.tokenIndex
    }

    return null
  }, [currentTimeMs, resolved.timings])

  return {
    highlightedTokenIndex,
    timings: resolved.timings,
    timingMode: resolved.timingMode,
  }
}

export function resolveKaraokeTimings(block: ReadingBlock | null, audioAsset: ReadingAudioAsset | null): {
  timings: WordTiming[]
  timingMode: KaraokeTimingMode
} {
  if (!block || !audioAsset || audioAsset.state !== 'ready') {
    return { timings: [], timingMode: 'none' }
  }

  const providerTimings = audioAsset.timings.filter((timing) => timing.endMs > timing.startMs)
  if (providerTimings.length > 0) {
    return { timings: providerTimings, timingMode: 'provider' }
  }

  if (!audioAsset.durationMs || block.tokens.length === 0) {
    return { timings: [], timingMode: 'none' }
  }

  const totalWeight = block.tokens.reduce((sum, token) => sum + Math.max(1, Array.from(token.surface.trim()).length), 0)
  let cursor = 0
  const timings = block.tokens.map((token, index) => {
    const weight = Math.max(1, Array.from(token.surface.trim()).length)
    const sliceDuration = index === block.tokens.length - 1 ? audioAsset.durationMs! - cursor : Math.max(120, Math.round((audioAsset.durationMs! * weight) / totalWeight))
    const startMs = cursor
    const endMs = Math.min(audioAsset.durationMs!, startMs + sliceDuration)
    cursor = endMs

    return {
      tokenIndex: token.index,
      surface: token.surface,
      startMs,
      endMs: endMs > startMs ? endMs : startMs + 120,
    }
  })

  return { timings, timingMode: 'estimated' }
}