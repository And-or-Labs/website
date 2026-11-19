---
name: And/or Labs
description: A drawing-sheet site — editorial, evidence-first, quietly priced.
colors:
  ink: "#0b1533"
  blue: "#1b4dff"
  blue-ink: "#1238c4"
  coral: "#f0764f"
  coral-ink: "#c2410c"
  green: "#19b37a"
  green-ink: "#0e7a52"
  lilac: "#7c5cff"
  lilac-ink: "#5840bb"
  butter: "#f2b705"
  butter-ink: "#8a6500"
  pink: "#dc6bad"
  pink-ink: "#a8327a"
  paper: "#f6f6f3"
  white: "#fbfbf9"
  dim: "#5a6482"
  faint: "#69738e"
  sky: "#eef3ff"
typography:
  display:
    fontFamily: "Newsreader, Georgia, 'Times New Roman', serif"
    fontWeight: 400
    fontSize: "clamp(28px, 2.4vw, 40px)"
    lineHeight: 1.12
    letterSpacing: "-.035em"
  body:
    fontFamily: "Newsreader, Georgia, 'Times New Roman', serif"
    fontWeight: 400
    fontSize: "15px"
    lineHeight: 1.7
  label:
    fontFamily: "Departure Mono, ui-monospace, 'SF Mono', Menlo, monospace"
    fontWeight: 400
    fontSize: "12px"
    lineHeight: 1.5
    letterSpacing: ".06em"
    textTransform: "uppercase"
  mono:
    fontFamily: "Paper Mono, ui-monospace, monospace"
    fontWeight: 400
    fontSize: "14px"
    lineHeight: 1.5
rounded:
  sm: "4px"
spacing:
  pad: "clamp(24px, 4vw, 56px)"
  card: "16px"
  section-gap: "12px"
  measure: "42rem"
components:
  cta:
    backgroundColor: "#1b4dff"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    border: "1px solid {colors.ink}"
    shadow: "2px 2px 0 {colors.ink}"
    padding: "0 14px"
    font: "13px/1 {typography.label}"
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    shadow: "inset 0 1px 0 #ffffff40, 0 0 0 1px {colors.blue-ink}, 0 8px 18px -8px #1b4dffa6"
    padding: "0 20px"
    font: "13px {typography.label}"
  button-ghost:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    border: "inset 0 0 0 1px {colors.ink}"
    padding: "0 20px"
    font: "13px {typography.label}"
  card:
    backgroundColor: "{colors.white}"
    border: "0"
    shadow: "{shadow.lift}"
    padding: "{spacing.card}"
  input:
    backgroundColor: "#ffffff"
    border: "1px solid {colors.ink}"
    borderRadius: "0"
    padding: "0 14px"
    fontSize: "15px"
    fontFamily: "{typography.mono}"
---

# Design System: And/or Labs

## Overview

**Creative North Star: "The Drafting Board"**

The site reads as a precision instrument set on paper: ruled guides, bracketed proof, and everything measured against a 120px grid rather than a mood. Layout is a fixed drawing sheet — one left pane for the case, one right pane for a persistent figure that morphs per page, and a bottom bar that holds the call to action plus contact icons. Copy is evidence-first (bylines, press, revenue figures) and deliberately withholds the punchline until you lean in: the offer price is exact in public, but everything around it is progressive disclosure.

The system is **measured and slightly secretive** — understated, field-tested, and quiet at first glance. Motion is present but subordinated: hover states ease on a long cubic-bezier, the persistent figure redraws, and the bottom bar replies to touches, but no element reads as decorative. Two typographic voices carry the whole system: a serif (Newsreader) for every editorial decision and a mono (Departure Mono, later Paper Mono) for labels, bracketed numbers, prices, and the structural scaffolding that frames the content as data.

**Key Characteristics:**
- Editorial diagram over advertising: ruled guides, bracketed proof, ledger rows.
- Evidence before adjectives — career outcomes and bylines land before capability claims.
- One front door; each line of work owns its route and a persistent figure.
- No em dashes and no exclamation marks in any copy.

## Colors

A diagram-on-paper palette: warm off-white grounds, a single dominant blue, five accent tones reserved for the lines of work, and a grey-neutral pair for scaffolding. Accents are rare and functional — they mark active state, current work, or proof value, never decoration.

### Primary
- **Diagram Blue** (#1b4dff): The dominant structural color. It owns the frame border, the primary CTA, selection outlines, the active menu state, and text-link color on prose. Chosen as the single rule that binds the drawing sheet.
- **Diagram Blue (Deep)** (#1238c4): The hover and pressed state for Diagram Blue elements, plus inline link color in prose. Never used as a surface.

### Secondary
- **Coral** (#f0764f): Reserved for error states and accent pressure where blue would be missed (form error copy, negative feedback).
- **Green** (#19b37a): Success feedback only — form-success output, copied-state confirmation.

### Tertiary
- **Lilac** (#7c5cff) / **Lilac Ink** (#5840bb): Not currently deployed in the live site; carried as a defined accent for future lines of work per the menu palette.
- **Butter** (#f2b705) / **Butter Ink** (#8a6500): Not currently deployed; carried for the same reason.

### Neutral
- **Paper Grey** (#f6f6f3): The page ground, warm and flat (Paper Mono round; also carries a faint 24px blueprint grid). Reads as drafted stock, not white.
- **White** (#fbfbf9): The sheet surface inside the frame — panes, cards, form fields. Slightly warmer than pure white, sets it off Paper Grey.
- **Ink** (#0b1533): Body text, headlines, borders, secondary-button strokes. The structural dark.
- **Dim** (#5a6482): Secondary copy — metadata, labels, lede support, bylines. Reads a step below Ink in the hierarchy.
- **Faint** (#69738e): Tertiary scaffolding — idle bracket numbers, overflow markers, the least prominent meta.
- **Sky** (#eef3ff): Input-field background, hover-band color (via color-mix of Blue), code-block background.

### Named Rules
**The One Accent Rule.** Diagram Blue is the only color used for structural chrome (frame, CTA, active state, selection). Accent tones (Coral, Green, Lilac, Butter, Pink) are assigned per line of work and used for active-menu color, current-row markers, and proof accents — never for decorative chrome.

## Typography

**Display Font:** Newsreader (Georgia fallback)
**Body Font:** Newsreader (Georgia fallback)
**Label/Mono Font:** Departure Mono (ui-monospace fallback); Paper Mono used on the Paper Mono round (historical variant, documented below)

**Character:** The pairing is editorial but indexed — a newspaper serif for the argument and a typewriter mono for the filing. The mono carries all structural meaning: bracketed numbering, prices, key values, timestamps, labels. The serif carries the persuasion.

### Hierarchy
- **Display** (400, clamp(28px, 2.4vw, 40px), line-height 1.12, letter-spacing -.035em): Page h1 in document and listing variants; home hero headline. Rarely italic; when a display is italic, the accent is held to Diagram Blue only.
- **Body** (400, 15–17px, line-height 1.55–1.7): Reading copy and ledes. Prose pages run 15px/1.7; home ledes run 17–20px.
- **Title** (400, clamp(36px, 4vw, 60px), line-height 1.05, letter-spacing -.022em): Legacy legacy-size tier, still used inside document panes on narrower columns.
- **Label** (400, 12px, letter-spacing .06–.14em, uppercase): Every piece of structure — section numbers, menu keys, prices, timestamps, breadcrumbs, form labels, brackets.
- **Mono / Display-Mono** (400, 14px, line-height 1.5): Paper Mono round — long-form body and reading text set in a mono with bracketed margin guides instead of paragraph indentation.

### Named Rules
**The Bracket Rule.** Monospace labels, prices, and values are bracketed (via `[n]` or bracket glyphs) rather than hyphenated — the filing, not the footnote.

## Layout

The site is a **drawing sheet**: a `1488px`-max `.sheet` wrapping a `.frame` with three persistent zones. On desktop, `.frame` is a two-column grid (`1.35fr` content pane + `1fr` figure pane) with a sticky top bar, a sticky bottom bar, and a full-height right `aside.viz` that holds the page figure. On inner pages the content pane carries a 120px blueprint grid; on the home the figure hides behind the visitor-briefing paper sheet (which itself sits on whole 120px cells).

- **Container:** `.sheet` max-width 1488px, padding `clamp(24px, 4vw, 56px)` inline.
- **Density:** Compact by design — min-height 44–48px on interactive rows, no cards float, borders do the lifting.
- **Responsive breakpoints:** ≤860px the frame collapses to a single column with the figure moving above content (180–220px); ≤560px the bento/listings stack; ≤480px dense panels reduce padding to 20px.
- **Decoration density:** Low. Two border rules per frame (1.5px blue + 1px outline), one 1px hairline per menu row, one eyebrow rule. No fill gradients except on CTA.

## Elevation & Depth

**Flat-and-layered.** Surfaces are flat (white on paper); depth is almost entirely conveyed through the 1px structural outline around every frame element plus one subtle `box-shadow` tuple (`.lift`). There are no floating cards — cards sit flush, and depth is read as containment, not height.

The shadow vocabulary is one tuple:
- **Sheet lift** (`0 0 0 1px var(--rule), 0 1px 1px #0b153308, 0 2px 4px -1px #0b15330a, 0 10px 20px -12px #0b153324`): The only ambient lift. Applied to `.card` and `.pkg`. Contains the surface, does not detach it.
- **Board shadow** (`4px 4px 0 var(--blue)` / `4px 4px 0 var(--ink)`): The paper sheet and CTA shadows. Hard-edged, offset, pure offset — reads as a desk cutout, not a soft elevation.

### Named Rules
**The One Shadow Rule.** Only two shadow forms exist: the soft `.lift` tuple for sheets/cards, and a hard 4px offset for the visitor-briefing paper sheet and the CTA. No third shadow is introduced.

## Shapes

**Square-first.** The system is aggressively rectangular: form fields, cards, buttons, and the menu all use 0–4px radius. Corners signal material, not friendliness — the brand mark is the only 7px rounded object (the SVG rect). Bracket glyphs (`[`, `]`) are the recurring punctuation, framing menu keys, bracketed partners, and numbers.

- **Radius:** 4px maximum, mostly 0. `.cta` is 4px; `.card`, `.pkg`, `.shot-card` are flat.
- **Borders:** Hairlines everywhere — 1px structural, 1px hair on menu rows, 1.5px + 1px on the frame. No borders thicker than 2px.
- **Outline art:** The 120px blueprint grid, 1px blue hair, and `box-shadow: inset` focus rings substitute for drop shadows as the layering mechanism.

## Components

For each component, character first, then shape and state.

### CTA (primary, one shared component)
- **Shape:** 4px radius; 1px dark border; hard 2px offset shadow.
- **Primary:** Diagram Blue background with a faint top highlight inset; white Departure Mono label; arrow glyph (↓ internal / ↗ external). Padding `0 14px`, min-height 40px.
- **Hover / Focus:** Translates −1px/−1px, shadow grows to 3px 3px 0 ink (hover), focus ring is Diagram Blue 2px offset 3px.
- **Sub-flavour:** The header CTA splits into two segments (label + meta) separated by a left border and reads as one elongated command.

### Buttons (generic .btn, ghost family)
- **Shape:** 4px radius max; hard border inking; flat white.
- **Primary:** Diagram Blue background with multi-layer inset shadow (inset highlight + deep blue border); hover deepens to blue-ink and lifts 1px with a larger soft shadow. Press scales to .96.
- **Ghost/Hover (non-primary):** Inverts — background becomes Ink, text white; hover only where a real pointer can hover (touch taps leave sticky states).

### Cards (.card, .pkg, .shot-card)
- **Corner Style:** 0 radius (flat).
- **Background:** White (or white-to-faint gradient, then solid white on the Paper Mono round).
- **Shadow Strategy:** The `.lift` tuple — one tuple, ambient.
- **Border:** None by default; `.pkg`/`.shot-card` get a 1px ink border on the Paper Mono round.
- **Distinctive detail (default round):** A 10px dashed crosshair + 1px diagonal lintel inside `::before`, in the current accent color, one line + one column. Removed on the Paper Mono round.
- **Internal Padding:** 16px (card), 14–16px (tile/proof).

### Inputs / Subscribe form
- **Style:** White field, 1px solid ink border, 0 radius, Departure Mono 15px.
- **Focus:** Outline 2px Diagram Blue, offset 2px (via `:focus-within` on the form).
- **States:** Submit button is ink background, white ink mono uppercase; hover turns blue; active turns blue-ink. Success/fail output is green-ink / coral-ink (no color for the neutral).
- **iOS note:** On mobile the input font size is forced to 16px to prevent zoom.

### Menu (.menu, the page's main line-of-work links)
- **Style:** Bordered full-width rows; bracket `[n]` + serif title + mono go-arrow; dimmed numbers.
- **Default / Hover / Active:** Idle rows are bare; on hover/active the bracket and go-arrow take the current line color (`--c`), a dashed `--c` leader extends from left, and a blue-tinted `color-mix` background fills the row.
- **Distinctive:** On desktop, a `transform: scaleX(1)` dashed leader sweeps in from the left edge at hover.

### ItemNav (lines of work, mobile + listing variant)
- **Style:** Inline mono links with `[n]` bracket, 40px min-height. Current page gets an inset bottom bar in its line color and ink text; others are dim.
- **Mobile (≤860px):** Stacks as a full-width bordered index with thumb-sized (48px) rows; current row gains left inset 12px + inset left bar.
- **Desktop inner pages:** Hidden (rows move into the sticky topbar `.topnav`).

### Section (.sec-h, .Section)
- **Style:** 12px mono uppercase label, `.08em` tracking, with a flex rule (`gradient(90deg, var(--rule), transparent)`) extending to the right; an optional 2-digit count sits in the line color after the label.
- **Distinctive:** The count is two-digit zero-padded and tinted to the section accent.

### Navigation (topbar + crumbs)
- **Topbar:** Sticky, blurred paper background (90%), 1px blue-ink bottom border; brand mark left (the 7px rounded SVG with a slash), `Book a call` CTA right; inner-page topnav links in mono with an underline-active (2px, offset 8px).
- **Breadcrumbs:** `[Esc] Index / Page` — mono uppercase, dim, the Esc prefix visible but aria-hidden; the current page is ink, bold in `:here`.

### Briefing (visitor briefing, home only)
- **Style:** A paper sheet filling the right pane edge to edge with a dot-matrix printer front; printed facts in Paper Mono; ink border plus a hard 4px 4px 0 Blueprint Blue shadow. On desktop it occupies 6 × 120px grid cells so its edges land on guide lines.
- **Distinctive:** Hidden on non-home pages; on home it replaces the persistent figure until dismissed.

## Do's and Don'ts

### Do:
- **Do** bracket everything structural with mono and a `[n]` index — menu keys, line-of-work numbers, press tokens, byline outlets.
- **Do** route every primary CTA through the single `Cta` component; the header and page CTAs share one source so they cannot drift.
- **Do** keep the page on ruled guides — the 120px blueprint grid is the layout's coordinate system, not decoration.
- **Do** let the persistent figure (`aside.viz`) morph per page via `data-fig` and `tone()`; the figure is bound to the line of work's accent.
- **Do** use the `--c`/`--ct` pair (set per page via `tone()`) for any state color tied to a line of work, never a hard-coded color.
- **Do** keep the offer exact and the context progressive — visible price on FDM, everything else behind disclosure.

### Don't:
- **Don't** use Diagram Blue for decorative fills or backgrounds — it is structural chrome only.
- **Don't** add a third shadow form. The `.lift` tuple and the hard 4px offset are the whole vocabulary.
- **Don't** add em dashes or exclamation marks to any copy — neither belongs in this system.
- **Don't** split a CTA label from its arrow; `Cta` owns both, and they encode internal vs. external intent.
- **Don't** introduce rounded corners below 4px or above 4px anywhere — the system is square-first.
- **Don't** let a hover state use `color-mix` against a dark surface on touch devices — hover is gated by `@media (hover: hover) and (pointer: fine)`.
- **Don't** hard-code a line-of-work color in a component — pass `tone(color)` and let `--c`/`--ct` carry it.
