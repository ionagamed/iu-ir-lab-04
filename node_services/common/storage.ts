import { promises as fs } from 'fs'
import * as path from 'path'

const storagePath = process.env.STORAGE_PATH
fs.mkdir(storagePath, { recursive: true })
if (!storagePath) {
  throw new Error('STORAGE_PATH is not specified')
}

export function getLocalPath(localPath: string): string {
  return path.join(storagePath, localPath)
}
