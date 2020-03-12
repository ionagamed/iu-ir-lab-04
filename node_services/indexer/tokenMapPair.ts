import { promises as fs } from 'fs'
import { TokenMap } from "./tokenMap";

export class TokenMapPair {
  dataFile: fs.FileHandle

  constructor (
    mapPath: string,
    private dataPath: string,

    private map = new TokenMap(mapPath),
    private dataOffset = 1
  ) {}

  async open() {
    await this.map.open()
    this.dataFile = await fs.open(this.dataPath, 'a+')
  }

  async clean() {
    await this.map.clean()
    await this.dataFile.truncate(0)
    await this.dataFile.write(Buffer.from([0xAD]))
    this.dataOffset = 1
  }

  async push(key: string, values: string[]) {
    const joinedValues = values.join(',')
    const myOffset = this.dataOffset
    this.dataOffset += 4 + joinedValues.length
    await this.map.push(key, myOffset)

    const data = Buffer.alloc(4 + joinedValues.length)
    data.writeInt32BE(joinedValues.length, 0)
    data.write(joinedValues, 4)

    await this.dataFile.write(data, 0, data.length, myOffset)
  }

  async get(key: string) {
    const offset = await this.map.get(key)

    const lengthBuffer = Buffer.alloc(4)
    await this.dataFile.read(lengthBuffer, 0, 4, offset)
    const length = lengthBuffer.readInt32BE(0)
    const dataBuffer = Buffer.alloc(length)
    await this.dataFile.read(dataBuffer, 0, length, 4 + offset)

    const data = dataBuffer.toString()

    return data.split(',')
  }

  async close() {
    await this.map.close()
    await this.dataFile.close()
  }
}
