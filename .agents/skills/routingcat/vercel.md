# RoutingCat on Vercel

This site deploys on Vercel. What RoutingCat needs from Vercel, and what Vercel changes about it:
- **The project is bound to the site.** `init` binds the site to the folder's Vercel project, which needs the folder linked and the Vercel CLI signed in: `npx vercel link`, and `npx vercel login`, which needs the person. A site moved here with `init --host vercel` is bound the same way, in place of its old host.
- **Builds prove themselves with Vercel's own token,** so there is no secret to set. It needs the project's Settings → Security → Secure backend access with OIDC federation turned on. Without it, a build ships but registers nothing, and its log says so (D5).
- **Preview deployments** register new versions and change nothing live. Their events stay out of results, which count production only.
- **Caches:** a page rendered for one visitor must never be kept by a shared cache, or every visitor would see that visitor's variants.
  - RoutingCat takes the shared-cache directives, such as `s-maxage` or `Vercel-CDN-Cache-Control`, off a response it rendered for a decision. Static pages take each visitor's variants another way, and cache as before.
  - A cache in front of Vercel that serves routed pages' HTML, such as Cloudflare's Cache Everything rule, skips RoutingCat altogether (D16): stop caching routed pages' HTML there. `doctor` checks `cf-cache-status`, and warns when a routed page comes from a shared cache.
- **A `vercel.json` header transform** can strip `Server-Timing`, which carries the decision to the page: leave it on routed pages.
- **A site behind Cloudflare** turns on its visitor location headers: the domain → Rules → Settings → Managed Transforms → "Add visitor location headers" (D57).
