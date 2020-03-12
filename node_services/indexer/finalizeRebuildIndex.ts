import { FastifyInstance } from 'fastify'
import { getIndex } from './indexes'

export async function finalizeRebuildIndexPlugin(fastify: FastifyInstance, _opts: any) {
  fastify.post('/finalizeRebuildIndex', async (request, reply) => {
    let indexType = request.query['type']
    const { nextAux } = await fastify.indexerState.get()

    if (indexType == 'auxiliary') {
      indexType = 'aux_' + nextAux
    }

    await getIndex(indexType).finalizeRebuild()
    await fastify.indexerState.update({ nextAux: nextAux + 1 })
    reply.send({ status: 'ok' })
  })
}
