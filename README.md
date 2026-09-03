# panelware

An accessible component kit with a chrome and LCD skin.

Most kits in this genre are decorative. They ship a convincing surface over a
div with a click handler, and the keyboard, the screen reader and the contrast
ratio are somebody else's problem. Most accessible primitive libraries are the
other half of that trade: the interaction is correct and the surface is a
neutral grey rectangle you are expected to design yourself.

panelware is the two halves put together on purpose. Radix UI owns the
interaction, the ARIA and the focus management, because owning those from
scratch is years of work that has already been done twice. This owns the
surface: stacked inset bevels, a Web 2.0 gloss, a sprite-sheet segment
readout, and a token contract a second skin can replace without touching a
component.

The palette is not asserted to be accessible. It is measured, in CI, by
`taste-check`, and there is a fixture in the repo whose whole job is to fail
so the gate is known to be working.

```bash
npm i @josueavalosjim/panelware
```

```js
import "@josueavalosjim/panelware/css";
```

```html
<button class="pw-button">Open</button>
<button class="pw-button" data-variant="primary" data-gloss><span>Save</span></button>
```

One class per element. No treatment classes in the markup, and nothing to
memorise: a component is styled by the class it already has, and restyling is
a token change rather than a find and replace.

## Status

The components are built and gated. `demo/index.html` runs them for real, and
`demo/states.html` renders every component in every state with no JavaScript
at all, which is the standing proof that the CSS does not need React.

Those two pages render the same DOM, deliberately, and a check compares their
geometry. A static page that positioned things more simply than the real
component would be verifying a shape that never ships.

## What is in it

Button, toggle, toggle group, tabs, dialog, window chrome, menu bar,
transport, seek, slider, equaliser, list, status badge, icon, segment readout,
and the form controls: checkbox, radio group, select, and the label they
share.

Two themes, `chrome` light and dark, and two densities, `comfortable` (44px
targets) and `compact` (32px). Skin, theme and density are three independent
attributes on any element, not just the root, so a dark toolbar inside a light
page is one `data-theme` away.

One deliberate break from the kit's own rules is worth knowing before you find
it: **the radio is round**, and it is the only round thing here. The shape is
what tells you a control is choose-one before you have read a word or clicked
twice, which is a convention doing semantic work rather than decoration.

There is an equaliser, and it is deliberately **not** a multi-thumb slider.

That was going to be the reason to leave it out: the WAI-ARIA APG flags
unresolved gaps in its own multi-thumb reference pattern. Building it found a
better reason to build it differently. A multi-thumb slider is a *range* — its
thumbs are the two ends of one span, and they are ordered. Give Radix three
thumbs at 20, 60 and 40 and drive the middle one up: it returns 20, 40, 100.
It re-sorted. The thumb being driven is now at a different index, and the
focused element reports a value belonging to a band nobody touched.

For a price filter that is correct, because "the low end" and "the high end"
are what the thumbs mean. For an equaliser it is unfixable, because 3kHz is
3kHz permanently and driving it up must not silently reassign it to 6kHz.

So the bands are separate sliders sharing a scale, a zero line and a frame.
Each keeps its own name and value, and none can renumber another.

Two costs, stated rather than hidden. Ten bands are ten tab stops, which is
the APG's own model and still a lot of stops. And on touch a vertical slider
captures vertical drag, which is also how a page scrolls, so the equaliser is
a region a finger cannot scroll through. No arrangement gives both gestures to
one area; keep it narrow and leave scrollable page either side.

## One trap the primitives set for you

Put no padding and no margin on `<body>`. Put them on a child.

Radix locks scroll with `react-remove-scroll`, and the moment a dialog or a
select opens it injects this:

```css
body[data-scroll-locked] {
  overflow: hidden !important;  overscroll-behavior: contain;
  position: relative !important;
  padding-left: 0px;  padding-top: 0px;  padding-right: 0px;
  margin-left: 0;  margin-top: 0;  margin-right: 0px !important;
}
```

Those zeroes are not a mistake. They are values computed to hold the layout
still where a classic scrollbar has just been taken away, and they are correct
when there is a scrollbar to make room for. With the overlay scrollbars that
macOS and iOS use there is nothing to compensate for, every value computes to
zero, and a page whose insets live on `<body>` loses them for as long as the
popup is open.

Three paddings and three margins. `padding-bottom` and `margin-bottom` are the
only sides the rule leaves alone.

This demo had 24px of horizontal and 32px of vertical padding on `<body>`.
Opening the select moved the page up 32px and left 24px, and made it 48px
wider. Above about 1072px a `max-width` absorbed the horizontal half, which is
what made it look intermittent. There is a lint for it in this repo's own
tests, because the failure only exists while something is open.

## The token contract

Five layers, in one cascade layer each, in this order:

```
pw.reset  pw.tokens  pw.treatment  pw.components  pw.overrides
```

`pw.overrides` is last and ships empty. It is yours:

```css
@layer pw.overrides {
  .pw-button { --pw-elev: none; }
}
```

Later layers win regardless of specificity, so that wins with one class and no
`!important`. There is no `!important` anywhere in this kit.

Colour roles borrow DaisyUI v5's names behind a `--pw-` prefix, so anyone who
has themed DaisyUI already knows what `base-200` means. The prefix is not
optional: DaisyUI and Tailwind both own the bare `--color-*` namespace, and a
kit meant to be dropped into either cannot squat it too. Everything that is
not a colour follows a plainer vocabulary instead, `--pw-space-lg`,
`--pw-duration-fast`, `--pw-radius-control`.

Every colour in the kit is a literal. None is derived with `color-mix()`, and
that is a constraint rather than a preference: the contrast gate cannot parse
a mixed colour, an unparseable pair is skipped, and a skipped pair reports as
a pass. DaisyUI derives its entire button treatment that way. This cannot.

## The bevel

The pattern is 98.css's, read from its source: two stacked inset box-shadows
as a raised and sunken pair, swapped on press. No `backdrop-filter` anywhere
near it. That is the documented jank primitive, it is worst on exactly the
fixed full-viewport element a dialog overlay is, and stacked shadows are cheap
precisely because they never touch the live-sampling blur path.

98.css writes its offsets as literals. Here they are multiplied by
`--pw-bevel-depth`, so one number flattens the whole kit:

```css
:root { --pw-bevel-depth: 0; }
```

At zero, every offset computes to `0px` with no blur and no spread, and the
stack paints nothing. `demo/states.html` has a panel that renders the kit at
depth 0 for exactly this reason, and it is the reason that panel exists: the
knob had been "verified" by reading the `calc()`, and it did not work at all.

Components never name the bevel. They assign one role-neutral slot:

```css
.pw-button        { --pw-elev: var(--pw-shadow-raised); }
.pw-button:active { --pw-elev: var(--pw-shadow-sunken); }
```

The slot is `--pw-elev` and not `--pw-bevel` because a skin with no bevel puts
something else in it, and a component file describing a treatment that is not
there is a rename that costs a major version.

## Contrast, and the one pair that is exempt

Body text holds 4.5:1. Control boundaries and the filled part of a slider
hold 3:1.

The focus indicator is **two rings in opposite values**, drawn adjacent, and
that is not decoration. A single ring is only ever as visible as the surface
behind it happens to allow, and this kit puts controls on a title bar painted
in the very accent the ring is drawn with. `--pw-color-focus` on
`--pw-color-primary` measured 1.00:1 in both themes: keyboard focus on a
window's close button was invisible.

Making the ring aware of what is behind it is not available to CSS. The ring
is offset outward, so it lands on the parent's surface rather than the
control's, and `currentColor` would give the control's own ink. Two rings
sidestep the question rather than answering it: whatever they land on, one of
the pair separates from it, and the two contrast with each other at better
than 9:1 so the boundary between them is an edge on any ground.

One of the bevel's four edges is the control boundary and holds 3:1, and
which one differs by theme. In light it is the dark bottom-right line; in
dark it is the light top-left one. `--pw-bevel-boundary` names whichever
edge carries it, and the gate checks that role rather than a fixed token.

That role exists because getting it wrong is invisible to a contrast checker.
The dark theme originally pointed the bottom-right edge at a light value so
it would clear 3:1 against a dark page. Every pair still passed, and the
light source had flipped to below the object: the shadow was the brightest
line on the control, so a raised control in dark and a sunken one in light
shared a signature. Only the ordering of the five values says it, so there is
a test for the ordering.

`--pw-color-divider` is the tier below that: a line that groups rather than
bounds, for a table rule or a section break. It exists because an audit
measured every token against the ground it actually lands on and found a hole.
Ranked by their weaker theme against the page, the set went from 1.24:1
straight to 4.29:1, so a soft line had a choice of invisible or full control
weight, and two stylesheets here had taken a third option and reached for a
bevel ink, which reads in light and vanishes in dark. The rung was in the ramp
already; only the role was missing. Light takes 3.05:1 on the page, dark
2.79:1, and the gate holds the tier to 2:1, which is this tier's own contract
rather than a WCAG number: 1.4.11 does not reach a line whose removal
identifies nothing.

The bevel's white inner highlight does not hold 3:1. It measures 1.47:1, and
that is deliberate. It is a shading cue on an interior edge, it identifies
nothing on its own, the control stays fully identifiable without it, and
raising it to 3:1 would mean a grey highlight, which is not a highlight.
`test/fixture/fail.tastecheck.json` is a config that checks that exact pair
and is expected to fail, so the exemption is recorded somewhere the build
would notice if it were quietly deleted.

Colour is never the only carrier of a state. A pressed control moves a pixel
and flips its bevel; a badge renders a glyph and a word rather than a coloured
dot; a hover moves opacity.

## What Radix owns, and what this had to add

Radix supplies the tabs' roving tabindex, both aria references and the arrow
keys; the dialog's focus trap, focus return and Escape; the slider's arrow
keys, Home, End and value clamping. None of it is re-implemented.

One thing Radix does differently from what an audit usually asks for, worth
knowing before you look for it: the dialog carries no `aria-modal`. Radix
marks the rest of the page `aria-hidden` instead, which achieves the same
containment with better support than `aria-modal` has ever had.

Three things Radix does not cover, which this owns.

The marquee ships a real pause button. WCAG 2.2.2 asks for a mechanism to
pause anything moving for more than five seconds, and pausing on hover is not
one: a keyboard, switch or touch user cannot trigger it. The paused state is
a three-value attribute rather than a boolean, because "running" and "nobody
has decided" have to be different: a viewer who presses resume while the
pointer is still over the readout, which is every mouse user who presses it,
would otherwise see nothing happen.

The dialog body takes a `tabIndex` when, and only when, it actually scrolls.
Chrome does not make scroll containers focusable on its own, so a long dialog
has content below the fold a keyboard user cannot reach. It is measured
rather than set unconditionally, which would add a dead tab stop to every
short dialog.

The slider takes a `format` function and turns it into `aria-valuetext`.
`aria-valuenow` alone is adequate only for a bare number: a screen reader
reading "70" for a gain in decibels has said nothing.

One deliberate trade rather than an oversight. A disabled slider follows the
platform and leaves the tab sequence, because that is what Radix's `disabled`
does and what a disabled native control does. The alternative, `aria-disabled`
with a read-only handler, keeps the control discoverable to someone tabbing a
panel, and an audit will usually prefer it. WCAG requires neither. If you want
the second, pass `aria-disabled` and handle the value yourself rather than
`disabled`.

## Writing a skin

The kit's whole claim is that a skin is a set of token values rather than a
fork, so here is the actual procedure. It is four files and no component
changes; if you find yourself editing something under `css/components/`, the
token you needed is missing and that is a bug worth reporting.

**1. Ship a complete set, not a diff.** Copy `css/tokens/semantic.chrome.css`
and `css/tokens/skin.chrome.css` and change the values. Every skin x theme
block declares every token, and that is not tidiness: `[data-theme="dark"]`
and `[data-skin="yours"]` are both (0,1,0), so a block that only carries
differences loses a specificity tie to whichever came later in the bundle,
silently, and only for the tokens it left out.

**2. Use literals.** No `color-mix()`, no `oklch(from …)`. The contrast gate
cannot parse either, an unparseable pair is skipped, and a skipped pair
reports as a pass. This is the constraint most likely to be violated by
someone helpful, because it is DaisyUI's idiom and what most autocomplete
suggests.

**3. Put your elevation in `--pw-elev`.** Components read that one slot and
never `--pw-shadow-raised`. If your skin has no bevel, set
`--pw-bevel-depth: 0` and every offset collapses to nothing, then assign
whatever you do have — an outer glow, a hairline — to `--pw-elev`. The slot
carries outer shadows as happily as insets.

**4. Turn off what you do not want with tokens, not markup.**
`--pw-gloss-opacity: 0` silences every `[data-gloss]` in every consumer's
markup at once. Removing the rule instead would leave a dead attribute
scattered through code you do not own.

**Three hooks exist for skins that are not this one**, do nothing today, and
are the reason a notched or textured skin is a token change rather than a
rewrite: `--pw-clip-control` and `--pw-clip-box` for corner geometry a scalar
radius cannot express, and `--pw-texture` with `--pw-texture-opacity` for a
surface pattern.

**Then check it.** Add your theme to `tastecheck.config.json`'s `themes` array
and run `npm run check`. Every pair is measured against your values, and a
token your skin forgot to declare is a hard failure rather than a silent
fallback. `npm test` will also hold your blocks to declaring the same token
set as every other, and will tell you if your bevel ends up lit from below.

## Motion

Only `transform` and `opacity`. The bevel flip is not transitioned at all,
which is both correct (`box-shadow` is a paint property) and accurate to what
a real bevelled button did: it snapped.

Under `prefers-reduced-motion`, durations drop to 1ms and the state changes
stay. The press still moves a pixel, because that pixel is the affordance.
Only continuous motion, the readout's marquee, stops outright; a marquee at
1ms is not a reduced marquee, it is a strobe.

DaisyUI transitions `background-color`, `border-color`, `box-shadow` and
`transform` together for 0.2s. This does not, and someone diffing the two
deserves to know it was a decision.

## The readout

The obvious modern assumption about Winamp's display is wrong, and it is worth
saying because it changes the implementation. It was never per-segment
rendering. It was a bitmap sprite font: Strider's 1998 skin specification
documents `numbers.bmp` at 9x13 pixel digit cells and `text.bmp` at 5x6 glyph
cells, and the player stepped an offset across one image.

So this steps an offset across one sheet. The sheets are generated from
`assets/lcd-font.mjs` rather than drawn, so the letterforms stay editable, and
they are applied as a `mask-image` rather than a background image, so the ink
is `--pw-color-lcd-content` and the contrast gate can measure it.

The visible readout is a picture of text and gives assistive technology
nothing, so the component renders the real string into a visually hidden span
beside it. One span with `04:21` in it, never one per character. The live
region is off by default, because a clock announcing itself once a second
makes the rest of a page unusable.

## Development

```bash
npm run generate      # sheets, icon index, stylesheet bundle, docs data
npm run build         # generate, then tsc
npm test              # compile and check, WITHOUT regenerating
npm run check         # the palette gate: contrast, tokens, one-off values
npm run check:runtime # the same, measured off the rendered page
npm run serve         # the demo, on 4173, with Cache-Control: no-store
```

`npm test` deliberately does not regenerate. Several tests compare a
committed artifact against what its source produces, and running the
generators first would rewrite the artifact immediately before the
comparison, which is how every one of those tests silently stopped being able
to fail for one commit.

`demo/index.html` is the documentation: live components, a switcher for all
three axes built out of the kit's own ToggleGroup, the copy-paste source for
every example, the full token table, and every contrast pair with the ratio
the gate measured. `demo/states.html` is the same components with no
JavaScript at all.

`npm run check` reads files and takes about half a second. `check:runtime`
needs a Chromium and refuses to run without one, rather than skipping quietly.

Serve the demo with `npm run serve` rather than any other static server. The
one thing it does that matters is send `Cache-Control: no-store`, and it was
added after a fixed layout bug was reported as still broken: the file on disk
was right, a fetch of the same URL returned the fix, and the browser was
painting a stylesheet from before it. Nothing else in this repo can see that,
because every other check reads the file or drives a fresh browser.

Several tests guard things that fail silently rather than loudly: a theme
missing a token, a bevel offset written as a literal, a `color-mix()` the gate
cannot parse, a bevel lit from the wrong side, a visual state with no ARIA
twin. Each was checked by planting the exact mistake it claims to catch and
confirming the suite goes red, because a guard that cannot be made to fail is
not a guard.

## Prior art

98.css and NES.css are where the bevel technique comes from, and 98.css's
source is the direct reference for the shadow pairs. DaisyUI is the precedent
for splitting structural tokens out of the palette rather than folding shape
into colour. 8bitcn and RetroUI are the proof that genuinely different visual
languages ship on Radix's primitive layer rather than only palette recolours.

Windows, Winamp, Aqua, Aero and Luna are cited here as sources and prior art.
None of them is affiliated with this, in the same way NES.css cites Nintendo
without being Nintendo.

## Licence

MIT
