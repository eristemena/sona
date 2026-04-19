import { vi } from 'vitest'

type NativeThemeListener = () => void

const nativeThemeListeners = new Set<NativeThemeListener>()

export const electronMockState = {
  contextBridge: {
    exposeInMainWorld: vi.fn(),
  },
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  ipcMainHandlers: new Map<string, (...args: unknown[]) => unknown>(),
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      electronMockState.ipcMainHandlers.set(channel, handler)
    }),
  },
  nativeTheme: {
    shouldUseDarkColors: false,
    themeSource: 'system',
    on: vi.fn((event: string, listener: NativeThemeListener) => {
      if (event === 'updated') {
        nativeThemeListeners.add(listener)
      }
    }),
  },
  app: {
    isPackaged: false,
    getPath: vi.fn(() => '/tmp'),
    whenReady: vi.fn(() => Promise.resolve()),
    on: vi.fn(),
    quit: vi.fn(),
  },
}

class MockBrowserWindow {
  static getAllWindows() {
    return []
  }

  webContents = {
    send: vi.fn(),
  }

  once = vi.fn()
  show = vi.fn()
  loadURL = vi.fn()
  loadFile = vi.fn()
}

export function createElectronModuleMock() {
  return {
    app: electronMockState.app,
    BrowserWindow: MockBrowserWindow,
    contextBridge: electronMockState.contextBridge,
    ipcMain: electronMockState.ipcMain,
    ipcRenderer: electronMockState.ipcRenderer,
    nativeTheme: electronMockState.nativeTheme,
  }
}

export function emitNativeThemeUpdated() {
  for (const listener of nativeThemeListeners) {
    listener()
  }
}

export function resetElectronMock() {
  nativeThemeListeners.clear()
  electronMockState.contextBridge.exposeInMainWorld.mockReset()
  electronMockState.ipcRenderer.invoke.mockReset()
  electronMockState.ipcRenderer.on.mockReset()
  electronMockState.ipcRenderer.removeListener.mockReset()
  electronMockState.ipcMain.handle.mockReset()
  electronMockState.ipcMainHandlers.clear()
  electronMockState.nativeTheme.on.mockReset()
  electronMockState.nativeTheme.shouldUseDarkColors = false
  electronMockState.nativeTheme.themeSource = 'system'
  electronMockState.app.getPath.mockReset()
  electronMockState.app.getPath.mockReturnValue('/tmp')
  electronMockState.app.whenReady.mockReset()
  electronMockState.app.whenReady.mockResolvedValue(undefined)
  electronMockState.app.on.mockReset()
  electronMockState.app.quit.mockReset()
}