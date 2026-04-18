export interface OpenFileResult {
  path: string
  content: string
}

export interface AppApi {
  readTextFile(path: string): Promise<OpenFileResult>
  writeJsonFile(path: string, payload: unknown): Promise<void>
  resolveArtifactPath(relativePath: string): Promise<string>
}

declare global {
  interface Window {
    sonaApi: AppApi
  }
}
