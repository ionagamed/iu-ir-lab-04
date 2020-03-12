import { state } from '../../state'
import { PersistentObject } from '../../common/persistence'
import { indexerState } from '../../indexer/state'

declare module 'fastify' {
  export interface FastifyInstance {
    state: PersistentObject<typeof state>
    indexerState: PersistentObject<typeof indexerState>
  }
}
