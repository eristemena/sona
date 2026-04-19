import type { WindowSona } from '@sona/domain/contracts/window-sona'

declare global {
  interface Window {
    sona: WindowSona
  }
}

export {}