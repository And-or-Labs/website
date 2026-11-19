# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro 5 with plugin MDX, TypeScript, React islands, Cloudflare Pages static output and Pages Functions. Theme values come from `@andor/ds` (`themes/andor.css`); scanner packages are excluded. Starter scaffold is the Mainline Astro template, now only the source of generic block markup.

## Users

Primary: adtech founders and marketing leaders evaluating a senior, hands-on GTM operator. They are scanning for credibility, exact scope, visible pricing and a clear next step. Secondary: non-technical entrepreneurs or drafting organizations who need frank customization and SEO grounding. Third: subscribers who want build-in-progress material and the occasional swept-up-by-a-moment article from an adtech witnessing position.

Inferred from the original brief, not yet confirmed with the user: the primary-audience wording and the secondary-audience split.

## Product Purpose

The site for And/or Labs as a studio built on the founder's marketing history: his career context made legible, his Forward deployed marketer retainer offered with an exact price, the Lab notes feed presented as proof of live operating practice, and visible shape given to past work and byline fields. Success is a visitor deciding that the operator is real and specific enough to book a call, or subscribing to Lab notes.

## Positioning

The offer is priced and scoped in public, paired with progressive slices of pre-monetization exposure: a build in progress, a log on the record and one benchmark where the founder is both the product and its user.

## Operating Context

End-to-end operation of a personal-to-studio transition. Content lives in `src/content` and `src/data/site.ts`; legacy copy and press live in `~/Developer/_archive/andorlabs-site-old/content/pages/*.json`. Publishing is MDX with Git-based workflows; deploy is manual `wrangler pages deploy` to Cloudflare Pages project `andorlabs` because Git auto-builds are disconnected. Analytics is GTM at the Cloudflare edge plus PostHog, with consent gating handled edge-side. Newsletter signups post to `functions/api/subscribe.ts` over Loops with a Pages secret.

## Capabilities and Constraints

Four lines of work are addressable: MediaContext (bench at `/mcp/`), Forward deployed marketer (retainer at `/fdm/`), Lab notes (MDX at `/notes/`), On record (press fields at `/record/`). Legacy paths `/gtm`, `/lab`, `/experiments` and `/published` 301. One interactive AI-driven benchmark teaser ships on the home page; its availability, keys and consent behavior are open decisions. Text ingested by robots must be HTML text, not canvas text. Testimonials are limited to four real quotes (Scott Konopasek, Marty Kratky-Katz, Trevor Thomas, Goswijn Thijssen), lifted verbatim; no metrics beyond cited public figures; nothing may be invented. Open decision: whether the archive resolves as aliases, verbatim posts or aggregated fields grouped by theme.

## Brand Commitments

The founder's byline history, published field work and archiving conventions are preserved. He avoids performance-marketing agency language and "exited founder" phrasing. **Derived constraint:** copy must contain no em dashes and no exclamation marks. Inferred from repository copy conventions, not yet directly confirmed.

## Evidence on Hand

Career claims reference roles at Blockthrough, AdPushup, drbild.com, Adאופolis, Market and marketur.com, with revenue/user figures attributed to press releases and case studies rather than presented as audited performance. Press and research archive backing sits in `portfolio.json` (nine bylines, eight earned media, seven research citations, author archives, projects and investments) in `~/Developer/_archive/andorlabs-site-old/content/pages/`. No raw evidence-pack files are staged at the repo root; the archive JSON is the current source. Testimonials live in `TESTIMONIALS` in `src/data/site.ts` with sources noted. Absent: audited metrics, and any proof for the benchmark teaser beyond the prototype direction `.scratch/directions/c-cyanotype.html`.

## Product Principles

1. Evidence before adjectives: career outcomes, press and bylines land before capability claims.
2. One front door: legacy paths redirect rather than fork the story, and each line of work owns its route.
3. Shipping is the marketing: visible work-in-progress growth and a logged archive are themselves the pitch.
4. Pricing is part of the proof: one loud exact number, the rest behind progressive disclosure.
5. Redistribution over vanity: distribution memory and earned results count more than impressions.

## Accessibility & Inclusion

No product-specific standard or named assistive need has been established yet.