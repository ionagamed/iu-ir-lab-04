import { promises as fs } from 'fs'
import { getLocalPath } from './storage';

export class PersistentObject<T> {
  constructor (
    name: string,
    defaultValue: T,
    private filename = getLocalPath(name)
  ) {
    fs.access(filename).catch(_ => this.set(defaultValue))
  }

  async get(): Promise<T> {
    return JSON.parse((await fs.readFile(this.filename)).toString())
  }

  async set(value: T) {
    const data = JSON.stringify(value)
    await fs.writeFile(this.filename, data)
  }

  async update(mixin: Partial<T>) {
    const data = {
      ...await this.get(),
      ...mixin
    }
    await this.set(data)
  }
}
