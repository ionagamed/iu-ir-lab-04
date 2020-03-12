import { FastifyInstance } from "fastify";

export async function heathcheckPlugin(fastify: FastifyInstance) {
  fastify.get('/', async (_request, reply) => {
    reply.send({ status: 'ok' })
  })
}
