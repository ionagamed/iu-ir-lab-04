import axios from 'axios'
import { allIndexerAddresses, tokenizerAddresses } from '../common/fabric'

async function isOk(address: string) {
  try {
    const response = await axios.get(address)
    return response.status == 200
  } catch (e) {
    return false
  }
}

export async function wait() {
  return new Promise((resolve, _reject) => {
    const interval = setInterval(async () => {
      const okIndexers = (await Promise.all(allIndexerAddresses.map(isOk))).every(x => x)
      const okTokenizers = (await Promise.all(tokenizerAddresses.map(isOk))).every(x => x)
      if (okIndexers && okTokenizers) {
        clearInterval(interval)
        resolve()
      }
    }, 1000)
  })
}
