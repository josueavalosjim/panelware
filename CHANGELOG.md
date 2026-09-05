# Changelog

## 0.1.3

Two gates that reported green without having looked.

The parity check compared the shapes on `demo/states.html` and
`demo/index.html` as strings, and an element that is not on the page measured
as nothing. Two nothings agreed, so a component deleted from both pages left
the check green while it claimed to be comparing it. Deleting the badge from
both pages is now two failures rather than a pass. Its only liveness test was
a single slider sentinel, which is now the same control count the other four
page checks use, and its report line was an expression that could only ever
print `all`, so it never said how many shapes it had compared. The comparison
is a pure function with tests on it now, because that is where the bug was and
a page-driving check cannot be tested by driving pages.

A tag push ran `npm test` and the palette check and nothing else. Overflow,
parity, colour, CSSOM and axe gated `main` and pull requests only, so a release
could ship with a red axe run. The publish workflow calls the test workflow now
rather than restating a shorter version of it, because a second list is a list
that drifts, and what had drifted off the first one was every check that needs
a browser.

`prepublishOnly` regenerates the stylesheet bundle, the token sheet, the icon
index and the docs data after every check has finished, which made the bytes in
the tarball the one artifact nothing had verified. That is structurally how
0.1.0 shipped broken, moved one step later. CI builds first and asserts the
committed files are byte-identical to what the generators produce, so that
rebuild is a no-op that has been proved to be one.

The fixture that must fail, which is what certifies the contrast gate measures
anything, was in both workflows and in neither the release script nor anyone's
hands. It is `npm run check:gate` now and runs in all three.

### Documentation that described something else

`--pw-depth` was declared, documented as the scalar that flattens the kit,
published in the demo's token table, and read by nothing. Its own comment said
"see `css/treatment/bevel.css` for what actually reads this" and that file did
not. It multiplies with the skin's own `--pw-bevel-depth` now, derived in the
component block rather than on `:root` so setting it on a subtree works.
`--pw-depth: 0` collapses the bevel offsets to zero, which is what it always
claimed to do.

Twelve other tokens are declared and unread, and most of them are fine: a
scale is allowed to be complete before every rung has a user, and two exist to
be measured by the contrast gate rather than painted. A test holds every token
to being read or being on a list with a reason, in both directions, so a new
dead token fails until somebody writes down why it is there and a listed one
comes off the list when it gains a reader.

`assets/README.md` gave the transport ink as 49, 72, 81 with a 9x9 square. It
is 56, 72, 64 with an 8x8 square, and a 9x9 square would fail the even-size
test in the same suite: the README documented a mark the tests forbid. The
paragraph opens by warning that it is "the kind of thing that gets corrected
later", which is what made the wrong numbers expensive. They are asserted
against the drawing now.

Two more comments described drafts rather than the drawing: `check`'s row
profile is 3 3 3 6 6 5 3 and not 2 2 2 4 4 4 2, which matters because the real
profile's ratio is exactly 2.00 against an assertion of `<= 2`, so the stale
numbers made a knife-edge look roomy. And `search` is 11x12 rather than
"filling the 12x12 live area exactly".

One test was reading its own subject's comments. The check that the bevel
derivation is not on `:root` searched the raw file, so writing a paragraph
explaining why the derivation is not on `:root` turned it red. It strips
comments now, because a guard a comment can break is a guard people learn to
edit around.

### Three guards that could not catch what they were written for

None of these was a product bug. All three were tests that pass while the
thing they describe is broken, which is worse, because a green run is what
everything else here is built on.

The bevel-literal guard tested `/\binset\s+-?\d/`, which only ever looks at
the token immediately after `inset`. A literal in the Y slot went straight
through, and a ghost edge at depth 0 is exactly what the test exists to
prevent. It asserts the shape of every layer now: `inset` plus three `var()`
references and nothing else.

The ARIA-twin guard counted occurrences of `[data-state]` and `[aria-*]` across
a file and compared the totals, which agree at zero. Deleting every state rule
from a component left it quiet. It now checks each selector list carries both,
and holds each file to a floor.

The gloss `:active` guard matched a whole selector list as one string, so one
member naming a `button` satisfied it for every other member, including the
unscoped container selector it exists to prevent. It splits the list and
checks each member.

That last one is a shape rather than an incident: a guard matching a selector
list as one string has probably stopped working. The splitter is shared now,
and it is parenthesis-aware, because `:where(button, a[href], ...)` is full of
commas that do not separate members.

### A Spinner in a Badge was pulled into the word beside it

Every icon declares how much blank sits inside its cell on each side, and a
badge turns those into negative margins so the optical gap beside a word is
even. `Spinner` names one cell and paints eight, because the CSS walks the
whole row, so the cell's bearings describe a frame that is on screen an eighth
of the time. It named `spinner-1`, whose ink starts 7 in, while the frames it
mostly paints start 2 in: measured in the browser, a spinner in a badge got
`margin-left: -7px` where `-2px` was right.

It declares the tightest bearing common to all eight frames now. Animating
them frame by frame would be the wrong repair: the dots rotate and their
extremes move, so a per-frame bearing would shuffle the element sideways eight
times a second next to fixed text, and a busy indicator has to sit still.

`Icon` merges a caller's `style` rather than writing its own over the top. It
had been accepting the prop, spreading it, and then clobbering it silently.

### A documented skin hook broke the checkbox and the radio

`--pw-clip-control` is offered in "Writing a skin" as the way to give the kit
notched corners. `clip-path` clips an element's outline and its
pseudo-elements along with its corners, and the checkbox and the radio each
draw their hit area as a centred `::after` and their focus ring as an
`outline`. Setting the hook collapsed both targets to their 20×20 boxes, under
WCAG 2.5.8's 24×24 and well under the 44 this kit asks for, and squared off
the radio whose roundness the README calls semantic.

The slider thumb had been given the opt-out for exactly this reason, with the
reasoning written down. The checkbox and the radio had the identical
construction and had not.

Two guards. `check:a11y` sets a notched polygon the way a skin would and
hit-tests each control from its centre, which is the only way to see a bug
that exists solely in a skin nobody has written yet. And a test holds every
control built with a centred hit expander to the same exemption, keyed on the
construction rather than on a list of names, so a fourth one fails on the day
it is written rather than on the day someone writes a skin.

One assertion was dropped for being unfalsifiable. Checking that the hook did
not change `border-radius` reads well and can never fail, because a clip
paints over a radius without altering the computed value. The falsifiable form
of the same concern is that the hook did not reach these controls at all.

### Every List painted a focus ring at mount

`.pw-list-item[data-active]` drew the focus outline with no condition on it,
and `List` seeds its active row in the state initialiser so
`aria-activedescendant` has a row to point at from the first render. Between
them, every list on the page carried a 2px focus ring before anyone had
touched anything. `reset.css` states the opposite as this kit's own rule,
three files away.

The ring is conditioned on the list having visible focus now. The condition
sits on the container because the container is what takes focus: `.pw-list`
carries the tabindex and the `aria-activedescendant`, and the rows are not
focusable at all.

Nothing could see it. axe does not mind a ring, the contrast gate measures one
happily, and both demo pages were wrong in the same way so parity agreed with
itself. Two guards now, and both were watched failing: a test that scans the
bundle for any focus outline drawn without a `:focus-visible` condition, and a
browser check asserting the ring is absent at rest and present once the list
has keyboard focus. The second half matters as much as the first, since
deleting the rule outright fixes the complaint and removes the feature.

### A Window was not a region

`<Window>` rendered a `<section>` with an `<h2>` inside it and no
`aria-labelledby`, and a heading inside an element does not name the element.
A `<section>` with no accessible name is not an unlabelled region: it is not a
region. The browser's accessibility tree gave the whole window
`role="generic"` with an empty name, while the prop doc one line above
promised "an unlabelled region". It was not even that.

The section is named by its own title bar now. The title's heading level is a
prop, `titleLevel`, defaulting to the 2 it was hard-coded to: a component that
can be placed anywhere cannot know its own level, and the demo's windows sit
under section headings, so they are 3s.

axe had nothing to say about this and never will, because a nameless section
is not a landmark it can find fault with. So `check:a11y` reads the computed
role and name out of the browser's accessibility tree for the elements the kit
claims are named regions, which is the only measurement that answers whether a
screen reader would say anything. `<Window>` had no unit tests at all; it has
six now, covering the wiring that name depends on.

### An uncontrolled Slider announced the wrong number

`Slider` computed its `aria-valuetext` from `value ?? defaultValue`. That is
right for a controlled slider and frozen for an uncontrolled one, because
`defaultValue` never changes: Radix moved `aria-valuenow` on every arrow press
while the formatted text stayed at the value the slider mounted with. This is
not a degraded announcement but a wrong one, since `aria-valuetext` wins over
`aria-valuenow` in every screen reader. Measured before the fix, three presses
took a slider from 70 to 73 while it kept announcing "20 decibels".

The component keeps its own copy of the value now and reads the caller's when
there is one. `format` follows the thumb in both control modes.

It survived a suite that asserts on `aria-valuetext`, because that test
renders statically and every formatted slider in the demo was controlled: the
kit demonstrated only the arrangement in which the bug cannot appear. The demo
shows the uncontrolled one now, and `npm run check:interaction` drives both
from the keyboard. It is the sixth page check and the first that presses a
key, which is a gap rather than a feature: `browser.mjs` had no input
primitive, so no check here had ever seen a component after it was used.

## 0.1.2

Documentation only. No code changed, and the release exists because npm renders
the README from the latest published version, so prose that is not published is
prose nobody reads.

The README now covers the two errors a consumer meets first and neither of
which it mentioned before. Importing the module without the optional peers
gives `ERR_MODULE_NOT_FOUND` for react, which is the package working as
designed and saying so badly. Requiring it gives
`ERR_PACKAGE_PATH_NOT_EXPORTED`, because the package is ESM only and there is
no CJS build coming in v1. Both are quoted with the exact text a search box
would be given, and both were re-verified against the published 0.1.1 rather
than the working tree.

A test holds the README and package.json to agreeing about which module system
this is. It does not assert the package should stay ESM only: a CJS build in
future fails it as a reminder to update the prose, not as a veto.

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
