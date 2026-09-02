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

The CSS layer is built and gated. The React components over Radix are not
written yet, so today this is a stylesheet and a token contract rather than a
component library. `demo/states.html` renders every component in every state
with no JavaScript at all, which is also the standing proof that the CSS does
not need React to work.

## What is in it

Button, toggle, tabs, dialog, single-thumb slider, status badge, and a segment
readout. Two themes, `chrome` light and dark, swapped with `data-theme` on the
root.

The multi-thumb equaliser slider is deliberately absent. The WAI-ARIA APG's
own reference pattern flags unresolved touch and assistive-technology gaps in
the spec's own example, and that is not a fight worth picking in a first
version.

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

Body text holds 4.5:1. Focus rings, control boundaries and the filled part of
a slider hold 3:1. The bevel's outer frame is a control boundary and holds
3:1, because it is the thing that says where the control ends.

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
npm test              # the contract, and the sheets against their font data
npm run check         # the palette gate: contrast, tokens, one-off values
npm run check:runtime # the same, measured off the rendered page
npm run sprites       # redraw the readout sheets from the font data
```

`npm run check` reads files and takes about half a second. `check:runtime`
needs a Chromium and refuses to run without one, rather than skipping quietly.

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
