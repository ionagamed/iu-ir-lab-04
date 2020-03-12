import { FastifyInstance } from 'fastify'
import { getIndex } from './indexes'

function intersectionOf(l1: string[], l2: string[]) {
  const s1 = new Set(l1)
  return l2.filter(x => s1.has(x))
}

export async function lookupPlugin(fastify: FastifyInstance, _opts: any) {
  fastify.get('/lookup', async (request, reply) => {
    const query = request.query['query']
    const indexType = request.query['type']

    let results = []
    if (indexType == 'auxiliary') {
      const { nextAux } = await fastify.indexerState.get()

      let results = []
      for (let i = 0; i < nextAux; i++) {
        results = intersectionOf(results, await getIndex('aux_' + i).lookup(query))
      }
    } else {
      results = await getIndex('primary').lookup(query)
    }

    reply.send(results)
  })
}
