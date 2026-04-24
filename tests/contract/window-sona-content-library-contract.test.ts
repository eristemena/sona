import { beforeEach, describe, expect, it, vi } from 'vitest'

import { electronMockState, resetElectronMock } from '../setup/electron-mock.js'

describe('window.sona content preload contract', () => {
  beforeEach(() => {
    vi.resetModules()
    resetElectronMock()
  })

  it('exposes the typed content surface and invokes the content channels', async () => {
    const { createWindowSonaApi } = await import('../../apps/desktop/src/preload/index.js')
    const api = createWindowSonaApi(electronMockState.ipcRenderer)

    await api.content.listLibraryItems();
    await api.content.getContentBlocks('item-1')
    await api.content.browseSubtitleFile()
    await api.content.importSrt({ filePath: '/tmp/sample.srt', difficulty: 1 })
    await api.content.createArticleFromPaste({ text: '안녕하세요.', difficulty: 2 })
    await api.content.createArticleFromUrl({ url: 'https://example.com', difficulty: 2 })
    await api.content.generatePracticeSentences({ topic: 'coffee shop', difficulty: 3 })
    await api.content.deleteContent('item-1')

    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      1,
      "sona:content:list-library-items",
    );
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(2, 'sona:content:get-content-blocks', 'item-1')
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(3, 'sona:content:browse-subtitle-file')
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      4,
      'sona:content:import-srt',
      { filePath: '/tmp/sample.srt', difficulty: 1 },
    )
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      5,
      'sona:content:create-article-from-paste',
      { text: '안녕하세요.', difficulty: 2 },
    )
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      6,
      'sona:content:create-article-from-url',
      { url: 'https://example.com', difficulty: 2 },
    )
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(
      7,
      'sona:content:generate-practice-sentences',
      { topic: 'coffee shop', difficulty: 3 },
    )
    expect(electronMockState.ipcRenderer.invoke).toHaveBeenNthCalledWith(8, 'sona:content:delete-content', 'item-1')
  })
})