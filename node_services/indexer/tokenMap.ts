import { promises as fs } from 'fs'

export class TokenMap {
  file: fs.FileHandle

  constructor (
    private path: string
  ) {}

  async open() {
    this.file = await fs.open(this.path, 'a+')
  }

  async clean() {
    await this.file.truncate()
  }

  async push(key: string, value: number) {
    const data = Buffer.alloc(68)
    data.write(key)
    data.writeInt32BE(value, 64)
    await this.file.write(data)
  }

  async get(key: string) {
    let l = -1
    let r = (await this.file.stat()).size / 68
    const buf = Buffer.alloc(68)
    while (l + 1 < r) {
      const m = Math.floor((l + r) / 2)
      await this.file.read(buf, 0, 64, 68 * m)
      const s = buf.toString()
      if (s < key) {
        l = m
      } else {
        r = m
      }
    }
    await this.file.read(buf, 0, 68, 68 * r)
    const s = buf.toString('utf-8', 0, 64).replace(/\0/g, '')
    console.log(s)
    if (s !== key) {
      throw new Error('Key not found')
    }
    return buf.readInt32BE(64)
  }

  async close() {
    await this.file.close()
  }
}
