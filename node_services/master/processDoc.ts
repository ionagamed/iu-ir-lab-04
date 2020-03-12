import axios from 'axios'
import { FastifyInstance } from 'fastify'
import { tokenizerAddresses } from '../common/fabric'
import { Mode } from '../state'

async function processDoc(text: string, docId: string, mode: Mode) {
  const indexType = {
    [Mode.LOADING_PRIMARY_INDEX]: 'primary',
    [Mode.OPERATIONAL]: 'auxiliary'
  }[mode]
  const tokenizerIdx = Math.floor(Math.random() * tokenizerAddresses.length)
  const tokenizerAddress = tokenizerAddresses[tokenizerIdx]

  const url = `${tokenizerAddress}/processDoc`
  await axios.post(url, { text, docId, indexType })
}

export async function processDocPlugin(fastify: FastifyInstance, _opts: any) {
  fastify.post('/processDoc', async (request, reply) => {
    try {
      const { mode } = await fastify.state.get()
      if (mode == Mode.WAIT) {
        throw new Error('Cluster is in WAIT state')
      }

      await processDoc(request.body.text, request.body.docId, mode)
      reply.send({ status: 'ok' })
    } catch (e) {
      fastify.log.error(e.message)
      reply.send({ status: 'error', message: e.message })
    }
  })
}
