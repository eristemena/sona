// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ContentLibraryScreen } from '../../apps/renderer/components/library/content-library-screen.js'
import type { WindowSona } from '../../packages/domain/src/contracts/window-sona.js'

describe('library import dialog accessibility', () => {
  beforeEach(() => {
    window.sona = {
      shell: { getBootstrapState: vi.fn() },
      settings: {
        getThemePreference: vi.fn(),
        setThemePreference: vi.fn(),
        subscribeThemeChanges: vi.fn(() => () => undefined),
      },
      content: {
        listLibraryItems: vi.fn(async () => []),
        getContentBlocks: vi.fn(async () => []),
        browseSubtitleFile: vi.fn(),
        importSrt: vi.fn(),
        createArticleFromPaste: vi.fn(),
        createArticleFromUrl: vi.fn(),
        generatePracticeSentences: vi.fn(),
        deleteContent: vi.fn(),
      },
      reading: {
        getReadingSession: vi.fn(),
        ensureBlockAudio: vi.fn(),
        lookupWord: vi.fn(),
        explainGrammar: vi.fn(),
        addToDeck: vi.fn(),
        getWordStudyStatus: vi.fn(),
        saveReadingProgress: vi.fn(),
        flushExposureLog: vi.fn(),
      },
    } as unknown as WindowSona
  })

  afterEach(() => {
    cleanup()
  })

  it('shows the empty state and closes the add-content dialog with Escape', async () => {
    const user = userEvent.setup()

    render(<ContentLibraryScreen />)

    expect(await screen.findByText('Your library is empty')).toBeInTheDocument()
    expect(
      screen.getByText('Import a drama subtitle file, paste a Korean article, or generate practice sentences to get started.'),
    ).toBeInTheDocument()

    const results = screen.getByRole('region', { name: 'Content Library results' })
    await user.click(within(results).getByRole('button', { name: 'Add content' }))

    expect(screen.getByRole('dialog', { name: 'Save new Korean study material' })).toBeInTheDocument()
    expect(screen.getByText('Import subtitles, paste article text, or scrape an article URL into the shared local library without creating review work automatically.')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog', { name: 'Save new Korean study material' })).not.toBeInTheDocument()
  })
})