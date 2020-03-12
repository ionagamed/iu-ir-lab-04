import * as Fastify from 'fastify'
import { heathcheckPlugin } from '../common/healthcheck'
import { processDocPlugin } from './processDoc'

const fastify = Fastify({ logger: true })

fastify.register(processDocPlugin)
fastify.register(heathcheckPlugin)
fastify.listen(+process.env.PORT || 4000)
