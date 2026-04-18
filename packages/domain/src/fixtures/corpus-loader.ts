import { promises as fs } from 'node:fs'
import path from 'node:path'

import type { CorpusSegment } from '../provenance/corpus-segment.js'
import { validateCorpusSegment } from '../provenance/corpus-segment.js'

export async function loadCorpusSegments(rootDir = path.join(process.cwd(), 'fixtures', 'corpus')): Promise<CorpusSegment[]> {
  const files = await collectJsonFiles(rootDir)
  const segments = await Promise.all(
    files.map(async (filePath) => {
      const raw = JSON.parse(await fs.readFile(filePath, 'utf8')) as CorpusSegment | CorpusSegment[]
      return Array.isArray(raw) ? raw.map(validateCorpusSegment) : [validateCorpusSegment(raw)]
    }),
  )

  return segments.flat()
}

async function collectJsonFiles(rootDir: string): Promise<string[]> {
  let entries: fs.Dirent[]

  try {
    entries = await fs.readdir(rootDir, { withFileTypes: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }

    throw error
  }

  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      return collectJsonFiles(entryPath)
    }

    return entry.name.endsWith('.json') ? [entryPath] : []
  }))

  return files.flat()
}
