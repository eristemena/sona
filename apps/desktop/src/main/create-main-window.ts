import { BrowserWindow, app } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

function resolveRendererEntryPoint(): string {
  if (process.env.SONA_RENDERER_URL) {
    return process.env.SONA_RENDERER_URL
  }

  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'renderer', 'index.html')
  }

  const currentFilePath = fileURLToPath(import.meta.url)
  const currentDir = path.dirname(currentFilePath)
  const repositoryRoot = path.resolve(currentDir, '../../../../')

  return path.join(repositoryRoot, 'apps', 'renderer', 'out', 'index.html')
}

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 1100,
    minHeight: 700,
    title: "Sona",
    backgroundColor: "#0F1117",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(
        fileURLToPath(new URL("..", import.meta.url)),
        "preload",
        "index.mjs",
      ),
      sandbox: false,
    },
  });

  window.once('ready-to-show', () => {
    window.show()
  })

  const entryPoint = resolveRendererEntryPoint()
  if (entryPoint.startsWith('http://') || entryPoint.startsWith('https://')) {
    void window.loadURL(entryPoint)
  } else {
    void window.loadFile(entryPoint)
  }

  return window
}