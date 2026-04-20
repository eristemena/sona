import { readFile } from 'node:fs/promises'

import SrtParser2 from 'srt-parser-2'

import { isSupportedSubtitlePath, normalizeSubtitleCueText, type ParsedSubtitleCue } from '@sona/domain/content'
import type { ImportSrtInput } from '@sona/domain/contracts/content-library'
import type { SaveContentDraft } from '@sona/data/sqlite/content-library-repository'

import { mapSubtitleImportToDraft } from './subtitle-block-mapper.js'

interface SubtitleParserLine {
  id: string
  startSeconds: number
  endSeconds: number
  text: string
}

interface SrtImportServiceRuntime {
  now: () => number
  readFile: (filePath: string, encoding: BufferEncoding) => Promise<string>
}

export class SrtImportService {
  private lastIssuedTimestamp = 0

  constructor(private readonly runtime: SrtImportServiceRuntime = { now: () => Date.now(), readFile }) {}

  private getCreatedAtTimestamp() {
    const nextTimestamp = this.runtime.now()
    const createdAt = nextTimestamp > this.lastIssuedTimestamp ? nextTimestamp : this.lastIssuedTimestamp + 1
    this.lastIssuedTimestamp = createdAt
    return createdAt
  }

  async importFromFile(input: ImportSrtInput): Promise<SaveContentDraft> {
    const sourceReference = input.filePath ?? input.fileName
    if (!sourceReference || !isSupportedSubtitlePath(sourceReference)) {
      throw new Error('Only .srt subtitle files are supported.')
    }

    const fileContents = input.fileContent
      ?? (input.filePath
        ? await this.runtime.readFile(input.filePath, 'utf8').catch(() => {
            throw new Error('The subtitle file could not be read from disk.')
          })
        : null)

    if (!fileContents) {
      throw new Error('The subtitle file could not be loaded.')
    }

    const parser = new SrtParser2()

    let lines: SubtitleParserLine[]
    try {
      lines = parser.fromSrt(fileContents) as SubtitleParserLine[]
    } catch {
      throw new Error('The subtitle file could not be parsed as valid SRT content.')
    }

    const cues: ParsedSubtitleCue[] = lines
      .map((line) => ({
        id: String(line.id),
        startSeconds: Number(line.startSeconds),
        endSeconds: Number(line.endSeconds),
        text: normalizeSubtitleCueText(line.text),
      }))
      .filter((line) => Number.isFinite(line.startSeconds) && Number.isFinite(line.endSeconds) && line.text.length > 0)

    return mapSubtitleImportToDraft({
      sourceReference,
      filePath: input.filePath ?? null,
      cues,
      importInput: input,
      createdAt: this.getCreatedAtTimestamp(),
    })
  }
}