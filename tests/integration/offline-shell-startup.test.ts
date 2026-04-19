import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  fallbackShellBootstrapState,
  loadShellBootstrapState,
} from '../../apps/renderer/lib/shell-bootstrap.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('offline shell startup', () => {
  it('uses the fallback bootstrap state when the bridge is unavailable', async () => {
    const state = await loadShellBootstrapState()

    expect(state).toEqual(fallbackShellBootstrapState)
  })

  it('uses the fallback bootstrap state when the bridge call fails', async () => {
    vi.stubGlobal('window', {
      sona: {
        shell: {
          getBootstrapState: vi.fn().mockRejectedValue(new Error('offline')),
        },
      },
    })

    const state = await loadShellBootstrapState()

    expect(state).toEqual(fallbackShellBootstrapState)
  })
})