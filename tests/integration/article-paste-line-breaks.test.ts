import { describe, expect, it } from 'vitest'

import { splitKoreanArticleSentences } from '../../packages/domain/src/content/sentence-splitter.js'

describe('article paste line breaks', () => {
  it('preserves short lyric-style line breaks as separate content blocks instead of collapsing them into one paragraph', () => {
    expect(splitKoreanArticleSentences([
      'Like an arrow in the blue sky',
      '또 하루 더 날아가지 (날아가지)',
      'On my pillow, on my table',
      'Yeah, life goes on like this again',
    ].join('\n'))).toEqual([
      'Like an arrow in the blue sky',
      '또 하루 더 날아가지 (날아가지)',
      'On my pillow, on my table',
      'Yeah, life goes on like this again',
    ])
  })
})