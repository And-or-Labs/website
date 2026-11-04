# RoutingCat on Astro

This site runs RoutingCat on Astro 7.3.1 or later, on Vercel, with Vercel's adapter or none, or on Cloudflare Workers, and matches the pages' routes from the site's root. `init` stops below Astro 7.3.1, and on Workers without Astro's Cloudflare adapter, which builds the custom entrypoint RoutingCat's Worker wraps. `SKILL.md` holds what every site shares; this file holds the code. The docs' Astro copy is in `node_modules/routingcat/docs/astro/`, and paths below are relative to it. The host's file is `vercel.md` on Vercel and `cloudflare.md` on Cloudflare.

## What `init` set up

- **`routingcat()` from `routingcat/astro`** in the Astro config's `integrations`. Each `astro build` registers what `routingcat/` and `routingcat.config.ts` declare. Its middleware, which runs before the site's own, hands each page rendered at each request its visitor's decision.
- **`<RoutingCat />` from `routingcat/astro/components`,** first in the layout's `<head>`, after the charset and viewport tags. It writes the head snippet inline, which shows each visitor's variants before the page paints, then the tracker, which reports what the browser showed. Where several files hold `<head>`, or the `<head>` opens with a component, `init` prints the edit instead (D32).
- **What decides each visit before the page answers,** and answers `/_rc`:
  - **on Vercel,** a root `middleware.ts`: `middleware(…)` from `routingcat/vercel`, on Node.js (`runtime: 'nodejs'`), with RoutingCat's entries in `config.matcher`, composed with the site's own `middleware.ts` where it had one. It imports the build from `.routingcat/values.mjs`, which each build writes, and whose types the package ships.
  - **on Workers,** `src/worker.ts`: Astro's custom entrypoint inside `worker(…)` from `routingcat/cloudflare`, its build from `virtual:routingcat/values`; and in the Wrangler configuration, `main`, `run_worker_first`, which lists the same paths as the Worker's matcher, and the `CF_VERSION_METADATA` binding. A custom entrypoint of the site's own stays `main`, and `init` prints the wrap to make around it.
- **`.routingcat/`,** where each build writes RoutingCat's credential and values, kept out of the repository by `.gitignore`.
- **`routingcat.config.ts`,** or `.mjs` in a project without TypeScript, its `config` imported from `routingcat/astro`. On Workers it also names the production address, as `origin`, from `--origin`, Wrangler's routes or `site` in the Astro config; with none, `init` asks at a terminal and stops an agent (D88), which runs it again with `--origin https://<the domain>` once the person names it (`cloudflare.md`).

When a change drops one of them, `npx routingcat init` restores it, or prints the edit.

## Declare a page

One file per routed page, in `routingcat/`, with `page`, `slot` and `variant` from `routingcat/astro`:

<!-- source: examples/astro-site/routingcat/home.ts -->
```ts
// routingcat/home.ts
import { page, slot, variant } from 'routingcat/astro'

export const home = page('home', {
  routes: ['/'],
  slots: {
    hero: slot({
      default: 'current',
      variants: {
        current: variant({ fields: { headline: 'Route every visitor to what converts' } }),
        learns: variant({ fields: { headline: 'Your pages learn what converts each visitor' } }),
        // …
```

- **A variant is made of fields:** plain values, such as text or numbers, which the page renders, and images: one imported from the repository is kept by its bytes, one given by URL by its URL. A variant declared as a component renders nothing, with a warning in development.
- **A version is a change to declared content,** a field's value or an image it references. The pages' markup, shared code and content fetched at run time make none, so keep what is tested in the fields.
- **Routes** are the pages' paths, with a dynamic segment in brackets, as Astro's file names write it: `/pricing`, `/blog/[slug]`. A path belongs to one page.
- **Each new variant also takes a `description`,** saying what it tries. `reference/declarations.md` has every option.

## Render it

Each slot renders in a `<RoutingCatSlot>`, from `routingcat/astro/components`. The home page, `src/pages/index.astro`:

<!-- source: examples/astro-site/src/pages/index.astro -->
```astro
---
// `/`, prerendered: every variant in the page, the head snippet showing the host's selection.
import { RoutingCatSlot } from 'routingcat/astro/components'
import { home } from '../../routingcat/home'
import Base from '../layouts/Base.astro'
---
<Base title="RoutingCat">
  <main>
    <RoutingCatSlot page={home} name="hero">
      {(fields: { headline: string }) => <h1>{fields.headline}</h1>}
    </RoutingCatSlot>
    <!-- … -->
```

- **Its props:** `page` takes the page's declaration, and `name` the slot's key, which the typecheck holds to the page's slots; never `slot`, which Astro reads as a layout's named slot. Its child is a function that receives the variant's fields, then its key, and returns what to show. `tag="span"` renders a slot inside a sentence, since a `div` would close the open `<p>`. `class` and `id` go on the slot's element; style the elements inside it.
- **A prerendered page,** Astro's default, carries every variant: the default shown, the others hidden, the same HTML for every visitor, which the host can cache. RoutingCat decides before the host serves the page, and `<RoutingCat />` shows the visitor's variants before it paints. Whether a page is prerendered is Astro's own reading: the page's `export const prerender`, else the config's `output`.
- **A page rendered at each request,** as `export const prerender = false` makes one, takes the same component, which renders the visitor's variants alone, from the decision RoutingCat's middleware hands it. Its HTML is one visitor's, so the integration takes `s-maxage` and the CDN cache headers off its response, and turns Astro's route cache off for that render.
- **On Vercel, a page rendered on demand but kept for every visitor,** by the adapter's `isr` or by a route rule of Astro's route cache, carries every variant instead, as a prerendered page does.
- **Server islands:** a slot in an island shows the visitor's variant only once the island renders, after the page's shell, on either kind of page, so keep slots above the fold out of islands.
- **Every page renders through a layout whose `<head>` holds `<RoutingCat />`.** A page without it sends no render beacon, and if it carries every variant, it shows its defaults to every visitor. With Astro's client router, `<ClientRouter />`, each next page is decided as the router fetches it, and its variants show as the router swaps it in.
- **Where the selection is read:** on a page rendered at each request, RoutingCat's middleware hands the visitor's decision to `<RoutingCatSlot>`, which renders it, and `Astro.locals.routingcat.shown(page)` tells server code which variant each slot shows, null on a page that carries every variant; on a page that carries every variant, the head snippet shows the visitor's variants in the browser.
- **On a page that carries every variant, the hidden ones are in its HTML too:** no `id` used elsewhere on the page; at most one `h1`, in a slot that holds the page's heading; no script that runs, no stylesheet and no structured data; forms and widgets only where they work once shown; nothing that differs by visitor. Give the images of every variant of a slot the same `loading`, so that none loads faster than another.
- **Place each slot where its markup is allowed:** inside a table cell or a list item, or around the whole list, never directly inside a table, a list or a `<select>`. Slots don't nest, and `<head>` content can't be a slot. A CSS rule that sets `display` on the slot's own elements shows hidden variants: style the elements inside them.
- **A slot is routed on its own page's routes only.** RoutingCat decides one page per request, so a slot of another page, as in a layout every page shares, shows its default there.

`guides/build-a-page.md` has both kinds of page in full.

## Look at every variant

In `astro dev`: `?rc=hero:learns` shows a variant, `?rc=home/hero:learns,subhead:short` several, and `?rc=off` the defaults. The choice lasts for the browser session. The development server reads the declarations when it starts: restart it after adding a page, a slot or a variant. With Astro's Cloudflare adapter, `astro dev` runs the Worker, which shows the forced variants; with any other adapter, RoutingCat's development handler does. Development records nothing, and deployed builds ignore `?rc=`.

In production, `npx routingcat preview home/hero:learns` prints a signed link, valid for one hour, that shows the variant without counting in results, with a badge naming each slot's variant, whose link ends the preview.

## Ship

`astro build` registers through the integration:
- **On Vercel,** with Vercel's own token (`vercel.md`). The build registers before Astro prerenders the pages, so a build that fails while prerendering has registered already: visitors keep the previous version, and `status` says so (D10). Fix the build and deploy again, or revert the page.
- **On Workers,** with `ROUTINGCAT_DEPLOY_KEY` in the build's variables, which the site's owner mints in their own terminal with `npx routingcat keys deploy --branch <production branch>`; `wrangler deploy` then deploys the Worker. That key registers production only for builds of its branch, as Cloudflare's builds or GitHub Actions report the branch, and from the person's terminal, `ROUTINGCAT_ENV=production npx astro build && npx wrangler deploy` registers production under their sign-in once they confirm its plan, as `cloudflare.md` says; without the variable, and with no deploy key or `ROUTINGCAT_BRANCH` in the shell, the build writes development values, registers nothing, and its log says so (D46). Builds of other branches take the preview key, from `npx routingcat keys deploy --env preview`. The build waits up to a minute for routing data that holds its own changes, which the Worker embeds, so that a new page routes from the deployment's first request.

Check a change with the project's typecheck, lint and tests, and a local `astro build`, which registers nothing without `ROUTINGCAT_ENV=production`.

## Track conversions

- **On the server,** in an endpoint or a page rendered at each request: `Astro.locals.routingcat`, `locals.routingcat` in an endpoint.
  - **`await Astro.locals.routingcat.identify(accountId)`** where the account is created, and where the site first renders for the signed-in user, at every sign-in.
  - ``Astro.locals.routingcat.track('signup', { id: `signup:${user.id}` })`` reports the event, without `await`.
  - **A prerendered page's server code sends nothing:** it renders once, at build, and says so in the build's log. Track from an endpoint, a page with `export const prerender = false`, or the page's `<script>`.
- **In the browser,** a page's `<script>` imports `routingcat` from `routingcat/tracker`: `track`, `identify` and `link`. The page must carry `<RoutingCat />`, whose script gives them the site's public key; without it they send nothing and warn in the console.
- **The calls never throw,** and never delay the response. In development they log, record nothing, and say so.

| Situation | What to add | Recipe |
|---|---|---|
| The site creates its own account record | Where it creates it: `await Astro.locals.routingcat.identify(user.id)`, then the `signup` track. Identify again at every sign-in. | `guides/tracking.md` |
| Clerk, or another provider | Where the docs' auth page puts it. | `guides/auth.md` |
| A conversion with no account, such as a waitlist | `track` alone, in an endpoint, with an `id` derived from a hash of the address, so one address counts once. | `guides/tracking.md` |
| PostHog | Wherever the site loads `posthog-js` from npm, as a script the layout loads: `before_send: routingcatProperties`, imported from `routingcat/tracker`, in PostHog's `init`, last in an array if it already has hooks. PostHog loaded from its HTML snippet can't import it: offer to move it to `posthog-js` from npm. | `guides/posthog.md` |
| Stripe | Not covered yet on Astro: leave its payments and trials untracked, as `setup.md` says. | |
| Whop | The owner runs `npx routingcat connect whop` once: no webhook code. An endpoint creates each checkout configuration through Whop's API, with `metadata: { rc_vid }` from `cookies.get('rc_vid')?.value` and `rc_return=whop` on `redirect_url`, never a plain plan link. | `guides/whop.md` |
| Another backend, or a webhook | The HTTP events API, with the server events key; or an endpoint that receives the webhook, passing the `visitorId` the third party carried. | `guides/tracking.md`, `reference/events-api.md` |
| An app on a subdomain | The same recipes: the `rc_vid` cookie is shared across the registrable domain. | `guides/tracking.md` |
| Another registrable domain | `routingcat.link(url)` from `routingcat/tracker` in a page's `<script>`; `data-collector` on the other domain's browser entry; `npx routingcat domains add`. | `guides/tracking.md` |
| A form with no backend | On submit, in the page's `<script>`: `routingcat.track(name, { id })`, the hex SHA-256 of the trimmed, lowercased email in the `id`; alone where the site has accounts of its own, whose record ids `identify` keeps, or after `routingcat.identify()` with that hash where it has none. | `guides/tracking.md` |

Copy the recipes' code from the docs: it is the example apps' tested code.
## When something fails

**`init` stops before changing anything** when it finds:
- Astro not installed (D99), or below 7.3.1 (D100): install the site's packages; the upgrade is `npx @astrojs/upgrade`;
- on Workers, no Cloudflare adapter (D101): `npx astro add cloudflare`;
- no host the folder names, or both (D74, exit 2): run it again with `--host vercel` or `--host cloudflare-workers`;
- on Workers, Wrangler signed out or reaching several accounts (D79): the person runs `npx wrangler login`, or set `account_id` in the Wrangler configuration; and Workers Cache on (D80): remove its `cache` setting;
- no project it recognizes (D51): run it in the site's folder, beside its Astro config.

An upgrade changes the person's app beyond RoutingCat, so treat it as you would any such change, then run `init` again.

**Astro's own failures:**
- **RoutingCat didn't run on a page (D82), or a deployment never registered (D83):** on Vercel, `middleware.ts` exports `middleware(…)` from `routingcat/vercel`, keeps RoutingCat's matcher entries and declares `runtime: 'nodejs'` (D85); on Workers, Wrangler's `main` exports `worker(…)` from `routingcat/cloudflare`, `run_worker_first` keeps RoutingCat's patterns, and the `CF_VERSION_METADATA` binding stays, without which each isolate registers on its own (D86).
- **Pages rendered at each request showing their defaults on Vercel (D117):** the adapter deploys Astro's middleware at the edge, past RoutingCat's. Remove `middlewareMode` from `vercel()` in the Astro config, or set it to `'classic'`, remove `edgeMiddleware: true` if the config has it, then deploy. The build passes meanwhile, and prerendered pages are routed.
- **Decisions without render beacons (D13), or a page carrying every variant without the head snippet (D89):** render the page through a layout whose `<head>` holds `<RoutingCat />`. In the person's own browser, an ad blocker also stops beacons.
- **A routed page's answer without its `rc` entry (D89):** a header rule or a proxy in front removed `Server-Timing`, which carries the visitor's variants: keep it on the pages.
- **A Content Security Policy that blocks the snippet or its styles (D92):** allow what the message names; where the policy allows scripts by nonce, give the layout's component the page's nonce, `<RoutingCat nonce={nonce} />`, which its style rules carry too.
- **Every page showing its defaults, with an adapter other than Vercel's or Cloudflare's (D127):** nothing of RoutingCat's runs before the pages on that adapter's host. The build warns and passes. Moving the site to Vercel or Cloudflare Workers is the person's call; then run `init` again.
- **Every page showing its defaults, under a base path (D126):** a `base` in the Astro config serves the pages where RoutingCat's routes, from the site's root, match none. The build warns and passes. Serving the site from `/` is the person's call.
- **A slot or a variant that renders nothing:** the slot's key names no slot the page declares, or the variant is declared as a component; development warns of both. Correct the key, or declare the variant's content as fields.
- **`astro check` failing on `.routingcat/values.mjs`:** a declaration of it an older `init` wrote, in `routingcat.d.ts`, clashes with the one the package ships. Remove it, as `npx routingcat init` prints.
