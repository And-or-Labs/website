# RoutingCat on a template site

This site's templates carry RoutingCat's slots, and its host decides each visit before the page leaves it: Vercel's middleware, or a Cloudflare Worker. A static generator, such as Hugo, Jekyll, Eleventy or Nuxt 2, or a server, such as Laravel, Rails, Django, WordPress or PHP, builds the pages. `SKILL.md` holds what every site shares; this file holds the code, and the host's file, `vercel.md` or `cloudflare.md`, the host's. The docs' copy for this site is the `html` one: `npx routingcat docs <page>` prints a page of it. Paths below are relative to it.

## What `init` set up

- **`routingcat.config.json`:** the site, its public key, the integration, `vercel` or `cloudflare`, the files its slots are written in (`sources`), its pages, and its conversions.
- **The head snippet,** first in `<head>` after the charset and viewport tags, as `init` placed it, on every page that can vary, through the stack's include. On Nuxt 2, its entries in `nuxt.config.js`, with its `hid` in `__dangerouslyDisableSanitizersByTagID`.
- **What decides:**
  - **on Vercel,** a root `middleware.ts` from `routingcat/vercel`, on Node.js, whose matcher leaves out a server's admin paths;
  - **on Workers,** a `worker.ts` serving the site's assets, `run_worker_first` and the `CF_VERSION_METADATA` binding;
  - **on Pages,** `functions/_middleware.ts`;
  - **in front of a server on Cloudflare,** a Worker in upstream mode, on the site's routes.
- **The build command** runs `npx routingcat build` after the site's own build, which registers the deployment and writes what the middleware or Worker imports to `.routingcat/`, which is never committed. On Hugo, Jekyll and Nuxt 2, `init` names that step in its closing lines rather than editing the build script; on Eleventy it edits `package.json`'s build script.
- **On Workers and Pages, the dev script** runs `routingcat build` before `wrangler dev` or `wrangler pages dev`, which `init` added.

**`init` asks where a server-rendered site is served,** for Laravel, Rails, Django, WordPress or PHP in a folder with no Vercel link, `vercel.json` or Wrangler configuration. Run by an agent, it stops instead (D74): ask the person, then run it again with `--host vercel`, `--host cloudflare-workers` for a Worker in front of the server, or `--host none` for any other host, which makes a script site. Run again with another `--host`, it moves the site, results kept, and binds it to the new host's project as setup does, from the folder's Vercel link or Wrangler's account, in place of the old host, whose builds then register it no more (A44); a Worker left in front of the server keeps deciding on its route until it is deleted. A plain HTML site keeps its pages in `public/`: with `index.html` at the project's root, the host would publish the whole folder, `.routingcat/` and the build's credential included, so `init` stops there (D81). Where neither the config nor Wrangler's routes name the production address, run `init --origin https://<your domain>`.

## Declare a page

A page is declared in `routingcat.config.json`, with its key, routes and URL. Its slots are written in the templates, every variant in the page:
- **The container** carries `data-rc-page` and `data-rc-slot`, literal keys. It is a `div`, or a `span` inside a paragraph.
- **Every child is a variant,** with `data-rc-variant`, only whitespace and comments between them.
- **Exactly one variant has no `hidden`:** the default. Every other carries `hidden`, alone, never `until-found`, with no `display` in its `style`.
- **`push` writes the rest:** `data-rc-hash`, `style="display:contents"` and `data-nosnippet`. It never touches `hidden`, registers nothing, and needs no sign-in. Commit what it changes.
- **Inside a variant:** no running scripts, styles or JSON-LD, no duplicate ids, at most one `h1`, nothing per visitor, and forms that work once shown. Images are `loading="lazy"`, with `data-rc-lcp` on each variant's main one.
- **A `<template>` variant** isn't allowed on these pages.

Each new variant's `description`, saying what it tries, goes in the config's `variants`, under the variant's address, as `"home/hero:learns": { "description": "…" }`, beside its `parent` and `relation` where it has them. Every page the markup names is declared in the config (D70). The rules and the examples are in `guides/build-a-page.md`.

## Look at every variant

- **On the person's machine:** the site's build, then `npx routingcat build`, then `wrangler dev` on Workers or `vercel dev` on Vercel, as `hugo && npx routingcat build && wrangler dev`; the dev script `init` edited on Workers and Pages runs the build. The pages run in development mode, record nothing, and take `?rc=hero:learns`, `?rc=home/hero:learns,subhead:short` or `?rc=off`, for the browser session, for any variant the templates held at the last `routingcat build`: run `push` and `routingcat build` again after adding one.
- **In production:** `npx routingcat preview home/hero:learns` prints a link valid for one hour that counts nothing; the page shows a badge naming each slot's variant, whose link ends the preview. A deployed build ignores `?rc=`.

## Ship

1. **`npx routingcat push`,** then commit what it stamped. `push --check` in CI fails while a template is stale, and so does the build (D71), so a deploy never registers other versions than it serves.
2. **Deploy as usual.** The build command's `npx routingcat build` registers it, with Vercel's own token, or on Cloudflare `ROUTINGCAT_DEPLOY_KEY` in the build's variables, which the site's owner mints in their own terminal with `npx routingcat keys deploy --branch <production branch>`. The build refuses stale stamps. On Cloudflare, the person can also deploy from their machine, with `ROUTINGCAT_ENV=production npx routingcat build`, as `cloudflare.md` says. A preview deployment routes between production's live variants, records to the preview environment and changes nothing live.
3. **With a Worker in front of a server,** only the Worker's own build runs `routingcat build`: after a template change, rebuild and deploy the Worker too, since deploying the server alone registers nothing. Until both serve the same templates, a slot whose markup changed shows its default and records no decision, and `doctor` names it (D89).

After an upgrade, run `init` again, then `push` for the new tracker; plain HTML pastes the partial again.

## Track conversions

- **From the server:** the HTTP events API, with the server events key from `npx routingcat keys server`, the request's `rc_vid` cookie as the visitor, and an `id` on every event. Its fields are the API's own, `visitor_id` and `occurred_at`, never `visitorId`: it refuses an event with a field it doesn't take, naming the field meant, and the site's own data goes in `properties`. The cookie is on the registrable domain, readable, and kept 400 days. Laravel decrypts every cookie it reads, and empties one it didn't encrypt, so its app reads `rc_vid` as empty unless `rc_vid` is in `EncryptCookies`' exceptions, where `init` puts it, or prints the edit where it finds neither `bootstrap/app.php`'s `withMiddleware` nor `EncryptCookies.php`'s `$except`, or both (D32); `doctor` fails its cookie check until one of them holds it.
- **In the page:** RoutingCat's browser script, loaded by its own tag with the site's public key as `data-key`, from `reference/sdk.md`: the head partial's tracker puts no `track`, `identify` or `link` on the page's `window.routingcat`. `data-env="preview"` goes only on a preview build's pages, never production's, whose events it would keep out of results. The script adds `routingcat.track(name)`, `routingcat.identify(accountId)` and `routingcat.link(url)` to that same `window.routingcat`, posted through the site's own `/_rc`. A form a third party handles tracks on submit with `routingcat.track(name, { id })`, the hex SHA-256 of the trimmed, lowercased address in the `id`: alone where the app has accounts of its own, whose record ids `identify` keeps, and after `routingcat.identify()` with that hash where it has none.
- **PostHog:** `before_send: (event) => (window.routingcat ? routingcat.routingcatProperties(event) : event)` in PostHog's `init` puts the visitor id and the slots the page shows on every event once the head partial's tracker has loaded. Keep the check: the tracker loads `defer`, after `init`, and a blocker may stop it, so without it PostHog never starts. Events captured before the tracker loads, a page view's first `$pageview` among them, go without the properties. An existing `before_send` becomes an array with this line last: `guides/posthog.md`.
- **Stripe** isn't covered yet on a template site: leave its payments untracked rather than sending the server's own events, and tell the person.
- **Whop:** the owner runs `npx routingcat connect whop` once, with no webhook code. The server creates each checkout configuration through Whop's API with `metadata: { rc_vid }` from the request's cookie and `rc_return=whop` on `redirect_url`, never a plain plan link: `guides/whop.md`.

The calls and their rules are in `guides/tracking.md`.

## When something fails

- **Stale stamps or a stale partial (D71)** fail the build, `push --check` and `doctor`, and a config whose `$schema` is another version's (D123) fails `push --check` and `doctor`: run `push`, commit, deploy.
- **The markup:** `push` names the file and line (D66 to D70); a minifier that strips RoutingCat's attributes is D73.
- **The served pages:** the snippet missing or rewritten (D89); a Content Security Policy that blocks it (D92): give the partial's script tags the page's own `nonce`, which `push` keeps, or allow the snippet by the hash `doctor` names, which an upgrade can change; styles by the same nonce or `'unsafe-inline'`, `https://cdn.routingcat.com` in `script-src` for the tracker and `'self'` in `connect-src` for its beacons; a cache or a Cloudflare feature in front (D113); and the middleware's or Worker's forms of D13, D16 and D20.
- **Old browsers,** below Safari 16.4, Chrome 105 or Firefox 121, see the defaults.
- **Each check `doctor` runs** is in `operate/troubleshooting.md`.
