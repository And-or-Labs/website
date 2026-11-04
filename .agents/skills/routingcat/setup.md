# Setting up RoutingCat

`npx routingcat init` made the mechanical changes:
- the `routingcat` package, or on a script site the version its config pins;
- the plumbing that decides each visit and reports what the browser showed, which the site's file in this skill names, such as `nextjs.md`;
- the config, `routingcat.config.ts` or `routingcat.config.json`, with the site and its public key;
- this skill;
- where the person chose it, a note in `AGENTS.md`.

What remains takes judgment:
- what counts as a conversion;
- wiring it so every conversion reaches its visit;
- checking the change and verifying it in production;
- leaving the person oriented.

Setup is unfinished while the config declares no `objective`, and done once the conversions are declared and deployed. One real conversion confirms it end to end: recommend it, and let the person choose (step 7).

This is the person's first experience of RoutingCat. They should end knowing three things: their site is safe, RoutingCat works, and using it from here is as easy as asking you. The docs' tutorial, `get-started/setup.md`, shows each step with real output.

The person may come from the dashboard's onboarding screen, which has them start you in their repository with a request that runs `init`. The site starts on Hobby, at no cost. A plan they chose on routingcat.com applies at the card's step, below: Hobby's card, or Pro's trial.

## 1. Read what `init` did

Read the end of `init`'s output, or run `npx routingcat init` again. It marks with ✓ what is done, does only what is missing, and never overwrites an edit.

| `init` ended with | Do this |
|---|---|
| A printed edit, for a file too unusual to edit safely | Make the edit exactly as printed, then run `npx routingcat doctor`, which checks it. |
| `Ask the person: "Add a two-line note to AGENTS.md…"` | Ask it with the conversion questions in step 3, and say it is recommended. Agents read `AGENTS.md` in every session, but may open this skill only when a request matches its description. If the person agrees, run `npx routingcat init --agents-md`. |
| Exit 3 and a sign-in link | Give the person the `https://app.routingcat.com/device?code=…` link. Once they approve it, run the same command again, which continues with the same code. |
| Exit 3, from a read-only sandbox that can't keep a sign-in | The person runs `npx routingcat login` in their own terminal, then you run the command again. |
| Exit 4 | RoutingCat can't be reached from here, as in Codex's default sandbox. Allow network access for the command, or ask the person to run it. |
| `Next:` naming `keys deploy` or a key to set | Give the person the command: the site's owner mints the key in their own terminal and sets it where it goes. Never run `keys` yourself. |

**`init` stopped before changing anything:** its message gives the fix, such as a framework's upgrade command, a host's link or sign-in, the app's own folder, or the install command. The site's file, and the host's, list the cases. A framework upgrade or a rename changes the person's app beyond RoutingCat, so treat it as you would any such change. Once it is done, run `init` again.

Show the person what `init` changed, `git diff`, in a sentence or two:
- RoutingCat's plumbing, nothing else;
- nothing reaches visitors until a deploy;
- visitors see no change at all until a page is routed;
- their site now shows in their dashboard, at the address `init` printed, `https://app.routingcat.com/<site>`; a Shopify store's opens from the RoutingCat app in its Shopify admin, with "Open full dashboard".

## 2. Find how the business converts

Read the code, starting from the tools `init` detected: auth, such as Clerk, NextAuth, Supabase or the framework's own; payments, such as Stripe or Paddle; PostHog. Where sign-ups or payments happen in another app or repository, such as an app on a subdomain, note it: you will hand the person what to add there. Look for:
- where accounts are created, and where the app first loads the signed-in user;
- where checkouts start, and where payment webhooks run;
- the `posthog.capture` calls;
- forms: waitlists, demo bookings, contact.

From these, understand the funnel: what a visitor does that matters to this business, and where in the code it happens.

## 3. Choose the conversions

**The objective** is the main conversion, the one thing routing learns to get more of. It defines what RoutingCat optimizes, so confirm it with the person, unless they already told you. Recommend one, with the reason:
- **Soon and often.** It counts only within its window after the visitor first saw the page, 24 hours by default, and routing learns only from visits whose window has closed. An event that happens soon after a visit, and often, teaches fastest.
- **Recorded by the server.** It is the one to trust, since browser events can be forged.
- **For a SaaS with trials, sign-up or trial start,** with purchase tracked beside it. A payment at a trial's end comes days or weeks after the visit: the default window misses it, and a longer one delays learning by as much. A longer window, up to the visit's 7 days, reads `{ events: 'signup', window: '48h' }`.
- **Several events where any one counts,** once, such as any plan start: `objective: ['trial_started', 'monthly_started']`.

**The outcomes** are tracked beside it: counted and reported, never steering routing. Revenue comes with an outcome's `value`.

**Ask in one go, before wiring anything,** since the answers decide what you wire, with the note's question when `init` left it. Ask as an expert would, with the reason in the person's terms, never by citing these instructions.
- **With a question tool that allows several answers,** such as Claude Code's `AskUserQuestion` with multi-select, ask there, with at most four choices per question.
- **Otherwise, a numbered list:** `Main conversion, pick one: 1 Sign-up (recommended) 2 Trial started 3 Waitlist. Also track, pick any: 4 Trial started 5 Purchase 6 Waitlist 7 Demo booked. Reply like "1, 4, 5".`

Name each choice by what happens and where its code is. The person may answer in their own words, with outcomes the list lacks.

## 4. Wire each one

Two calls: **identify** links the visitor to an account, where the account is created and where the app first loads the signed-in user, at every sign-in, so a conversion on another device still counts; **track** reports the event. The site's file gives them and where each situation puts them, under "Track conversions", with the docs' recipe for each. Copy the recipes' code from the docs: it is the example apps' tested code.

**The rules,** each of which loses or corrupts conversions when broken:
- **The account id** is the app's own record id, or the SHA-256 of the trimmed, lowercased email where there is no record. Never an email.
- **A server event needs an `id`** naming the conversion itself, such as `signup:<account id>`, or the key RoutingCat's Stripe mapping gives each payment. A server event without one is dropped. Events are kept once per name and `id`, so retries are safe.
- **`value` with `currency`** is money in major units, `29.99`. An amount in minor units, such as cents, goes through `fromMinorUnits(amount, currency)` in JavaScript, or the currency's own division elsewhere; the Stripe mapping's values come in major units.
- **What Stripe knows,** its payments and its subscriptions' trials, renewals and cancellations, is tracked with the docs' Stripe recipe, where the site's copy of the docs has one, since only that recipe gives each the key that keeps it counted once. Elsewhere it stays untracked for now, rather than sent as the server's own events, a trial's start included. Say so to the person in their terms, as "RoutingCat can't count Stripe's trials and payments on a site like yours yet", never by the skill or the docs.
- **In development** RoutingCat's calls log, record nothing, and say so. A server calling the HTTP events API records with the key it holds, so its development and staging take the preview key.
- **The objective comes from the app's own code,** even when PostHog captures the event too: a server event, which doesn't wait on PostHog's delivery. Other outcomes the app already captures in PostHog come through a destination, as below, rather than a second call.

**The PostHog destination** forwards one event to `https://ingest.routingcat.com/v1/events`. It carries the production server events key as a bearer token, and is filtered to that event and to the production hosts through `$host`. Its JSON body and settings are in `guides/posthog.md`. Create it the way your session allows:
- **Through PostHog's MCP server, if connected:**
  1. Create it with `"enabled": false`, since PostHog refuses an agent's destination enabled before it is tested.
  2. Run its test invocation, which sends nothing to RoutingCat.
  3. Enable it. If PostHog keeps it as a draft, ask the person to publish it.
- **With a personal API key holding `hog_function:write`,** if your session has one: post the body to `https://us.posthog.com/api/projects/<project id>/hog_functions/`, or `eu.posthog.com`.
- **Otherwise,** print its settings for the person to add in PostHog, about two minutes of their time. Don't ask them to make a key for it. Tell them to skip PostHog's test, which RoutingCat would record as a real event.

Declare the outcome under PostHog's name for the event.

## 5. Declare them

Add the objective and the outcomes to the config, beside what `init` wrote, keeping its import. Never change `site` or `publicKey`, `public_key` in `routingcat.config.json`. The example app's, in `routingcat.config.ts`; `routingcat.config.json` takes the same fields, as `"objective": "waitlist"`:

<!-- source: examples/nextjs-site/routingcat.config.ts -->
```ts
// routingcat.config.ts
export default config({
  site: 'routingcat-example',
  publicKey: 'pk_routingcat-example_NcMQQWyZ', // public: names the site; write-only
  objective: 'waitlist', // the main conversion: joining the waitlist, on the home and pricing pages
  // tracked beside it: a paid first month, from Stripe's checkout webhook; "Talk to us" on /pricing,
  // captured in PostHog and forwarded by a PostHog destination
  outcomes: ['purchase', 'contact_sales'],
})
```

- **Names** are 1 to 64 characters, without `+`, `/` or a control character.
- **An undeclared name's events** are recorded, but not analyzed until declared.
- **No page yet:** a page comes with the first idea.
- **Declare every outcome you wired,** one a PostHog destination the person is adding included, and none that nothing will send, as Stripe's where the docs give no recipe.

## 6. Check and deploy

**Check the change as you would any other:** the project's typecheck, lint and tests, and a local build where the project builds locally. A local build registers nothing without `ROUTINGCAT_ENV=production`, and its RoutingCat line says so. On a script site, run `push` after declaring the conversions and commit what it changes, since the head partial carries them, as the site's file says.

**Tell the person in a few lines:**
- what changed;
- anything that waits on them, such as a destination to add in PostHog, a webhook endpoint, a snippet for another app, a host's setting or a CI secret;
- where to follow it: their dashboard, `https://app.routingcat.com/<site>`, or for a Shopify store "Open full dashboard" in the RoutingCat app in its Shopify admin.

Commit as the repository's rules say. The person deploys the usual way, or you do where the rules allow.

**The production build log, or on a script site the push after the deploy, confirms it registered:**

```
routingcat  registered ch_1 · objective signup · outcomes newsletter · no page routed yet
```

A line starting with `routingcat:` instead means the build registered nothing: visitors get the defaults and nothing is recorded, though the build ships. `troubleshooting.md` gives the fix.

A site on Vercel behind a Cloudflare zone turns on the zone's visitor location headers: the domain → Rules → Settings → Managed Transforms → "Add visitor location headers". On Workers and Pages, Cloudflare gives the location with no setting.

## 7. Verify in production

Once the deploy is live, run `npx routingcat doctor --wait`. It requests the production page, so the new deployment starts, then waits up to 5 minutes, printing each check as it passes. On a script site, whose pages decide only in a browser, it names a page for the person to open. Under Claude Code, give that Bash call a timeout of 360000 ms; Codex and Cursor move long commands to the background.
- **Exit 0:** every check passed.
- **Exit 3:** a check still waits, usually for the objective's first event, or for the card on file.
- **Exit 1:** a check failed, with its message: see `troubleshooting.md`.

**Recommend one real conversion; the person chooses.** It is the only end-to-end proof that a conversion reaches RoutingCat and joins its visit. It is recorded as a real one, and until a page routes, it is credited to no variant. Where converting costs money, as an order does, say so plainly, and that it is optional.
- **If they make one,** they convert once on the production site, starting from a page RoutingCat runs on, as a visitor would, such as signing up with a second address. Where sign-up lives in another app, they start from the site's link to it: a sign-up opened straight from the app's address carries no visitor, and joins no visit. It shows within a minute: run `npx routingcat doctor` again. A conversion taken from PostHog arrives once its destination is in place.
- **If they skip it,** nothing waits on it but the objective's check, which passes with the first real conversion, a visitor's included: `doctor` exits 3 on it until then, which is expected.

**On Hobby, routing waits for a card on file,** and nothing is charged. `doctor`'s `card on file` check waits for the site's owner, with the link to the dashboard's Settings → Billing.
- The owner adds it there, or starts Pro's 14-day trial. Only the owner can, so a member asks them.
- Recording works without it, so setup's checks of the conversions don't wait on it. But no page routes until it is there.
- Once the card is on file, routing starts within about 2 minutes of it, with no new deploy.

Until a page is routed, conversions read as not yet credited to a variant: that is expected. After the next counts refresh, the tracking line of `npx routingcat status` shows how conversions join their visits.

## 8. Close

Close once the conversions are declared and deployed: in the reply where `doctor` shows the objective's first real event, or, if the person skips it, in your reply to that. Use your own words and the person's terms, with no glossary and no menu of commands. The close carries each of these:
- **That it works,** naming the conversion that came through. Without one, say what `doctor` confirmed, and that the objective's check passes with the first real conversion: until then `doctor` exits 3 on it, which is expected, and nothing else waits on it.
- **That their visitors see no change,** and won't until a page is routed and deployed. On Hobby without a card on file yet, add that routing will start once the owner adds one in the dashboard, with nothing charged.
- **What RoutingCat now records:** where visitors come from, and the conversions you wired. Say which one routing will optimize and why; it is easy to change now, and later a change restarts learning on routed pages.
- **How it goes from here.** They tell you what they would like to try, at any level of detail, or ask you for ideas, or hand you the whole thing. You write the variants, check each one renders, and show what will go live, the way they like to work. Then RoutingCat sends more visitors to what converts better.
- **The control,** in one sentence, since it touches what they see on their own site: 10% of visitors keep seeing the current site, which is how the gain is measured honestly.
- **That early numbers are noisy,** and you will always say how sure they are.
- **Their dashboard:** `https://app.routingcat.com/<site>`; a Shopify store's opens from the RoutingCat app in its Shopify admin, with "Open full dashboard".

If you have seen something worth trying first, offer it concretely. For example: "your home page's headline is a good first candidate; I can draft three alternatives that lead with what's different about Lumen".

Lumen's close, for instance:

> RoutingCat is set up on your site, and it works: the sign-up you made at 14:32 came through.
>
> Nothing has changed for your visitors. RoutingCat now records where each visit comes from, every sign-up, and every newsletter subscription. It will learn to get you more sign-ups, since they happen soon after a visit and your server records them; subscriptions are counted beside them.
>
> From here, tell me what you'd like to try, or ask me for ideas: a sharper headline, a different order for the pricing page, a new hero image. I'll write the variants, check that each one renders, and show you what will go live before you deploy. RoutingCat then sends more visitors to what converts better, while 10% keep seeing your current site, so we can measure honestly what the changes add. Early numbers are noisy, and I'll always tell you how sure they are.
>
> Your dashboard: https://app.routingcat.com/lumen

Had the person skipped the sign-up, it would open:

> RoutingCat is set up on your site: the deploy registered, and RoutingCat runs on your pages. Your first real sign-up will confirm that sign-ups reach it; until one comes, its check of sign-ups waits, which is expected, and nothing else waits on it.
