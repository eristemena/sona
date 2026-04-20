'use client'

import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'

import type {
  CreateArticleFromPasteInput,
  CreateArticleFromUrlInput,
  GeneratePracticeSentencesInput,
  ImportSrtInput,
  SaveContentResult,
} from '@sona/domain/contracts/content-library'

import { Button } from '../ui/button'

type AddContentMode = 'subtitle' | 'article-paste' | 'article-scrape' | 'generated'

const DIFFICULTY_OPTIONS = [
  { value: 1, label: '초급' },
  { value: 2, label: '중급' },
  { value: 3, label: '고급' },
] as const

const MODE_OPTIONS: Array<{ id: AddContentMode; label: string; description: string }> = [
  {
    id: 'subtitle',
    label: 'Subtitles',
    description: 'Import a local Korean .srt subtitle file.',
  },
  {
    id: 'article-paste',
    label: 'Paste article',
    description: 'Save Korean article text directly from a local paste.',
  },
  {
    id: 'article-scrape',
    label: 'Scrape article',
    description: 'Fetch article text from a reachable URL when network access is available.',
  },
  {
    id: 'generated',
    label: 'Generate practice',
    description: 'Create Korean practice sentences for a chosen topic and difficulty.',
  },
]

interface AddContentDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmitArticlePaste: (input: CreateArticleFromPasteInput) => Promise<SaveContentResult>
  onSubmitArticleUrl: (input: CreateArticleFromUrlInput) => Promise<SaveContentResult>
  onSubmitGenerated: (input: GeneratePracticeSentencesInput) => Promise<SaveContentResult>
  onSubmitSubtitle: (input: ImportSrtInput) => Promise<SaveContentResult>
}

export function AddContentDialog({
  isOpen,
  onClose,
  onSubmitArticlePaste,
  onSubmitArticleUrl,
  onSubmitGenerated,
  onSubmitSubtitle,
}: AddContentDialogProps) {
  const subtitleInputId = useId()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [mode, setMode] = useState<AddContentMode>('subtitle')
  const [filePath, setFilePath] = useState('')
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [articleText, setArticleText] = useState('')
  const [articleUrl, setArticleUrl] = useState('')
  const [topic, setTopic] = useState('')
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(1)
  const [pendingDuplicateConfirmation, setPendingDuplicateConfirmation] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setMode('subtitle')
      setFilePath('')
      setSelectedFileContent(null)
      setSelectedFileName(null)
      setArticleText('')
      setArticleUrl('')
      setTopic('')
      setTitle('')
      setDifficulty(1)
      setPendingDuplicateConfirmation(false)
      setErrorMessage(null)
      setDuplicateMessage(null)
      setIsSubmitting(false)
    }
  }, [isOpen])

  useEffect(() => {
    setPendingDuplicateConfirmation(false)
    setErrorMessage(null)
    setDuplicateMessage(null)
  }, [mode])

  if (!isOpen) {
    return null
  }

  async function submit(confirmDuplicate: boolean) {
    setIsSubmitting(true)
    setErrorMessage(null)

    const trimmedTitle = title.trim()
    let result: SaveContentResult

    if (mode === 'subtitle') {
      const nextInput: ImportSrtInput = {
        difficulty,
        confirmDuplicate,
      }

      if (selectedFileContent && selectedFileName) {
        nextInput.fileName = selectedFileName
        nextInput.fileContent = selectedFileContent
      } else {
        nextInput.filePath = filePath
      }

      if (trimmedTitle) {
        nextInput.title = trimmedTitle
      }

      result = await onSubmitSubtitle(nextInput)
    } else if (mode === 'article-paste') {
      const nextInput: CreateArticleFromPasteInput = {
        text: articleText,
        difficulty,
        confirmDuplicate,
      }

      if (trimmedTitle) {
        nextInput.title = trimmedTitle
      }

      result = await onSubmitArticlePaste(nextInput)
    } else if (mode === 'article-scrape') {
      const nextInput: CreateArticleFromUrlInput = {
        url: articleUrl,
        difficulty,
        confirmDuplicate,
      }

      if (trimmedTitle) {
        nextInput.title = trimmedTitle
      }

      result = await onSubmitArticleUrl(nextInput)
    } else {
      const nextInput: GeneratePracticeSentencesInput = {
        topic,
        difficulty,
        confirmDuplicate,
      }

      result = await onSubmitGenerated(nextInput)
    }

    setIsSubmitting(false)

    if (result.ok) {
      onClose()
      return
    }

    if (result.reason === 'duplicate-warning') {
      setPendingDuplicateConfirmation(true)
      setDuplicateMessage(result.message)
      return
    }

    setPendingDuplicateConfirmation(false)
    setDuplicateMessage(null)
    setErrorMessage(result.message)
  }

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    setErrorMessage(null)
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) {
      return
    }

    try {
      const contents = await selectedFile.text()
      setSelectedFileName(selectedFile.name)
      setSelectedFileContent(contents)
      setFilePath(selectedFile.name)
    } catch {
      setSelectedFileName(null)
      setSelectedFileContent(null)
      setErrorMessage('The selected subtitle file could not be read.')
    } finally {
      event.target.value = ''
    }
  }

  function getPrimaryActionLabel() {
    if (pendingDuplicateConfirmation) {
      return isSubmitting ? 'Saving…' : 'Save duplicate anyway'
    }

    if (mode === 'subtitle') {
      return isSubmitting ? 'Importing…' : 'Import subtitles'
    }

    if (mode === 'article-paste') {
      return isSubmitting ? 'Saving…' : 'Save pasted article'
    }

    if (mode === 'article-scrape') {
      return isSubmitting ? 'Scraping…' : 'Scrape article'
    }

    return isSubmitting ? 'Generating…' : 'Generate practice sentences'
  }

  function canSubmit() {
    if (mode === 'subtitle') {
      return filePath.trim().length > 0
    }

    if (mode === 'article-paste') {
      return articleText.trim().length > 0
    }

    if (mode === 'article-scrape') {
      return articleUrl.trim().length > 0
    }

    return topic.trim().length > 0
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-[color-mix(in_srgb,var(--bg-base)_72%,transparent)] p-4 backdrop-blur-sm">
      <div
        aria-describedby="add-content-description"
        aria-labelledby="add-content-title"
        aria-modal="true"
        className="w-full max-w-3xl rounded-[12px] border border-(--border) bg-(--bg-surface) p-6 shadow-[0_22px_48px_rgba(0,0,0,0.28)]"
        role="dialog"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-(--text-muted)">Add content</p>
        <h2 className="mt-3 text-xl font-semibold text-(--text-primary)" id="add-content-title">
          Save new Korean study material
        </h2>
        <p className="mt-3 text-sm leading-6 text-(--text-secondary)" id="add-content-description">
          Import subtitles, paste article text, or scrape an article URL into the shared local library without creating review work automatically.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4" role="tablist" aria-label="Content add modes">
          {MODE_OPTIONS.map((option) => {
            const active = option.id === mode

            return (
              <button
                aria-pressed={active}
                className={[
                  'rounded-[8px] border px-4 py-4 text-left transition-colors',
                  active
                    ? 'border-transparent bg-(--accent) text-white'
                    : 'border-(--border) bg-(--bg-elevated) text-(--text-primary)',
                ].join(' ')}
                key={option.id}
                onClick={() => setMode(option.id)}
                type="button"
              >
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className={['mt-2 block text-xs leading-5', active ? 'text-white/85' : 'text-(--text-secondary)'].join(' ')}>{option.description}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 grid gap-4">
          {mode === 'subtitle' ? (
            <>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-(--text-primary)">Subtitle file path</span>
                <div className="flex gap-3">
                  <input
                    className="h-9 min-w-0 flex-1 rounded-[6px] border border-(--border) bg-(--bg-surface) px-3 text-sm text-(--text-primary) outline-none focus:ring-2 focus:ring-(--accent) focus:ring-offset-2 focus:ring-offset-(--bg-surface)"
                    onChange={(event) => {
                      setSelectedFileContent(null)
                      setSelectedFileName(null)
                      setFilePath(event.target.value)
                    }}
                    placeholder="Choose a local .srt file"
                    type="text"
                    value={filePath}
                  />
                  <input accept=".srt" className="sr-only" id={subtitleInputId} onChange={handleFileSelection} ref={fileInputRef} type="file" />
                  <Button onClick={() => fileInputRef.current?.click()} type="button" variant="secondary">
                    Browse...
                  </Button>
                </div>
              </label>

              {selectedFileName ? <p className="text-xs leading-5 text-(--text-secondary)">Selected file: {selectedFileName}</p> : null}
            </>
          ) : null}

          {mode === 'article-paste' ? (
            <label className="grid gap-2">
              <span className="text-sm font-medium text-(--text-primary)">Article text</span>
              <textarea
                className="min-h-44 rounded-[8px] border border-(--border) bg-(--bg-surface) px-3 py-3 text-sm leading-6 text-(--text-primary) outline-none focus:ring-2 focus:ring-(--accent) focus:ring-offset-2 focus:ring-offset-(--bg-surface)"
                onChange={(event) => setArticleText(event.target.value)}
                placeholder="Paste Korean article text here"
                value={articleText}
              />
            </label>
          ) : null}

          {mode === 'article-scrape' ? (
            <label className="grid gap-2">
              <span className="text-sm font-medium text-(--text-primary)">Article URL</span>
              <input
                className="h-9 rounded-[6px] border border-(--border) bg-(--bg-surface) px-3 text-sm text-(--text-primary) outline-none focus:ring-2 focus:ring-(--accent) focus:ring-offset-2 focus:ring-offset-(--bg-surface)"
                onChange={(event) => setArticleUrl(event.target.value)}
                placeholder="https://example.com/korean-article"
                type="url"
                value={articleUrl}
              />
            </label>
          ) : null}

          {mode === 'generated' ? (
            <label className="grid gap-2">
              <span className="text-sm font-medium text-(--text-primary)">Practice topic</span>
              <input
                className="h-9 rounded-[6px] border border-(--border) bg-(--bg-surface) px-3 text-sm text-(--text-primary) outline-none focus:ring-2 focus:ring-(--accent) focus:ring-offset-2 focus:ring-offset-(--bg-surface)"
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Ordering coffee, subway directions, weekend plans"
                type="text"
                value={topic}
              />
            </label>
          ) : null}

          {mode !== 'generated' ? (
            <label className="grid gap-2">
              <span className="text-sm font-medium text-(--text-primary)">Library title</span>
              <input
                className="h-9 rounded-[6px] border border-(--border) bg-(--bg-surface) px-3 text-sm text-(--text-primary) outline-none focus:ring-2 focus:ring-(--accent) focus:ring-offset-2 focus:ring-offset-(--bg-surface)"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Optional custom title"
                type="text"
                value={title}
              />
            </label>
          ) : null}

          <label className="grid gap-2">
            <span className="text-sm font-medium text-(--text-primary)">Difficulty</span>
            <select
              className="h-9 rounded-[6px] border border-(--border) bg-(--bg-surface) px-3 text-sm text-(--text-primary) outline-none focus:ring-2 focus:ring-(--accent) focus:ring-offset-2 focus:ring-offset-(--bg-surface)"
              onChange={(event) => setDifficulty(Number(event.target.value) as 1 | 2 | 3)}
              value={difficulty}
            >
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {duplicateMessage ? (
          <div className="mt-5 rounded-2xl border border-[color-mix(in_srgb,var(--warning)_50%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] px-4 py-3 text-sm text-(--text-primary)">
            {duplicateMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-5 rounded-2xl border border-[color-mix(in_srgb,var(--danger)_50%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-4 py-3 text-sm text-(--text-primary)">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button disabled={isSubmitting || !canSubmit()} onClick={() => void submit(pendingDuplicateConfirmation)} variant="primary">
            {getPrimaryActionLabel()}
          </Button>
        </div>
      </div>
    </div>
  )
}
