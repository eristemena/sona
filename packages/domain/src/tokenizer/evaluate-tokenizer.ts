import type { TokenizerReport, TokenizerStratumResult } from '../artifacts/spike-artifact-schema.js'
import { validateTokenizerReport } from '../artifacts/spike-artifact-schema.js'
import type { CorpusSegment } from '../provenance/corpus-segment.js'
import type { TokenizerAdapter } from './local-js-segmenter.js'

export function evaluateTokenizers(
  segments: CorpusSegment[],
  adapters: TokenizerAdapter[],
): TokenizerReport {
  const strata = [...new Set(segments.map((segment) => segment.stratum))].sort()
  const stratumResults: TokenizerStratumResult[] = strata.map((stratum) => {
    const stratumSegments = segments.filter((segment) => segment.stratum === stratum)
    const scores = adapters.map((adapter) => scoreAdapter(adapter, stratumSegments))
    const best = scores.sort((left, right) => right.score - left.score)[0]

    return {
      name: stratum,
      segmentCount: stratumSegments.length,
      accuracyScore: best.score,
      errorClasses: best.errorClasses,
      learnerImpact: best.learnerImpact,
      recommendedDisposition: best.score >= 0.8 ? 'proceed' : best.score >= 0.65 ? 'revise' : 'fallback-only',
    }
  })

  const recommendedTrack = chooseRecommendedTrack(segments, adapters)

  return validateTokenizerReport({
    reportId: `tokenizer-report-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    tracks: adapters.map((adapter) => adapter.id),
    strata: stratumResults,
    recommendedTrack,
    openRisks: stratumResults
      .filter((result) => result.recommendedDisposition !== 'proceed')
      .map((result) => `${result.name}: ${result.learnerImpact}`),
  })
}

function chooseRecommendedTrack(segments: CorpusSegment[], adapters: TokenizerAdapter[]): string {
  const ranked = adapters
    .map((adapter) => ({
      id: adapter.id,
      score: scoreAdapter(adapter, segments).score,
    }))
    .sort((left, right) => right.score - left.score)

  return ranked[0]?.id ?? adapters[0]?.id ?? 'local-js-segmenter'
}

function scoreAdapter(adapter: TokenizerAdapter, segments: CorpusSegment[]) {
  const tokenized = segments.map((segment) => adapter.tokenize(segment.text))
  const tokenCounts = tokenized.map((tokens) => tokens.length)
  const avgTokens = tokenCounts.reduce((sum, count) => sum + count, 0) / Math.max(tokenCounts.length, 1)
  const avgLength = tokenized
    .flat()
    .reduce((sum, token) => sum + token.length, 0) / Math.max(tokenized.flat().length, 1)
  const balanceScore = Math.min(avgTokens / 8, 1)
  const granularityScore = Math.min(avgLength / 4, 1)
  const score = Number((balanceScore * 0.6 + granularityScore * 0.4).toFixed(2))
  const errorClasses = score >= 0.8 ? [] : ['needs-manual-review']

  return {
    score,
    errorClasses,
    learnerImpact:
      score >= 0.8
        ? 'Low impact on reading lookup and review extraction.'
        : 'Potential token boundary drift may require fallback or manual review.',
  }
}
