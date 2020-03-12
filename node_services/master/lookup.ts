import axios from 'axios'
import { FastifyInstance } from 'fastify'
import { allIndexerAddresses, getIndexerAddressFor, secondaryAddress } from '../common/fabric'
import { Mode } from '../state'

interface WordQuery {
  type: 'word',
  args: string
}

interface CombinedQuery {
  type: 'and' | 'or',
  args: Query[]
}

type Query = WordQuery | CombinedQuery

function intersectionOf(l1: string[], l2: string[]) {
  const s1 = new Set(l1)
  return l2.filter(x => s1.has(x))
}

function unionOf(l1: string[], l2: string[]) {
  const s2 = new Set(l2)
  return l2.concat(l1.filter(x => !s2.has(x)))
}

function fetchWords(query: Query): Record<string, Promise<string[]>> {
  if (query.type == 'word') {
    return { [query.args]: lookupWord(query.args) }
  } else {
    return query.args.map(fetchWords).reduce((x, y) => Object.assign({}, x, y), {})
  }
}

async function lookupWord(query: string) {
  try {
    const results1 = (await axios.get(`${getIndexerAddressFor(query)}/lookup?query=${query}&type=primary`)).data
    const results2 = (await axios.get(`${getIndexerAddressFor(query)}/lookup?query=${query}&type=auxiliary`)).data
    return unionOf(results1, results2)
  } catch (ignored) {
    return []
  }
}

async function awaitProps<U>(obj: Record<string, Promise<U>>): Promise<Record<string, U>> {
  const output = {}
  const promises = []
  for (const key in obj) {
    promises.push(obj[key].then(x => output[key] = x))
  }
  await Promise.all(promises)
  return output
}

function merge(query: Query, mapping: Record<string, string[]>): string[] {
  switch (query.type) {
    case 'word':
      return mapping[query.args]
    case 'and':
      const results = query.args.map(x => merge(x, mapping))
      return results.reduce(intersectionOf, results[0])
    case 'or':
      return query.args.map(x => merge(x, mapping)).reduce(unionOf, [])
  }
}

async function lookup(query: string): Promise<string[]> {
  const { data: parsedQuery } = await axios.post(
    `${secondaryAddress}/parseQuery`,
    { query }
  )
  const wordMap = await awaitProps(fetchWords(parsedQuery.result))
  return Array.from(new Set(merge(parsedQuery.result, wordMap)))
}

export async function lookupPlugin(fastify: FastifyInstance, _opts: any) {
  fastify.get('/lookup', async (request, reply) => {
    if ((await fastify.state.get()).mode != Mode.OPERATIONAL) {
      reply.status(400)
      reply.send()
      return
    }

    const result = await lookup(request.query["query"])
    reply.send(result)
  })
}
