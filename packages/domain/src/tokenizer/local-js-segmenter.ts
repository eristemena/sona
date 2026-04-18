export interface TokenizerAdapter {
  id: string
  tokenize(text: string): string[]
}

export const localJsSegmenter: TokenizerAdapter = {
  id: 'local-js-segmenter',
  tokenize(text: string) {
    const segmenter = new Intl.Segmenter('ko', { granularity: 'word' })
    return Array.from(segmenter.segment(text))
      .filter((segment) => segment.isWordLike)
      .map((segment) => segment.segment)
  },
}
