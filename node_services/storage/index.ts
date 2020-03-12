import { promises as fs } from 'fs'
import * as path from 'path'
import * as Fastify from 'fastify'

const fastify = Fastify({ logger: true })

const storagePath = process.env.STORAGE_PATH

function getLocalPath(sourcePath: string): string {
  return path.join(storagePath, encodeURIComponent(sourcePath))
}

fastify.get('/:path', async (request, reply) => {
  const path = request.params['path']
  const contents = (await fs.readFile(getLocalPath(path))).toString()
  reply.send({ contents })
})

fastify.post('/:path', async (request, reply) => {
  const path = request.params['path']
  const contents = request.body['contents']
  await fs.writeFile(getLocalPath(path), contents)
  reply.send({ status: 'ok' })
})

fs.mkdir(storagePath, { recursive: true }).then(() => fastify.listen(6000))
