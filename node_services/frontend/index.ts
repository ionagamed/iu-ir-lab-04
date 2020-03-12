import axios from 'axios'
import * as Fastify from 'fastify'
import * as PointOfView from 'point-of-view'
import * as handlebars from 'handlebars'
import { masterAddress, storageAddress } from '../common/fabric'

const fastify = Fastify({ logger: true })
fastify.register(PointOfView, { engine: { handlebars } })

fastify.get('/preview/:path', async (request, reply) => {
  const path = request.params['path']
  const { data } = await axios.get(`${storageAddress}/${encodeURIComponent(path)}`)
  return reply.view('frontend/templates/preview.html', { html: data.contents, title: path })
})

fastify.get('/', async (request, reply) => {
  const query = request.query['query']
  const context = { query, showResults: false, results: [] }
  if (query) {
    const { data } = await axios.get(`${masterAddress}/lookup?query=${query}`)
    context.showResults = true
    context.results = data.map((x: string) => ({
      text: x,
      link: `/preview/${encodeURIComponent(x)}`
    }))
  }

  reply.view('frontend/templates/index.html', context)
})


fastify.listen(7000)
