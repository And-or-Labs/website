import build from 'virtual:routingcat/values'
import { cf, finalize } from '@astrojs/cloudflare/fetch'
import { astro, FetchState } from 'astro/fetch'
import { ASTRO_DESCRIPTOR, type WorkerContext, worker } from 'routingcat/cloudflare'

const app = {
  async fetch(request: Request, env: unknown, ctx: WorkerContext) {
    const state = new FetchState(request)
    const asset = await cf(state, env, ctx)
    if (asset) return asset
    // Under `astro dev`, FetchState resolves routes with app.match(), which
    // skips prerendered pages, so every page answered 404 locally. The
    // adapter's default handler resolves with devMatch instead. Build-time
    // constant, so this never reaches production.
    if (import.meta.env.DEV) {
      const { handle } = await import('@astrojs/cloudflare/handler')
      return handle(request, env as never, ctx as never)
    }
    return finalize(state, await astro(state))
  },
}

export default worker(app, {
  mode: 'wrap',
  framework: ASTRO_DESCRIPTOR,
  // The same literal as run_worker_first in the Wrangler configuration:
  // every path except built assets and the legacy redirects in public/_redirects.
  matcher: ['/*', '!/_astro/*', '!/tools', '!/tools/*', '!/admin', '!/admin/*', '!/work', '!/work/*', '!/blog', '!/notes/rss.xml', '!/blog/*', '!/about', '!/contact', '!/faq', '!/pricing', '!/login', '!/signup', '!/privacy', '!/lab', '!/lab/', '!/experiments', '!/experiments/', '!/published', '!/published/', '!/gtm', '!/gtm/'],
  build,
})
