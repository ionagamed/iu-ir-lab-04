import * as Fastify from 'fastify'
import { heathcheckPlugin } from '../common/healthcheck'
import { storeTokenPlugin } from './storeToken'
import { rebuildIndexPlugin } from './rebuildIndex'
import { finalizeRebuildIndexPlugin } from './finalizeRebuildIndex'
import { lookupPlugin } from './lookup'
import { PersistentObject } from '../common/persistence'
import { indexerState } from './state'

const fastify = Fastify({ logger: { level: 'warn' } })

fastify.decorate('indexerState', new PersistentObject<typeof indexerState>('indexerState', indexerState))

fastify.register(storeTokenPlugin)
fastify.register(rebuildIndexPlugin)
fastify.register(finalizeRebuildIndexPlugin)
fastify.register(lookupPlugin)
fastify.register(heathcheckPlugin)
fastify.listen(+process.env.PORT || 4000)
