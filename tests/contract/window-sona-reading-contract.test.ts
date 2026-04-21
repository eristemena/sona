import { beforeEach, describe, expect, it, vi } from 'vitest'

import { electronMockState, resetElectronMock } from '../setup/electron-mock.js'

describe('window.sona reading preload contract', () => {
  beforeEach(() => {
    vi.resetModules()
    resetElectronMock()
  })

  it('exposes the typed reading surface and invokes the reading channels', async () => {
    const { createWindowSonaApi } = await import('../../apps/desktop/src/preload/index.js')
    const api = createWindowSonaApi(electronMockState.ipcRenderer)

    await api.reading.getReadingSession('item-1')
    await api.reading.ensureBlockAudio('block-1')
    await api.reading.lookupWord({ blockId: 'block-1', token: '안녕하세요', tokenIndex: 0, sentenceContext: '안녕하세요.' })
    await api.reading.explainGrammar({ blockId: 'block-1', token: '안녕하세요', tokenIndex: 0, sentenceContext: '안녕하세요.' })
    await api.reading.addToDeck({ blockId: 'block-1', token: '안녕하세요', canonicalForm: '안녕하세요', sentenceContext: '안녕하세요.' })
    await api.reading.saveReadingProgress({
      contentItemId: 'item-1',
      activeBlockId: 'block-1',
      playbackState: 'paused',
      playbackRate: 1,
      currentTimeMs: 1200,
      highlightedTokenIndex: 0,
    })
    await api.reading.flushExposureLog({ entries: [{ blockId: 'block-1', token: '안녕하세요', seenAt: 1_716_000_000_000 }] })

    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(1, 'sona:reading:get-session', 'item-1')
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(2, 'sona:reading:ensure-block-audio', 'block-1')
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(3, 'sona:reading:lookup-word', {
      blockId: 'block-1',
      token: '안녕하세요',
      tokenIndex: 0,
      sentenceContext: '안녕하세요.',
    })
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(4, 'sona:reading:explain-grammar', {
      blockId: 'block-1',
      token: '안녕하세요',
      tokenIndex: 0,
      sentenceContext: '안녕하세요.',
    })
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(5, 'sona:reading:add-to-deck', {
      blockId: 'block-1',
      token: '안녕하세요',
      canonicalForm: '안녕하세요',
      sentenceContext: '안녕하세요.',
    })
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(6, 'sona:reading:save-progress', {
      contentItemId: 'item-1',
      activeBlockId: 'block-1',
      playbackState: 'paused',
      playbackRate: 1,
      currentTimeMs: 1200,
      highlightedTokenIndex: 0,
    })
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(7, 'sona:reading:flush-exposure-log', {
      entries: [{ blockId: 'block-1', token: '안녕하세요', seenAt: 1_716_000_000_000 }],
    })
  })
})