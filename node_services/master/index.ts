import * as Fastify from 'fastify'
import { state, Mode } from '../state'
import { rebuildIndexPlugin, rebuildIndex } from './rebuildIndex'
import { processDocPlugin } from './processDoc'
import { finalizeRebuildIndexPlugin } from './finalizeRebuildIndex'
import { lookupPlugin } from './lookup'
import { wait } from './wait'
import { PersistentObject } from '../common/persistence'

const fastify = Fastify({ logger: true })

fastify.decorate(
  'state',
  new PersistentObject<typeof state>('state', state)
)

fastify.register(finalizeRebuildIndexPlugin)
fastify.register(rebuildIndexPlugin)
fastify.register(processDocPlugin)
fastify.register(lookupPlugin)

fastify.get('/state', async (_request, reply) => {
  reply.send({ state: await fastify.state.get() })
})

;(async () => {
  await wait()

  if ((await fastify.state.get()).mode == Mode.WAIT) {
    await rebuildIndex('primary')
    await fastify.state.update({ mode: Mode.LOADING_PRIMARY_INDEX })
  }

  fastify.listen(+process.env.PORT || 5000)
})()
