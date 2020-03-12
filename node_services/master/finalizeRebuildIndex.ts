import axios from 'axios'
import { FastifyInstance } from 'fastify'
import { allIndexerAddresses } from '../common/fabric'
import { Mode } from '../state'

async function finalizeRebuildIndex(indexType: string) {
  const promises = allIndexerAddresses.map(
    x => axios.post(`${x}/finalizeRebuildIndex?type=${indexType}`, {})
  )
  await Promise.all(promises)
}

export async function finalizeRebuildIndexPlugin(fastify: FastifyInstance, _ops: any) {
  fastify.post('/finalizeRebuildIndex', async (_request, reply) => {
    const { mode } = await fastify.state.get()
    const indexType = {
      [Mode.LOADING_PRIMARY_INDEX]: 'primary',
      [Mode.OPERATIONAL]: 'auxiliary'
    }[mode]
    await fastify.state.update({ mode: Mode.OPERATIONAL })
    await finalizeRebuildIndex(indexType)
    reply.send({ status: 'ok' })
  })
}
