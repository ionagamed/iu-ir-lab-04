import { FastifyInstance } from 'fastify'
import { getIndex } from './indexes'

export async function rebuildIndexPlugin(fastify: FastifyInstance, _opts: any) {
  fastify.post('/rebuildIndex', async (request, reply) => {
    const indexType = request.query['type']
    await getIndex(indexType).rebuild()
    reply.send({ status: 'ok' })
  })
}
