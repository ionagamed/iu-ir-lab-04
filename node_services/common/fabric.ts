export const workerAddress = process.env.WORKER_ADDRESS || 'http://localhost:8080'
export const secondaryAddress = process.env.SECONDARY_ADDRESS || 'http://localhost:8081'
export const tokenizerAddresses = (process.env.TOKENIZER_ADDRESSES || 'http://localhost:4000').split(',')

export const tokenSplits = [
  { begin: 'a'.charCodeAt(0), end: 'm'.charCodeAt(0) },
  { begin: 'n'.charCodeAt(0), end: 'z'.charCodeAt(0) }
]

const indexerAddressesString = process.env.INDEXER_ADDRESSES || 'http://localhost:4101,http://localhost:4102'
export const allIndexerAddresses = indexerAddressesString.split(',')

export function getIndexerAddressFor(token: String): String {
  for (let i = 0; i < tokenSplits.length; i++) {
    const { begin, end } = tokenSplits[i]
    if (token.charCodeAt(0) >= begin && token.charCodeAt(0) <= end) {
      return allIndexerAddresses[i]
    }
  }
  return null
}

export const masterAddress = process.env.MASTER_ADDRESS || 'http://localhost:5000'
export const storageAddress = process.env.STORAGE_ADDRESS || 'http://localhost:6000'
