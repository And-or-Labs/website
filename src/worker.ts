import build from 'virtual:routingcat/values'
import { cf, finalize } from '@astrojs/cloudflare/fetch'
import { astro, FetchState } from 'astro/fetch'
import { ASTRO_DESCRIPTOR, type WorkerContext, worker } from 'routingcat/cloudflare'

const app = {
  async fetch(request: Request, env: unknown, ctx: WorkerContext) {
    const state = new FetchState(request)
    const asset = await cf(state, env, ctx)
    if (asset) return asset
    return finalize(state, await astro(state))
  },
}

export default worker(app, {
  mode: 'wrap',
  framework: ASTRO_DESCRIPTOR,
  // The same literal as run_worker_first in the Wrangler configuration.
  matcher: ['/*', '!/_astro/*'],
  build,
})
