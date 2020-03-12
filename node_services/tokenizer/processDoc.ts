import axios from 'axios'
import { workerAddress, getIndexerAddressFor, secondaryAddress } from '../common/fabric'
import { FastifyInstance } from 'fastify'

async function processDoc(text: string, docId: string, indexType: string) {
  const response = await axios.post(`${workerAddress}/tokenize`, { text })
  const tokens: Array<string> = response.data.tokens

  const promises = [
    ...tokens.map(
      token => axios.post(
        `${getIndexerAddressFor(token)}/storeToken?type=${indexType}`,
        { token, docId }
      )
    ),
    axios.post(`${secondaryAddress}/storeTokens`, { tokens })
  ]

  await Promise.all(promises)
}

export async function processDocPlugin(fastify: FastifyInstance, _opts: any) {
  fastify.post('/processDoc', async (request, reply) => {
    await processDoc(request.body.text, request.body.docId, request.body.indexType)
    reply.send({ status: 'ok' })
  })
}
