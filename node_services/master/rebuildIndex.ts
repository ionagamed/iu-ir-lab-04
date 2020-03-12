import axios from 'axios'
import { FastifyInstance } from 'fastify'
import { allIndexerAddresses } from '../common/fabric'
import { Mode } from '../state'

export async function rebuildIndex(indexType: string) {
  const promises = allIndexerAddresses.map(
    x => axios.post(`${x}/rebuildIndex?type=${indexType}`, {})
  )
  await Promise.all(promises)
}

export async function rebuildIndexPlugin(fastify: FastifyInstance, _opts: any) {
  fastify.post('/rebuildIndex', async (request, reply) => {
    const indexType = request.query['type']
    await fastify.state.update({ mode: Mode.LOADING_PRIMARY_INDEX })
    await rebuildIndex(indexType)
    reply.send({ status: 'ok' })
  })
}
