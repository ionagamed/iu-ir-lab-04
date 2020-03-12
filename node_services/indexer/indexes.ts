import * as crypto from 'crypto'
import { promises as fs } from 'fs'
import * as path from 'path'
import { mapLineChunks, loadLines, mapEachLine } from './storage'
import { TokenMapPair } from './tokenMapPair'

function hash(value: string): string {
  return crypto.createHash('md5').update(value).digest('hex')
}

async function rmrf(targetPath: string) {
  await Promise.all((await fs.readdir(targetPath)).map(async function(entry) {
    var entryPath = path.join(targetPath, entry)
    if ((await fs.lstat(entryPath)).isDirectory()) {
      rmrf(entryPath)
    } else {
      await fs.unlink(entryPath);
    }
  }))
  await fs.rmdir(targetPath);
}

export interface IIndex {
  rebuild(): Promise<void>
  storeToken(token: string, docId: string): Promise<void>
  finalizeRebuild(): Promise<void>
}

class TokenRecord {
  constructor (
    public token: string,
    public docIds: string[]
  ) {}

  static fromString(value: string): TokenRecord {
    const data = value.split(',').map(y => y.replace(/"/g, ''))
    return new TokenRecord(data[0], data.slice(1))
  }

  toString() {
    return [this.token, ...this.docIds].join(',')
  }
}

class Index implements IIndex {
  constructor (
    indexType: string,
    private storagePath = path.join(process.env.STORAGE_PATH, indexType),
    private unsortedFilePath = path.join(storagePath, 'unsorted'),
    private indexMapFilePath = path.join(storagePath, 'index_map'),
    private indexDataFilePath = path.join(storagePath, 'index_data')
  ) {}

  async lookup(token: string) {
    const map = new TokenMapPair(this.indexMapFilePath, this.indexDataFilePath)
    await map.open()
    const result = await map.get(token)
    await map.close()
    return result
  }

  async storeToken(token: string, docId: string) {
    await fs.mkdir(this.storagePath, { recursive: true })
    const file = await fs.open(this.unsortedFilePath, 'a')
    await file.write(`\"${token}\",\"${docId}\"\n`)
    await file.close()
  }

  async rebuild() {
    try {
      console.log(`removing ${this.storagePath}`)
      await rmrf(this.storagePath)
    } catch (ignored) {
      console.log(ignored.message)
    }
  }

  async finalizeRebuild() {
    await fs.mkdir(this.storagePath, { recursive: true })
    const chunks = await this.sortChunks()
    const finalFilename = await this.mergeChunks(chunks)
    await fs.unlink(this.unsortedFilePath)
    await this.optimize(finalFilename)
  }

  private async sortChunks() {
    return mapLineChunks(this.unsortedFilePath, async (lines, i) => {
      let arr = lines.map(TokenRecord.fromString)
      arr.sort((x, y) => x.token.localeCompare(y.token))
      arr = this.mergeChunk(arr)

      const filename = '' + i

      const tmpFile = await fs.open(path.join(this.storagePath, filename), 'w')
      await tmpFile.write(arr.map(x => x.toString()).join('\n') + '\n')
      await tmpFile.close()
      return filename
    })
  }

  private mergeChunk(tokens: Array<TokenRecord>) {
    const result: Array<TokenRecord> = []
    for (const record of tokens) {
      if (result.length === 0 || result[result.length - 1].token !== record.token) {
        result.push(record)
      } else {
        result[result.length - 1].docIds =
          result[result.length - 1].docIds.concat(record.docIds)
      }
    }
    return result
  }

  private async mergeTwoChunks(left: string, right: string) {
    // TODO: optimize
    const leftTokens = (await loadLines(path.join(this.storagePath, left))).map(TokenRecord.fromString)
    const rightTokens = (await loadLines(path.join(this.storagePath, right))).map(TokenRecord.fromString)

    const resultTokens: Array<TokenRecord> = []

    let i = 0, j = 0
    while (i < leftTokens.length && j < rightTokens.length) {
      const leftToken = leftTokens[i]
      const rightToken = rightTokens[j]

      if (leftToken.token === rightToken.token) {
        resultTokens.push(new TokenRecord(
          leftToken.token,
          Array.from(new Set(leftToken.docIds.concat(rightToken.docIds)))
        ))
        i += 1
        j += 1
      } else if (leftToken.token < rightToken.token) {
        resultTokens.push(leftToken)
        i += 1
      } else {
        resultTokens.push(rightToken)
        j += 1
      }
    }

    while (i < leftTokens.length) {
      resultTokens.push(leftTokens[i])
      i += 1
    }

    while (j < rightTokens.length) {
      resultTokens.push(rightTokens[j])
      j += 1
    }

    const filename = hash(`${left}_${right}`)

    const file = await fs.open(path.join(this.storagePath, filename), 'w')
    await file.writeFile(resultTokens.map(x => x.toString()).join('\n') + '\n')
    await file.close()

    return filename
  }

  private async mergeChunks(chunks: Array<string>): Promise<string> {
    if (chunks.length == 1) {
      return chunks[0]
    }

    // TODO: optimize
    const junk = chunks
    while (chunks.length > 1) {
      const newChunks = []
      for (let i = 0; i < chunks.length - 1; i += 2) {
        const filename = await this.mergeTwoChunks(chunks[i], chunks[i + 1])
        newChunks.push(filename)
        if (chunks.length > 2) {
          junk.push(filename)
        }
      }
      if (chunks.length % 2 != 0) {
        newChunks.push(chunks[chunks.length - 1])
      }
      chunks = newChunks
    }
    await Promise.all(junk.map(x => fs.unlink(path.join(this.storagePath, x))))
    return chunks[0]
  }

  private async optimize(finalFilename: string) {
    const map = new TokenMapPair(this.indexMapFilePath, this.indexDataFilePath)
    await map.open()
    await map.clean()

    await mapEachLine<void>(path.join(this.storagePath, finalFilename), async line => {
      const values = line.split(',')
      const token = values[0]
      const docs = values.slice(1)

      await map.push(token, docs)
    })

    await map.close()
  }
}

export function getIndex(type: string) {
  return new Index(type)
}
