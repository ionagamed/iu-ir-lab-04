import { FastifyInstance } from 'fastify'
import { getIndex } from './indexes'

export async function storeTokenPlugin(fastify: FastifyInstance, _opts: any) {
  fastify.post('/storeToken', async (request, reply) => {
    let indexType = request.query['type']

    if (indexType == 'auxiliary') {
      indexType = 'aux_' + (await fastify.indexerState.get()).nextAux
    }

    await getIndex(indexType).storeToken(request.body.token, request.body.docId)
    reply.send({ status: 'ok' })
  })
}
