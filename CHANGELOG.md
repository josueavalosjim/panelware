# Changelog

## 0.1.1

The stylesheet shipped in 0.1.0 was broken, and most of the kit was unstyled.

One extra `}` in `tabs.css` closed `@layer pw.components` early and orphaned
every rule after it. Eleven rules reached the browser's CSSOM instead of 289.
The window chrome, the transport, the seek bar, the list, the menu bar, the
equaliser, the form controls, the readout and the badge all rendered with no
rules behind them. Anyone who installed 0.1.0 got a stylesheet that parses to
almost nothing.

I introduced it while repairing a malformed media query in the same file, and
every check in the repo went green over it. The tests match selectors as text
and the text was present. `taste-check` reads declarations and the
declarations were fine. The colour check measures what is painted, and an
unstyled element still paints something. The parity check compares the two
demo pages, and both were broken identically, so they agreed with each other.
Nothing in the toolchain parsed the CSS, which is the product.

Two checks now do. Every stylesheet has to close every block it opens, which
is cheap enough to run on every commit and catches exactly this. And every
class the kit renders has to match a rule the browser actually kept, which
catches the ways a parser drops a rule that brace counting cannot see.

The second one found two more the day it was written. `demo/states.html` built
its dialog title bar out of three class names that no stylesheet defines, so
that title bar had been unstyled since it was written, and it drew its close
mark as a text glyph rather than the sprite icon, which is the exact thing the
badge stopped doing months ago. And `.pw-radio-group`, which the component
emits on every radio group, had no rule anywhere.

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
