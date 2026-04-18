import type { TokenizerAdapter } from './local-js-segmenter.js'

export const llmFallbackReference: TokenizerAdapter = {
  id: 'llm-fallback-reference',
  tokenize(text: string) {
    return text
      .replace(/[\r\n]+/g, ' ')
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean)
  },
}
