# RoutingCat on Next.js

This site runs RoutingCat on Next.js 16.2.6 or later, with the App Router. `SKILL.md` holds what every site shares; this file holds the code. The docs' Next.js copy is in `node_modules/routingcat/docs/nextjs/`, and paths below are relative to it. A site on Vercel also reads `vercel.md`.

## What `init` set up

- **`withRoutingCat()`** around the `next.config` export: the build registers what `routingcat/` and `routingcat.config.ts` declare.
- **`proxy.ts`,** Next.js 16's middleware file, which decides each visit before the page renders.
  - **A composed `proxy.ts`** wraps the site's own handler as `export default proxy(handler, { paths })`, from `routingcat/next/proxy`.
  - **Its `config.matcher`** lists the handler's entries, the same as `paths`, then RoutingCat's own entry, `'/((?!_next/|_rc/|api/|.*\\.(?!rsc$)[a-z0-9]+$).*)'`. Write them all as literals, since Next.js reads the matcher statically and ignores a variable.
  - **When a change drops the wrapper or the entry,** as a library's upgrade that replaces `proxy.ts` can, `npx routingcat init` restores it, or prints the edit.
- **`<RoutingCat />`** in each root layout, which reports what the browser showed.
- **`routingcat.config.ts`,** its `config` imported from `routingcat/next`.

## Declare a page

One file per routed page, in `routingcat/`:

<!-- source: examples/nextjs-site/routingcat/home.ts -->
```ts
// routingcat/home.ts
import { page, slot, variant } from 'routingcat/next'

export const home = page('home', {
  routes: ['/'],
  slots: {
    hero: slot({
      default: 'current',
      variants: {
        current: variant({ fields: { headline: 'Route every visitor to what converts' } }),
        learns: variant({
          fields: { headline: 'Your pages learn what converts each visitor' },
          description: 'Lead with learning',
        }),
        // …
```

Each new variant also takes a `description`, saying what it tries, as `learns` does. A component variant is `variant({ component: Hero, content: { … } })`, whose `content` declares the copy it shows, and a field can hold an imported image. `reference/declarations.md` has every option.

## Render it

- **Render each slot through its component:** `<x.hero>{(f) => <h1>{f.headline}</h1>}</x.hero>`, or `<x.cta />` for a component variant, whose props pass through. The component marks the slot so the browser reports what it showed. Reading `x.hero.fields` alone leaves the slot unmeasured. Its mark is a `div`: inside a `<p>` or other inline-only content, give the slot `tag="span"`, or hydration breaks.
- **Await `routingcat.decide(…)`** at the top of the page, outside any `<Suspense>`. With Cache Components, a server-rendered page is the exception: its `decide` reads the request, which Next.js requires inside `<Suspense>`, so the page needs a `loading.tsx`, or `<Suspense>` around the part that calls it; without either, `next build` stops on runtime data read outside `<Suspense>`.
- **Server code runs on Node.js:** a route with `export const runtime = 'edge'` can't call `decide`, `track` or `identify`.
- **A static page,** which Next.js prerenders, calls `const x = await routingcat.decide(home, { params })` with its own `params`. It also needs a wrapper route in its folder, `routingcat/[rc]/page.tsx`, which `plan` prints when it's missing:

  <!-- source: examples/nextjs-site/app/routingcat/[rc]/page.tsx -->
  ```tsx
  // app/routingcat/[rc]/page.tsx
  // The wrapper route of app/page.tsx: it serves the home page's prerendered combinations.
  import { routingcat } from 'routingcat/next'
  import { home } from '@/routingcat/home'

  export * from '../../page'
  export { default } from '../../page'
  export const generateStaticParams = routingcat.prerender(home)
  ```

  The wrapper repeats the page's route settings as literals, such as `export const revalidate = 3600`, because Next.js ignores settings a file re-exports. It never sets `dynamicParams = false`. Each combination is a prerendered page: at most 1,000 per page, with a warning above 100. A page whose route takes params, such as `/blog/[slug]`, passes its own as the second argument, `routingcat.prerender(blog, blogParams)`, with the page's `generateStaticParams` imported as `blogParams` from `'../../page'`; `plan` prints the wrapper that way.
- **A server-rendered page,** one that already reads `cookies()`, `headers()` or `searchParams`, calls `const x = await routingcat.decide(home)`, with no wrapper. Don't make a static page dynamic just to route it, and never route a page under `dynamic = 'force-static'`: Next.js renders it once for everyone, so RoutingCat leaves it unrouted and warns (D120).
- **In a layout above a static routed page,** read `usePathname()`'s value only after mount, or hydration can mismatch on the prerendered variants. `plan` flags a layout that reads it during render. For an active link:

  <!-- source: examples/nextjs-site/components/nav.tsx -->
  ```tsx
  // components/nav.tsx
    const pathname = usePathname()
    const [active, setActive] = useState<string | null>(null)
    useEffect(() => setActive(pathname), [pathname]) // after mount, never during the first render
  ```

The full code is in `guides/build-a-page.md`.

## Look at every variant

In `next dev`: `?rc=hero:oneclick` shows a variant, `?rc=home/hero:oneclick,cta:demo` several, and `?rc=off` the defaults. `next dev` and a local `next build` register and record nothing, and a local build's RoutingCat line says so.

## Ship

The build registers through `withRoutingCat()`, with the build's credential: on Vercel, Vercel's own token (`vercel.md`); elsewhere, `ROUTINGCAT_DEPLOY_KEY`, which the site's owner mints in their own terminal with `npx routingcat keys deploy --branch <production branch>`. Check a change with the project's typecheck, lint and tests, and a local `next build` where the project builds locally.

## Track conversions

The calls come from `routingcat/next`:
- **`await routingcat.identify(accountId)`** links the visitor to an account: where the account is created, and where the app first loads the signed-in user, at every sign-in.
- **`routingcat.track(name, { id, … })`** reports the event: in Server Functions, route handlers, server components and client components. Its `id` is required.
- **They never throw** and send after the response, so neither needs `await`: RoutingCat joins a link and its events in whichever order they arrive. In development they log, record nothing, and say so. A call RoutingCat would refuse, such as a server `track` without an `id`, is logged once and not sent, and an invalid optional field is left out; `null` reads as absent.
- **Only in the App Router:** in Pages Router API routes, `getServerSideProps` or scripts, the calls send nothing and say so once; post to the HTTP events API there.
- **`occurredAt`** takes a `Date`, an RFC 3339 string, or a number of Unix seconds or milliseconds.
- **`fromMinorUnits(amount, currency)`** converts an amount in minor units, such as cents, by the currency's own exponent. The Stripe mapping's values come already in major units.

| Situation | What to add | Recipe |
|---|---|---|
| The app creates its own account record | Where it creates it: `await routingcat.identify(user.id)`, then ``routingcat.track('signup', { id: `signup:${user.id}` })``. Identify again where the app first loads the signed-in user. | `guides/tracking.md` |
| Clerk, or another provider, with no record of the app's own | At the first signed-in page load: a client component in the root layout, inside `<ClerkProvider>`, identifies at each sign-in. The first time it shows a user created in the last 7 days, it calls a Server Function that reads the user from Clerk, checks the age again, identifies and tracks `signup` with `id: signup:<user id>`, `accountId` and `occurredAt`. Nothing is set up at Clerk; its `user.created` webhook stays optional and shares the id. | `guides/auth.md` |
| Stripe | At checkout creation, `metadata: { rc_vid }` from the `rc_vid` cookie, on the session and in `payment_intent_data` or `subscription_data`, and `rc_return=stripe` on `success_url`. The webhook runs RoutingCat's Stripe mapping, `run(stripe, stripeTrigger(event, link).object, read, link, { providerAccount })` from `routingcat/outcomes`, then identifies each link and tracks each outcome with its `key` as `id`: purchases, renewals, trials, cancellations, refunds and disputes, each once. The endpoint is on `STRIPE_API_VERSION`, with the guide's events, never `invoice.created`. Copy the guide's code. | `guides/stripe.md` |
| Whop | The owner runs `npx routingcat connect whop` once: no webhook code. The server creates each checkout configuration with `metadata: { rc_vid }` and `rc_return=whop` on `redirect_url`, never a plain plan link. | `guides/whop.md` |
| PostHog | `before_send: routingcatProperties`, imported from `routingcat/next`, in the app's `posthog.init`, last in an array if it already has hooks. PostHog loaded from its HTML snippet can't import it: offer to move it to `posthog-js` from npm. | `guides/posthog.md` |
| An outcome the app already captures in PostHog, such as a browser form's event | A PostHog destination, rather than a second `track`, as `setup.md` says. The objective is the exception, even when PostHog captures it too: track it with `routingcat.track` in the app's own code, as a server event that doesn't wait on PostHog's delivery. | `guides/posthog.md` |
| Another backend, or a repository you can't edit | The HTTP events API, with the server events key from `npx routingcat keys server`. Out of your reach, give the person the snippet and the variable to set. | `guides/tracking.md`, `reference/events-api.md` |
| An app on a subdomain | The same recipes: the `rc_vid` cookie is shared across the registrable domain. | `guides/tracking.md` |
| Another registrable domain, or a form with no backend | `routingcat.link(url)` in a client component on the links that cross, after mount or in the click handler, since during render it returns the link without the id; `data-collector` on the other domain; and `npx routingcat domains add`; or, for a form with no backend, `routingcat.track` on submit with the address's hash in its `id`, after `routingcat.identify` with that hash only where the site has no accounts of its own. | `guides/tracking.md` |

Copy the recipes' code from the docs: it is the example apps' tested code.

## When something fails

**`init` stops before changing anything** when it finds:
- Next.js below 16.2.6, or no `app/` folder: the message gives Next.js's upgrade command;
- a `middleware.ts`: the message gives Next.js's command to rename it to `proxy.ts`;
- no Next.js app in the folder, or several: the message names the app's folder to run it in.

A framework upgrade or a rename changes the person's app beyond RoutingCat, so treat it as you would any such change, then run `init` again.

**Next.js's own failures:**
- **The proxy didn't run (D9):** `proxy.ts` must export `proxy(…)` from `routingcat/next/proxy`, and its `config.matcher` must hold RoutingCat's entry, as a literal, as above. `npx routingcat init` restores a dropped wrapper, or prints the edit. A function of the site's own exported as `proxy` beside it runs in RoutingCat's place, as Next.js runs the named export first: stop exporting it (D32).
- **No deployment registers after a build did (D11):** open the site or run `doctor`; if it still doesn't, check that `proxy.ts` exports `proxy(…)` from `routingcat/next/proxy`.
- **Decisions without render beacons (D13):** add `<RoutingCat />` to the root layout. In the person's own browser, an ad blocker also stops beacons.
- **Nothing recorded from the proxy for hours (D20):** first check that the proxy still runs, as `doctor`'s proxy check (D9) does. If it runs, it lost access: redeploy, which gives it a fresh credential.
- **A Pages Router page (D34):** routed pages are App Router pages.
- **A static page's wrapper route:** missing (D40), add the one `plan` prints; its settings differ from the page's (D41), copy the page's literal values; it sets `dynamicParams = false` (D48), remove that line.
- **A page under `force-static` (D120):** remove `dynamic = 'force-static'`, or keep the page static through `routingcat.decide(page, { params })` and its wrapper route.
- **A hydration mismatch on a static routed page (D42):** a layout above it reads `usePathname()` during render. Read it after mount.
- **A variant browsers report as shown less often than the slot's others (D128):** make it render as fast as they do, and unconditionally. That is a render to fix, not a variant to pause.
