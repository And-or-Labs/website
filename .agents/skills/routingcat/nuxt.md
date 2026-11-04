# RoutingCat on Nuxt

This site runs RoutingCat on Nuxt 4.6 or later, on Vercel, Cloudflare Workers or Cloudflare Pages. `init` stops below Nuxt 4.6. The module runs on Nitro 2, Nuxt 4's default server, and matches the pages' routes from the site's root. `SKILL.md` holds what every site shares; this file holds the code. The docs' Nuxt copy is in `node_modules/routingcat/docs/nuxt/`, and paths below are relative to it. The host's file is `vercel.md` on Vercel and `cloudflare.md` on Cloudflare.

## What `init` set up

- **`routingcat/nuxt` in `nuxt.config`'s `modules`.** Each `nuxt build` registers what `routingcat/` and `routingcat.config.ts` declare. The module also writes the head snippet early in every page's `<head>`, makes `<RoutingCatSlot>` and `useRoutingCat` available in every component, and sends the render beacons.
- **On Cloudflare, `nitro.preset`** in `nuxt.config`, `cloudflare_module` on Workers or `cloudflare_pages` on Pages, where nothing named one. A preset that isn't the host's, in `nuxt.config`, the environment or the build script, stops `init` (D107).
- **What decides each visit before the page is served,** and answers `/_rc`:
  - **on Vercel,** a root `middleware.ts`: `middleware(…)` from `routingcat/vercel`, on Node.js (`runtime: 'nodejs'`), with RoutingCat's entries in `config.matcher`. An existing `middleware.ts` is composed in place: its handler runs first on its own paths, and its matcher entries stay, RoutingCat's after them.
  - **on Workers,** `worker.ts`: `worker(…)` from `routingcat/cloudflare` around Nitro's Worker, `.output/server/index.mjs`; and in the Wrangler configuration, `main`, the `nodejs_compat` flag, `run_worker_first`, which lists the same paths as the Worker's matcher, and the `CF_VERSION_METADATA` binding. A Worker of the site's own stays `main`, and `init` prints the wrap to make around it.
  - **on Pages,** no file: each build wraps the Worker Nitro writes, through the module.
- **`.routingcat/`,** where each build writes RoutingCat's credential and values, kept out of the repository by `.gitignore`.
- **`routingcat.config.ts`,** or `.mjs` in a project without TypeScript, its `config` imported from `routingcat/vue`. On Cloudflare it also names the production address, as `origin`, from Wrangler's routes or `--origin`; with neither, `init` asks at a terminal and stops an agent (D88), which runs it again with `--origin https://<the domain>` once the person names it.

When a change drops the module or the host's entry, `npx routingcat init` restores it, or prints the edit.

## Declare a page

One file per routed page, in `routingcat/`, with `page`, `slot` and `variant` from `routingcat/vue`:

<!-- source: examples/nuxt-site/routingcat/home.ts -->
```ts
// routingcat/home.ts
import { page, slot, variant } from 'routingcat/vue'

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

- **A variant is made of fields:** plain values, such as text or numbers, or images imported from the repository, which the slot's template renders. What differs between ideas goes in the fields; how they show stays in the template, which every variant of the slot shares. A variant declared as a component fails its declaration: `nuxt build` stops, and under `nuxt dev` the page that imports it fails.
- **A version is a change to a variant's fields.** An edit to the template, shared code or content fetched at run time makes none, so keep what is tested in the fields.
- **Routes** use the notation of Nuxt's page files: `/pricing`, or `/blog/[slug]` for `app/pages/blog/[slug].vue`. A path belongs to one page.
- **Each new variant also takes a `description`,** saying what it tries. `reference/declarations.md` has every option.

## Render it

Each slot renders through `<RoutingCatSlot>`, which the module makes available in every component:

<!-- source: examples/nuxt-site/app/pages/index.vue -->
```vue
<!-- app/pages/index.vue -->
<script setup lang="ts">
import { home } from '~~/routingcat/home'
</script>

<template>
  <main>
    <RoutingCatSlot :page="home" name="hero" v-slot="{ fields }">
      <h1>{{ fields.headline }}</h1>
    </RoutingCatSlot>
    <!-- … -->
```

- **Its props:** `:page` takes the page's declaration, and `name` the slot's key. `v-slot="{ fields, variant }"` renders each variant from its fields, typed from the declaration, with its key: one template for every variant of the slot.
- **`tag="span"`** for a slot inside a sentence, or anywhere only inline content goes: a `div` closes the open `<p>`, and Vue's hydration finds the markup moved.
- **Classes and ids** given to `<RoutingCatSlot>` go on the slot's element. Give it no `style`: its own, `display:contents`, is what a Content Security Policy allows by hash.
- **Every variant is in the page,** the default shown and the others hidden, the same HTML for every visitor. Vue's hydration always matches, and Nuxt can prerender, regenerate or cache the page as usual. Before the page paints, the head snippet shows the visitor's variants from the response's `Server-Timing` header; where RoutingCat picks nothing, the page shows its defaults.
- **An in-page navigation to a routed page** asks `/_rc` for that page's variants, beside Nuxt's payload fetch, and shows its defaults if no answer comes within a second.
- **`useRoutingCat(page)`,** also available everywhere, tells code which variant each slot shows, for an analytics call or a widget initialized when shown, never to render a slot. It returns `{ shown, applied }`: `shown` holds the defaults through the server's render and the hydration, then, from mount on, what the page shows, following in-page navigations; `applied` is false until then, so code waits for it before it reports a variant. A template that reads them renders again after mount.
- **Write variants that can sit hidden:** no `id` used elsewhere on the page; at most one `h1`, in a slot that holds the page's heading; forms and widgets that work once shown and do nothing while hidden; nothing that differs by visitor, though content that differs by item is fine; no script that runs, no `application/ld+json`, no `<style>` and no stylesheet link. Give the images of every variant of a slot the same `loading`: with `lazy`, hidden variants' images aren't fetched.
- **Place each slot where the browser leaves it:** inside a table cell or a list item, or around the whole table or list, never directly inside a table, a list or a `select`. Slots don't nest, and `<head>` content can't be a slot. A CSS rule on the slot's own elements, such as `.hero > div { display: flex }`, shows hidden variants: style the elements inside them.
- **A slot is routed on its own page's routes only.** RoutingCat decides one page per request, so a slot of another page, as in a layout every page shares, isn't routed there.

`guides/build-a-page.md` has the full code, with a slot inside a sentence and `useRoutingCat`.

## Look at every variant

In `nuxt dev`: `?rc=hero:learns` shows a variant, `?rc=home/hero:learns,subhead:short` several, and `?rc=off` the defaults. The choice lasts for the browser session, in-page navigations included, and covers the variants declared when `nuxt dev` started: restart it after adding one. Open the pages at `localhost`, since over plain HTTP at another address they show their defaults. Development records nothing, and deployed builds ignore `?rc=`.

In production, `npx routingcat preview home/hero:learns` prints a signed link, valid for one hour, that shows the variant without counting in results, with a badge naming each slot's variant, whose link ends the preview.

## Ship

`nuxt build` registers through the module:
- **On Vercel,** with Vercel's own token (`vercel.md`).
- **On Cloudflare,** with `ROUTINGCAT_DEPLOY_KEY` in the build's variables, which the site's owner mints in their own terminal with `npx routingcat keys deploy --branch <production branch>`. That key registers production only for builds of its branch, as Cloudflare's builds or GitHub Actions report the branch, and from the person's machine, `ROUTINGCAT_ENV=production npx nuxt build`, then Wrangler, registers production under their sign-in once they confirm its plan, as `cloudflare.md` says; without the variable, and with no deploy key or `ROUTINGCAT_BRANCH` in the shell, it writes development values and registers nothing (D46). Builds of other branches take the preview key, from `npx routingcat keys deploy --env preview`. The build waits up to a minute for routing data that holds its own changes, so that the Worker routes a new page from its first request; when the wait runs out, its log says so.

Check a change with the project's typecheck, lint and tests, and a local `nuxt build`, which, without `ROUTINGCAT_ENV=production`, registers nothing and says so.

## Track conversions

- **On the server,** in the files under `server/` that Nitro runs, `routingcat` needs no import. Each call takes the handler's `event` first: the types refuse a call without it, which would send nothing and say so in the server's log.
  - **`await routingcat.identify(event, accountId)`** where the account is created, and where the server first reads the signed-in user, at every sign-in.
  - ``routingcat.track(event, 'signup', { id: `signup:${user.id}` })`` reports the event, without `await`.
- **In the browser,** components import `routingcat` from `routingcat/vue`: `track`, `identify` and `link`, without an `event`. They post through the site's `/_rc`.
- **The calls never throw,** and never delay the response. In development they log, record nothing, and say so.

| Situation | What to add | Recipe |
|---|---|---|
| The app creates its own account record | Where it creates it: `await routingcat.identify(event, user.id)`, then the `signup` track. Identify again at every sign-in. | `guides/tracking.md` |
| Clerk, or another provider | Where the docs' auth page puts it. | `guides/auth.md` |
| A conversion with no account, such as a waitlist | `track` alone, with an `id` derived from a hash of the address, so one address counts once. | `guides/tracking.md` |
| PostHog | Wherever the app loads `posthog-js` from npm: `before_send: routingcatProperties`, imported from `routingcat/vue`, in its PostHog plugin, last in an array if it already has hooks. PostHog loaded from its HTML snippet can't import it: offer to move it to `posthog-js` from npm. | `guides/posthog.md` |
| Stripe | Not covered yet on Nuxt: leave its payments and trials untracked, as `setup.md` says. | |
| Whop | The owner runs `npx routingcat connect whop` once: no webhook code. A server route creates each checkout configuration through Whop's API, with `metadata: { rc_vid }` from `getCookie(event, 'rc_vid')` and `rc_return=whop` on `redirect_url`, never a plain plan link. | `guides/whop.md` |
| Another backend, or a webhook | The HTTP events API, with the server events key, or a server route of the app the webhook reaches. | `guides/tracking.md`, `reference/events-api.md` |
| An app on a subdomain | The same recipes: the `rc_vid` cookie is shared across the registrable domain. | `guides/tracking.md` |
| Another registrable domain | `routingcat.link(url)` in a component, once mounted or in the link's click handler, since the server's render returns the link unchanged; `data-collector` on the other domain's browser entry; `npx routingcat domains add`. | `guides/tracking.md` |
| A form with no backend | On submit, in a component: `routingcat.track(name, { id })`, the hex SHA-256 of the trimmed, lowercased email in the `id`; alone, since the app's `identify` keeps its record ids, or after `routingcat.identify()` with that hash on a site with no accounts. | `guides/tracking.md` |

Copy the recipes' code from the docs: it is the example apps' tested code.
## When something fails

**`init` stops before changing anything** when it finds:
- Nuxt not installed (D76): install the app's packages;
- Nuxt below 4.6 (D77): the message gives Nuxt's upgrade command, `npx nuxt upgrade --dedupe`; a Nuxt 2 app built by a server gets the choice of a static build or Nuxt 4 instead;
- no host the folder names, or two (D74, exit 2): run it again with `--host vercel`, `--host cloudflare-workers` or `--host cloudflare-pages`;
- on Cloudflare, Nitro's static Pages preset, which writes no Worker (D107): set `nitro.preset` to `cloudflare_pages`, or to `cloudflare_module` for Workers;
- on Cloudflare, Wrangler signed out or reaching several accounts (D79): the person runs `npx wrangler login`, or set `account_id` in the Wrangler configuration; and on Workers, Workers Cache on (D80): remove its `cache` setting;
- no Nuxt app in the folder, or several sites (D51, D75): run it in the app's own folder.

An upgrade changes the person's app beyond RoutingCat, so treat it as you would any such change, then run `init` again.

**The build stops on Nitro 3 (D125):** the module runs on Nitro 2, Nuxt 4's default server. Which server the app builds on is the person's call: on Nitro 3, the module comes out of `nuxt.config`'s modules.

**Nuxt's own failures:**
- **Every page showing its defaults, under a base path (D126):** an `app.baseURL` other than `/` serves the pages where RoutingCat's routes, from the site's root, match none. The build warns and passes. Serving the app from `/` is the person's call.
- **RoutingCat didn't run on a page (D82), or a deployment never registered (D83):** on Vercel, `middleware.ts` exports `middleware(…)` from `routingcat/vercel`, keeps RoutingCat's matcher entries and declares `runtime: 'nodejs'` (D85); on Workers, Wrangler's `main` exports `worker(…)` from `routingcat/cloudflare`, `run_worker_first` keeps RoutingCat's patterns, and the `CF_VERSION_METADATA` binding stays, without which each isolate registers on its own (D86); on Pages, the build uses Nitro's `cloudflare_pages` preset, with `routingcat/nuxt` in the modules.
- **A page without the head snippet (D89), or decisions without render beacons (D13):** keep `routingcat/nuxt` in `nuxt.config`'s modules, which writes the one and sends the other. In the person's own browser, an ad blocker also stops beacons.
- **A routed page's answer without its `rc` entry (D89):** a header rule or a proxy in front removed `Server-Timing`, which carries the visitor's variants: keep it on the pages.
- **A Content Security Policy that blocks RoutingCat (D92):** a policy with Nuxt's per-request nonce covers the snippet and its style rules, in-page navigations included; otherwise allow the head snippet by the hash `doctor` names in `script-src`, and its style rules with `'unsafe-inline'` in `style-src`, since a policy that allows inline styles only by hash blocks them. Allow the slots' `style="display:contents"` with `'unsafe-hashes'` and its hash in `style-src-attr`, or slots render as boxes. `'self'` in `connect-src` covers `/_rc`.
- **A hydration mismatch, or a slot moved out of its paragraph:** give the slot `tag="span"`.
- **Several variants of a slot shown at once:** a CSS rule sets `display` on the slot's own elements.
- **A slot that renders nothing:** its `slot` names a slot the page doesn't declare, as Vue's warning says in development.
- **`nuxt build` stopping on a declaration, or a page failing under `nuxt dev`:** a variant declared as a component. Give it fields, and render them in the slot's template.
- **A build that registered, then failed to deploy (D10),** as when a Cloudflare deploy fails after `nuxt build`: visitors keep the previous version. Fix the deploy and deploy again, or revert the page.
