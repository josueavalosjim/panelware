# Changelog

## 0.1.0

First release. An accessible component kit with a chrome and LCD skin: Radix UI
owns the interaction, the ARIA and the focus management, and this owns the
surface.

Nineteen components. Button, toggle, toggle group, tabs, dialog, window chrome,
menu bar, transport, seek, slider, equaliser, list, form controls, status badge,
spinner, icon, and a segment readout. Three orthogonal axes as unanchored
attributes: `data-theme`, `data-skin`, `data-density`. One class per element and
no treatment classes in markup, so restyling is a token change rather than a
find and replace.

**The palette is measured, not asserted.** Sixty pairs across three themes are
checked from the declared tokens, ten more are measured off the rendered page
where a translucent layer would change the answer, and every colour actually
painted in the demo is checked against the ground it actually lands on: 3284
pairs across two pages and two themes. A fixture in the repo exists to fail, and
CI treats it passing as a build error, because a gate nobody has watched fail is
a gate nobody should believe.

**The bevel is 98.css's stacked-inset pattern with the offsets made scalar**, so
`--pw-bevel-depth: 0` collapses the whole treatment to nothing and the chrome
becomes an opt-out rather than a rewrite. Every offset is a `calc()` of the
depth; one literal pixel would leave a ghost edge at zero. Which of the four
bevel inks carries WCAG 1.4.11 differs by theme, so it is a separate role,
`--pw-bevel-boundary`, and the gate checks the role rather than a fixed token.
`--pw-color-divider` is the tier below it, for a line that groups rather than
bounds, and it exists because an audit found the set jumped from 1.24:1 to
4.29:1 with nothing in between.

**The icons are drawn, not imported.** Thirty-two 16x16 marks as bitmap rows
generated to one SVG sheet and applied as a mask, so the ink is `currentColor`
and an icon inside a button takes the button's colour including its disabled
one. Chevrons, `next` and `plus` are derived by exact rotations rather than
copied, because the hand copies had already drifted from the shapes they
claimed to be. The spinner is eight drawn frames rather than one glyph rotated:
only a quarter turn is exact on a square lattice, and resampled pixel art tears.

**The segment readout is a sprite font**, which is what Winamp's actually was,
verified against Strider's 1998 specification rather than against the modern
retellings of it. It renders an image of text, so it carries its string as a
name and defaults its live region off, because a clock that ticks once a second
is a screen-reader flood.

Motion animates `transform` and `opacity` only, never colour alone, and every
reduced-motion override repeats its selector in full, because a media query adds
no specificity and a reduced-motion pass that silently does nothing looks
exactly like one that works.

Every guard in the test suite was checked by planting the exact mistake it
claims to catch and confirming the suite goes red. A guard that cannot be made
to fail is not a guard.

Requires Node 22. React and Radix are optional peers: the stylesheet is usable
on its own, and `demo/states.html` renders every component in every state with
no JavaScript at all as the standing proof of that.
