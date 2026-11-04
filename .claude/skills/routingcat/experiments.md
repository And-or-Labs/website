# Designing and running experiments

RoutingCat serves, measures and routes; the ideas come from you and the person. This file covers:
- turning ideas into experiments that teach something;
- sizing them to the site's traffic;
- judging the evidence and acting on it;
- running a site's experiments over time when the person hands that to you.

`SKILL.md` has the mechanics.

## Choose what to try

- **Start where conversions are decided:** the pages with the most visitors who could convert, usually the home page, pricing and the sign-up path. On those pages, start with what visitors meet first:
  - the promise;
  - the call to action;
  - the proof;
  - the offer.

  Use what you know about conversion. `sources` and `show --by` tell you who arrives, and from where.
- **Test ideas, not wordings.** Variants that differ in their idea teach something whichever way the result goes:
  - the angle, such as speed against quality;
  - the audience;
  - the structure;
  - the offer.

  Paraphrases of one idea differ too little for most sites' traffic to tell apart.
- **Prefer bold differences.** The size of a difference sets how fast the evidence comes; see "Size it to the traffic" below.
- **Run independent ideas in separate slots at once.** All of a page's slots learn from the same visits, so a headline, a call to action and a proof block can be tried together without splitting traffic. That holds while they stay independent in meaning, since routing learns no interactions between slots. Pieces that must agree go in one slot.
- **Remember that pages route independently.** A visitor can meet one idea on the home page and another on pricing, so keep ideas compatible across pages.

## Give each idea its shape

| To try | Shape |
|---|---|
| A headline, a line, a call to action | A slot of field variants: `{ headline }`, or `{ headline, subhead }` when the two must match |
| An image | A field holding an imported image. Its bytes make its versions; generated images go in the repository first. |
| The order of sections | One slot whose variants hold the order as data: `{ order: ['waitlist', 'plans', 'contact'] }`, which the page maps to its sections |
| A section shown or not | A slot whose variants render the section or nothing |
| A visual style | A field the page maps to classes, or a component variant. A shared stylesheet makes no version, so keep the difference inside the variant. |
| A layout or a redesign | One slot whose variants are components, each declaring its key copy in `content` |
| A price or a plan | A slot with `fixedShare: 1`: see "Prices and plans" below |
| Copy kept in a data file | Declare the file in the variant's `content`; otherwise editing it makes no version |

A site whose slots are written in its templates holds each variant as markup in its slot, with the same ideas. On a page the browser decides, an arm a backend honors, such as a price, is a trade-off: see "Prices and plans".

The order of sections, as data, in the Next.js example's pricing page:

<!-- source: examples/nextjs-site/routingcat/pricing.ts -->
```ts
// routingcat/pricing.ts
    // The order of the sections under the lead, by the names app/pricing/page.tsx gives them.
    sections: slot({
      default: 'current',
      variants: {
        current: variant({ fields: { order: ['plans', 'contact', 'waitlist'] } }),
        waitlist: variant({
          fields: { order: ['waitlist', 'plans', 'contact'] },
          description: 'The waitlist before the plans',
        }),
      },
    }),
```

The page keeps each section's code in a record by name, `plans`, `contact` and `waitlist`, and renders them in the variant's order:

<!-- source: examples/nextjs-site/app/pricing/page.tsx -->
```tsx
// app/pricing/page.tsx
      <x.sections>
        {(f) => f.order.map((s) => <Fragment key={s}>{sections[s]}</Fragment>)}
      </x.sections>
```

Only the order varies, so every variant shows the same, true sections. Content fetched at run time is never captured, so keep what you test in the repository.

## Size it to the traffic

Evidence comes from conversions of the page's objective, not from visits. The usual two-sample rule of thumb applies to telling two variants apart: about 16·(1−p)/(p·r²) visits each, at base rate p and relative difference r. At a 3% conversion rate:

| Difference | Visits per variant |
|---|---|
| 50% | about 2,000 |
| 20% | about 13,000 |
| 5% | about 200,000 |

So:
- **Size each slot's set to the page's traffic.**
  - **Tens of conversions a week** support one or two bold alternatives beside the default, in one slot.
  - **Hundreds a week** support three to five per slot, in several slots.
  - Each extra variant takes traffic from the others' evidence, and a new key ramps up gradually.
- **The measured gain settles far more slowly.** It compares routed visits with the 10% control, so its precision is set by the control's size. At a 3% rate, confirming a 20% gain takes about 150,000 visits to the page, and a 50% gain about 25,000. On a small site it stays "too early to call" for months. That's expected: say so up front, and decide day to day on the predicted differences, which settle sooner.
- **On Next.js, a static page is built once per combination at every deploy.** Three slots of four variants make 64 pages; the limit is 1,000, with a warning above 100.
- **On Hobby, the account's sites share 10 live variants,** the slots' defaults not counted, and a Shopify store has its own 10. Below Hobby's 10,000 visitors a month, more would starve each other anyway.
  - Spend them where the traffic and the open questions are.
  - A new variant past them is held, not served: retire a settled one first, so each new idea takes a freed place.
  - When the person wants to run more at once, Pro allows 100 a page, and upgrading is the owner's call.

## Write the variants

- **Keep the page as it is as the default,** so the control and every comparison start from today's site.
- **Give each variant one clear idea,** and write it in the variant's `description`. Write the deploy's commit message as the change's reason: RoutingCat keeps it with the change.
- **Keep facts, numbers, testimonials, guarantees and prices true and the business's own.** What the site already says, on any page, can be reused; anything new comes from the person.
- **Match the site's voice and design system.** Every variant must look finished in every combination: check them all locally with `?rc=`.

## Judge the evidence

1. **Health first.** Warnings, the tracking line and drift in `status` come before any result. A drop in tracking, a shared cache in front of the site or a broken render makes the numbers mean something else.
2. **Read each variant against the default.** Use its predicted difference from the default, its range and its signal:
   - **The range lies wholly below zero, with Building or Strong signal:** the variant very likely does worse.
   - **The range lies wholly above zero, with Strong signal, holding for several days:** it very likely does better.
   - **The range spans zero:** not known yet. Leaving it is cheap, since routing allocates by uncertainty and favors what looks best meanwhile.
3. **Look at for whom.** Before retiring a variant that's worse on average, compare `show <variant> --by device` with the default's. The other breakdowns are `traffic_source`, `visit`, `time_of_day` and `day_type`. A variant can do better for one kind of visitor, where routing shows it more: a relative share above 1 and a predicted rate above the default's in that group. Retiring it loses that. Groups with few visits show no range: don't read them.
4. **Check that visitors see it.** In `show`, a low `rendered` share, or a warning that browsers report a variant shown less often than its siblings, means a slow or broken render, not a weak idea. Fix the render, then judge. Pausing the variant instead gives up what it wins, such as the visitors routing favors it for.
5. **Read the page's measured gain:**
   - **Wholly above zero:** routing adds conversions.
   - **Spanning zero:** not known yet. This is usual for weeks, or months on low traffic.
   - **Wholly below zero:** the alternatives, as routed, do worse than the defaults. Retire those predicted worse than the default, and write better ones.
6. **Weigh a same-key edit's scorecard lightly.** It compares two periods, not concurrent traffic, so anything else that changed in between, such as campaigns or seasons, is mixed in.
7. **Read new variants by their range.** A variant live for under two weeks, or whose signal is New or Early, is still ramping up under its cautious start. Its point estimate swings, so read its range, and say how it is starting rather than how it does.

Checking daily and acting on the first good day overstates every effect. Judge a slot after it has had its share of matured visits, not after a lucky morning.

## Act on it

Routing already does most of the work: once the model knows a variant is worse, it gets little traffic. So:
- **Retire** a variant that is clearly worse and not better for any kind of visitor. Its floor and random-slice traffic go to the others, and the slot gains room for a new idea.
- **Pause or retire at once a variant that is wrong:** off-brand, mistaken, or broken for everyone who gets it. That needs no evidence; say it was a judgment call. A variant that shows late, or for some visitors only, is a render to fix, not a variant to pause.
- **Promote** a clear leader. The control and every fallback then show it, new ideas are compared with it, and the measured gain so far is kept while measurement restarts against it.
- **Replace what you retire.** What the leaders have in common, such as an angle, a length or a tone, is the next hypothesis: write new variants that push it further, under new keys.
- **Make the code agree after every act.** `SKILL.md` gives the edit for each.

## Run the experiments for the person

When the person hands you the program, for instance "check in every week and do what you think is best", run it like a careful growth engineer:
1. **Keep to a rhythm,** weekly unless agreed otherwise. Learning is daily on Hobby and up to hourly on Pro, but evidence builds over days and weeks, so more frequent looks mostly see noise.
2. **Read the period.** `npx routingcat status --since <your last check>` lists what changed; `status` shows where things stand.
3. **Fix the health problems first,** or raise those you can't fix.
4. **Judge each slot and act,** as above. Then make the code agree.
5. **Keep each slot's live set at what its traffic supports,** and on Hobby the site's within its 10. Replace retired variants with new ideas built on the evidence, and open a new slot where the page's biggest open question is.
6. **Ship through the normal path:** declare, render, check with `?rc=`, `plan`, commit with the idea in the message, and deploy as the repository allows.
7. **Report briefly** each time:
   - what you changed;
   - why, with the evidence and its ranges;
   - what you expect to learn next.

Stay inside what the person reserved, such as the brand, claims, prices or pages they care about, and ask when a change would cross it.

## Prices and plans

- **Use a fixed share of 1.** It is a classic randomized test: each visitor keeps the same price across visits, and the scorecard gets a measured comparison. With routing on conversions instead, traffic drifts toward the cheapest price.
- **Add or drop a price without reshuffling the test.** A price you add takes its share, by its weight, from the others' visitors, and the rest keep the price they saw; pausing one moves only its own visitors. With `weights` declared, a new price they leave out weighs 0 and no one in the split sees it until you give it a weight.
- **Judge revenue yourself.** The objective is a conversion, and routing never weighs revenue. Judge a price on revenue per visitor shown it.
  - **A payment within the visit:** `show`'s other-outcomes line gives each variant's value per visit, as in `purchase 0.5%, $0.13 per visit`.
  - **A payment after a trial usually falls outside the visit,** and so outside every window, and RoutingCat can't credit it to a variant. Read it in the payment provider instead, by the price each variant carries. Stripe reports revenue by price; divide it by the visits `show` gives each variant. For the page's own objective, use the conversion the price moves, such as a trial start.
- **Carry the price in the variant,** such as its Stripe price id in a field, so the checkout charges what the page showed.
- **Show it on one page.** Pages route independently, so the same price shown on two pages could differ between them: test it on the page that shows it.
- **On a page the browser decides,** as on a script site, an arm a backend honors, such as a price, a discount, a shipping threshold or an offer, is a trade-off. Which arm a visitor gets is computed in the page from a public seed, so a determined visitor could pick the better one, while most visitors browse normally. Tell the person, then do what they choose. A page a server decides carries no such risk.
- **Remember it is the business's call.** Showing different prices to different visitors is a choice the business makes, and some markets regulate it.
