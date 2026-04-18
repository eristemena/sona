import { contextBridge } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import type { AppApi } from '../../../../packages/domain/src/contracts/app-api.js'

const workspaceRoot = path.resolve(process.cwd())

const api: AppApi = {
  async readTextFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8')
    return { path: filePath, content }
  },
  async writeJsonFile(filePath, payload) {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  },
  async resolveArtifactPath(relativePath) {
    return path.join(workspaceRoot, 'artifacts', relativePath)
  },
}

contextBridge.exposeInMainWorld('sonaApi', api)
