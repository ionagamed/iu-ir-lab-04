import { promises as fs } from 'fs'

export const storagePath = process.env.STORAGE_PATH

export async function mapLineChunks<T>(
  filename: string, fn: (x: Array<string>, i: number) => Promise<T>
): Promise<Array<T>> {
  const SEEK_SIZE = 64 * 1024
  // const SEEK_SIZE = 2

  let leftovers = ''
  const file = await fs.open(filename, 'r')
  const buf = Buffer.alloc(SEEK_SIZE)
  let offset = 0
  let i = 0

  const result = []

  while (true) {
    const { bytesRead } = await file.read(buf, 0, SEEK_SIZE, offset)
    if (bytesRead == 0) {
      break
    }

    const data = leftovers + buf.toString()
    const lines = data.split('\n')
    leftovers = lines[lines.length - 1]
    lines.splice(lines.length - 1, 1)

    if (lines.length > 0) {
      result.push(await fn(lines, i))
    }
    i += 1
    offset += bytesRead
  }

  return result
}

export async function mapEachLine<T>(filename: string, fn: (x: string) => Promise<T>): Promise<Array<T>> {
  const result = await mapLineChunks(filename, async lines => {
    return await Promise.all(lines.map(fn))
  })
  let output = []
  for (const group of result) {
    output = output.concat(group)
  }
  return output
}

// TODO: optimize
export async function loadLines(filename: string): Promise<Array<string>> {
  const file = await fs.open(filename, 'r')
  const data = await file.readFile()
  const lines = data.toString().split('\n')
  lines.splice(lines.length - 1, 1)
  return lines
}
