import { promises as fs } from 'node:fs'
import path from 'node:path'

export async function writeArtifact(relativePath: string, payload: unknown): Promise<string> {
  const targetPath = path.join(process.cwd(), 'artifacts', relativePath)
  await fs.mkdir(path.dirname(targetPath), { recursive: true })
  await fs.writeFile(targetPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return targetPath
}
