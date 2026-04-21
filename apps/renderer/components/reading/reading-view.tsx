'use client'

import { ArrowLeft } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { ReadingBlock } from '@sona/domain/content'
import type { WindowSona } from '@sona/domain/contracts/window-sona'

import { useKaraokeSync } from '../../lib/use-karaoke-sync'
import { useReadingPlayback } from '../../lib/use-reading-playback'
import { useReadingSession } from '../../lib/use-reading-session'
import { useWordLookup } from '../../lib/use-word-lookup'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { ReadingAudioControls } from './reading-audio-controls'
import { WordLookupPopup } from './word-lookup-popup'

interface ReadingViewFallbackBlock {
  id: string
  contentItemId: string
  korean: string
  romanization: string | null
  audioOffset: number | null
  sentenceOrdinal: number
  tokens: ReadingBlock['tokens']
}

interface ReadingViewFallbackMeta {
  itemTitle: string
  provenanceLabel: string
  provenanceDetail: string
}

export function ReadingView({
  contentItemId,
  onBack,
  fallbackBlocks = [],
  fallbackMeta,
}: {
  contentItemId: string
  onBack: () => void
  fallbackBlocks?: ReadingViewFallbackBlock[]
  fallbackMeta?: ReadingViewFallbackMeta
}) {
  const {
    session,
    progress,
    audioAsset,
    activeBlock,
    isLoadingSession,
    isLoadingAudio,
    errorMessage,
    updateProgress,
    persistProgress,
    selectBlock,
    refreshActiveBlockAudio,
    closeSession,
  } = useReadingSession(contentItemId)
  const wordLookup = useWordLookup()
  const [isAudioConfigured, setIsAudioConfigured] = useState(true)

  const { highlightedTokenIndex } = useKaraokeSync(activeBlock, audioAsset, progress.currentTimeMs)
  const displayBlocks = session?.blocks ?? fallbackBlocks
  const itemTitle = session?.itemTitle ?? fallbackMeta?.itemTitle ?? 'Reading session'
  const difficultyBadge = extractDifficultyBadge(session?.provenanceDetail ?? fallbackMeta?.provenanceDetail ?? '')
  const { audioRef, durationMs, playableAudioSrc, pause, play, replay, seek } = useReadingPlayback({
    audioFilePath: audioAsset?.state === 'ready' ? audioAsset.audioFilePath : null,
    initialTimeMs: progress.currentTimeMs,
    playbackRate: progress.playbackRate,
    fallbackDurationMs: audioAsset?.durationMs ?? null,
    onTimeChange: (currentTimeMs) => {
      updateProgress({ currentTimeMs })
    },
    onPlaybackStateChange: (playbackState) => {
      const shouldPersist = playbackState === 'paused' || playbackState === 'ended'
      updateProgress({ playbackState }, { persist: shouldPersist })
    },
  })

  useEffect(() => {
    if (progress.highlightedTokenIndex !== highlightedTokenIndex) {
      updateProgress({ highlightedTokenIndex })
    }
  }, [highlightedTokenIndex, progress.highlightedTokenIndex, updateProgress])

  useEffect(() => {
    let active = true

    if (typeof window === 'undefined' || typeof window.sona === 'undefined') {
      return () => {
        active = false
      }
    }

    const api = window.sona.settings as WindowSona['settings'] & {
      getOpenAiApiKeyStatus?: () => Promise<{ configured: boolean }>
    }

    if (typeof api.getOpenAiApiKeyStatus !== 'function') {
      return () => {
        active = false
      }
    }

    void api.getOpenAiApiKeyStatus().then((status) => {
      if (active) {
        setIsAudioConfigured(status.configured)
      }
    })

    return () => {
      active = false
    }
  }, [])

  const canPlayAudio = audioAsset?.state === 'ready' && Boolean(audioAsset.audioFilePath)
  const showAudioBar = isAudioConfigured || isLoadingAudio || audioAsset?.state === 'ready' || audioAsset?.state === 'failed'
  const isAudioUnavailable = (audioAsset?.state === 'unavailable' || audioAsset?.state === 'failed') && isAudioConfigured

  return (
    <section aria-label="Reading view" className="panel-enter flex min-h-0 flex-1 flex-col">
      <header className="grid h-13 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-b border-(--border) bg-(--bg-base) px-4 md:px-6">
        <Button
          aria-label="Back to library"
          className="h-9 w-9 rounded-md px-0"
          onClick={() => {
            closeSession()
            onBack()
          }}
          variant="ghost"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>

        <h2 className="truncate text-center text-[16px] font-semibold text-(--text-primary)">{itemTitle}</h2>

        <div className="flex justify-end">
          {difficultyBadge ? (
            <span className="rounded-sm border border-(--border) px-2 py-1 text-[11px] font-medium text-(--text-primary)">
              {difficultyBadge}
            </span>
          ) : <span className="h-7 w-10" aria-hidden="true" />}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-180 px-6 pb-30 pt-12">
          {errorMessage ? (
            <div className="mb-6 rounded-lg border border-[color-mix(in_srgb,var(--danger)_45%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-4 py-3 text-sm text-(--text-primary)">
              {errorMessage}
            </div>
          ) : null}

          {isLoadingSession ? <p className="text-sm text-(--text-secondary)">Loading reading content...</p> : null}
          {!isLoadingSession && displayBlocks.length === 0 ? (
            <div className="text-sm text-(--text-secondary)">No reading content is available yet.</div>
          ) : null}

          <div className="space-y-6">
            {displayBlocks.map((block) => {
              const isActive = block.id === activeBlock?.id

              return (
                <section
                  className="group"
                  key={block.id}
                  onClick={() => {
                    if (!isActive) {
                      selectBlock(block.id, { persist: true })
                    }
                  }}
                >
                  <ReadingBlockText
                    block={block}
                    highlightedTokenIndex={isActive ? highlightedTokenIndex : null}
                    onTokenClick={({ anchorElement, token, tokenIndex }) => {
                      if (!isActive) {
                        selectBlock(block.id, { persist: true })
                      }

                      void wordLookup.openLookup({
                        anchorElement,
                        blockId: block.id,
                        sentenceContext: block.korean,
                        token,
                        tokenIndex,
                      })
                    }}
                  />
                  {block.romanization ? <p className="mt-2 text-[15px] italic leading-normal text-(--text-secondary)">{block.romanization}</p> : null}
                </section>
              )
            })}
          </div>
        </div>
      </div>

      {showAudioBar ? (
        <ReadingAudioControls
          currentTimeMs={progress.currentTimeMs}
          disabled={!canPlayAudio}
          durationMs={durationMs}
          isConfigured={isAudioConfigured}
          isUnavailable={isAudioUnavailable}
          onPause={() => {
            pause()
            persistProgress({ playbackState: 'paused' })
          }}
          onPlay={() => {
            void play()
          }}
          onRateChange={(playbackRate) => {
            updateProgress({ playbackRate }, { persist: true })
          }}
          onReplay={() => {
            replay()
            persistProgress({ playbackState: 'playing', currentTimeMs: 0 })
          }}
          onRetry={refreshActiveBlockAudio}
          onSeek={(currentTimeMs) => {
            seek(currentTimeMs)
            persistProgress({ currentTimeMs, highlightedTokenIndex })
          }}
          playbackRate={progress.playbackRate}
          playbackState={progress.playbackState}
        />
      ) : null}

      <audio ref={audioRef} preload="metadata" src={audioAsset?.state === 'ready' ? playableAudioSrc ?? undefined : undefined} />
      <WordLookupPopup
        addToDeckResult={wordLookup.addToDeckResult}
        isAddingToDeck={wordLookup.isAddingToDeck}
        isLoadingGrammar={wordLookup.isLoadingGrammar}
        isLoadingLookup={wordLookup.isLoadingLookup}
        isOpen={wordLookup.isOpen}
        lookupResult={wordLookup.result}
        onAddToDeck={wordLookup.addToDeck}
        onDismiss={wordLookup.dismissLookup}
        onRequestGrammarExplanation={wordLookup.requestGrammarExplanation}
        target={wordLookup.target}
      />
    </section>
  )
}

function ReadingBlockText({
  block,
  highlightedTokenIndex,
  onTokenClick,
}: {
  block: ReadingBlock
  highlightedTokenIndex: number | null
  onTokenClick: (input: { anchorElement: HTMLElement; token: string; tokenIndex: number }) => void
}) {
  const segments = useMemo(() => buildReadingSegments(block), [block])

  if (segments.length === 0) {
    return <p className="text-[24px] leading-[1.9] tracking-[0.02em] text-(--text-primary) md:text-[26px]">{block.korean}</p>
  }

  return (
    <p className="text-[24px] leading-[1.9] tracking-[0.02em] text-(--text-primary) md:text-[26px]">
      {segments.map((segment) => {
        if (segment.type === 'gap') {
          return <span key={segment.key}>{segment.value}</span>
        }

        const isHighlighted = highlightedTokenIndex === segment.tokenIndex

        return (
          <button
            className={cn(
              'rounded-sm px-0.5 transition-colors duration-75 linear focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)',
              isHighlighted ? 'bg-(--accent-subtle) text-(--accent)' : 'text-(--text-primary)',
            )}
            data-highlighted={isHighlighted ? 'true' : undefined}
            data-token-index={segment.tokenIndex}
            key={segment.key}
            onClick={(event) => {
              onTokenClick({
                anchorElement: event.currentTarget,
                token: segment.value,
                tokenIndex: segment.tokenIndex,
              })
            }}
            type="button"
          >
            {segment.value}
          </button>
        )
      })}
    </p>
  )
}

function buildReadingSegments(block: ReadingBlock): Array<
  | { key: string; type: 'gap'; value: string }
  | { key: string; type: 'token'; tokenIndex: number; value: string }
> {
  if (block.tokens.length === 0) {
    return []
  }

  const segments: Array<{ key: string; type: 'gap'; value: string } | { key: string; type: 'token'; tokenIndex: number; value: string }> = []
  let cursor = 0

  for (const token of block.tokens) {
    const tokenText = token.surface
    const tokenStart = block.korean.indexOf(tokenText, cursor)

    if (tokenStart === -1) {
      return []
    }

    if (tokenStart > cursor) {
      segments.push({
        key: `gap-${cursor}`,
        type: 'gap',
        value: block.korean.slice(cursor, tokenStart),
      })
    }

    segments.push({
      key: `token-${token.index}`,
      type: 'token',
      tokenIndex: token.index,
      value: tokenText,
    })

    cursor = tokenStart + tokenText.length
  }

  if (cursor < block.korean.length) {
    segments.push({
      key: `gap-${cursor}`,
      type: 'gap',
      value: block.korean.slice(cursor),
    })
  }

  return segments
}

function extractDifficultyBadge(value: string): string | null {
  if (value.includes('초급')) {
    return '초급'
  }

  if (value.includes('중급')) {
    return '중급'
  }

  if (value.includes('고급')) {
    return '고급'
  }

  return null
}