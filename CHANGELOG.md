# Changelog

## 0.7.1

One visual fix, found by looking at the screen rather than by any gate.

### The equaliser's zero line was eight pixels low

The rule every band is read against was not level with the bands. It drew at
80px while the fader sitting on zero drew at 72px, on the one component whose
whole reason for existing is that you can see which bands are cut and which are
boosted without reading a number.

The rule is a pseudo-element on `.pw-eq-well`, and the well is taller than the
fader travel by a label row. It took its fraction of the well rather than of the
travel, so it landed half a label row plus half a gap too low.

Everything around it was right, which is why nothing caught it. The markup was
correct, every rule matched, the contrast gate was happy, and the thumb and the
fill agreed with each other: Radix positions the thumb along the track and
`.pw-eq-fill` lives inside the track, so both were fractions of the travel
already. Only the line drawn between them was measuring a different box.

`--pw-eq-zero` is now a unitless fraction rather than a percentage, so the label
row can be taken off before it is applied. `--pw-eq-label-space` is the band's
gap plus the label's own height, derived from the two tokens the layout actually
uses rather than stated as a number, because both move per skin: the label sets
`line-height: 1` on `--pw-text-micro`, so its height is that token. Under `cyber`
the rule lands half a pixel off where it does under `chrome` and the thumbs
follow it there, which is the derivation working rather than a coincidence.

`check:cssom` now measures the rule against the band on zero under every skin.

**If you set `--pw-eq-zero` yourself**, it takes `0.5` where it used to take
`50%`. It is set inline by the component and is not a documented knob, so this
is a patch rather than a break, but it is the one value that changed shape.

### Internal

The dev server aliased `/` to `demo/index.html`'s content, so the document URL
stayed at `/` and the demo's `fetch('./docs-data.json')` resolved one directory
too high and 404ed. Three console errors on every local visit to the bare port,
reproducible nowhere else, because Pages serves the real `index.html` there and
its redirect leaves the base URL correct. `/` serves `index.html` now, the same
as Pages. Nothing in the published package changes.

## 0.7.0

A fifth cascade layer, so a skin can change shape rather than only colour, and
the first three sprite sheets to differ from one another.

### `pw.skin`, and what a skin still may not do

Every component in this kit was drawn for the chrome skin, and the other two
were that structure recoloured. A skin could not fix that: `pw.components`
sorts after `pw.treatment`, so a treatment can only fill slots a component
left. The layer order is now `pw.reset, pw.tokens, pw.treatment, pw.components,
pw.skin, pw.overrides`, and a file in `css/skins/<skin>/` may restyle what a
component painted. Components never learn a skin's name and the DOM stays
single, so `check:parity` still compares the same shapes on both demo pages.

The prohibitions are narrower than the ones on a component, because winning a
declaration the shared slot made is the entire point of this layer. Two
properties are still off: `background`/`background-image` carries the ornament,
the elevation fill and the texture as one list, and `box-shadow` carries
`--pw-elev` and `--pw-focus-halo` as one list. Writing either replaces the whole
list. Assign the slots instead. Borders, radii, colours and layout are a skin's
to take.

**The window is the worked example of what this refuses.** The obvious first use
was hiding the minimise, maximise and close cluster under a skin that has no
title bar. Those are real buttons carrying real accessible names, so hiding them
leaves three named controls in the tab order and invisible on screen. Replacing
them needs an element, and a skin does not get one. Six tests hold the layer to
all of it.

The select is the example of what it allows: under `cyber` the drop button loses
its elevation and becomes a bracketed caret drawn on the field, and under
`paper` the well becomes a value on a ruled line.

### Three sprite sheets, differing by weight

`--pw-icon-sheet` is a token a skin sets. The three skins shared one set of
solid 16x16 marks drawn for a toolbar of pressable objects, which is the right
vocabulary for exactly one of them.

- **cyber** is drawn open: outlines where chrome fills, right angles where it
  curves, and a square where it draws a circle, because a HUD's dot is a cell on
  a grid rather than a dab of ink. Its magnifier has a rectangular lens and
  stops reading as a magnifier, which is correct: a scan selects an area.
- **paper** is the heaviest of the three: three-pixel strokes, round bullets,
  and a circular lens again. Print has no elevation and no glow, so a mark there
  carries entirely by weight.

A sheet gets the pixels inside a cell and nothing else. The cell stays 16x16,
the sheet stays eight columns, and the order stays `ICON_ORDER`, because the
cell a name resolves to is computed from its index in that order and a reordered
sheet paints every name as its neighbour. `assets/icon-lattice.mjs` holds all
three, and every set-level test now runs over every sheet rather than the first
one.

One rule shapes any thin set. A one-pixel diagonal is not a stroke on this
lattice, it is a column of pixels touching at their corners: it survives at 11x
and renders as a dotted line at 1x. Every diagonal is a staircase whose steps
share an edge.

### Fixes

**`--pw-icon-sheet` was documented as a skin's to set and could not be set.** It
was declared inside `icon.css`, which is `pw.components`, while a skin declares
its knobs in `pw.tokens`. `pw.components` sorts later, so the component file won
every time: the rule parsed, the cascade discarded it, and the skin kept the
first sheet. Three releases of a hook that did nothing, reported by no test and
no gate. `check:cssom` now asks the browser what the mask actually resolved to
under each skin rather than whether a declaration exists.

**The box-shadow guard named seven component files out of twenty-two, by hand**,
and the three with the most chrome baked into them were all outside it. Widening
it to every file found two: `.pw-switch-thumb` was redeclaring a property the
shared slot owns and dropping the focus halo with it, and `.pw-select-button`
was outside the slot entirely and painting its own elevation, which is why a
fill-based skin never reached it.

**`overflow: hidden` was being asked file-wide.** It had to name `lcd.css` as an
exemption to let the readout's marquee wrapper through, which let every other
rule in that file through unread. It asks which element now. Four of five hits
are ellipsis truncation on text wrappers; the fifth, `.pw-progress`, is a slot
member, so the clip moved to its fill.

**`.pw-select-item` painted its highlight from `--pw-color-primary` directly**,
where the list and the menu both read the selection slot. The cyber skin's
corner brackets reached a list and a menu and never reached an open select.

### For consumers

`Icon` renders `data-icon` and no longer writes the sprite cell into a `style`
attribute. An inline style beats every layer, `pw.overrides` included, so the
first sheet's numbers were welded into the markup and no skin could correct
them. The numbers come from `css/components/icon-index.css`, which already
carried them for hand-written markup, and the React and CSS-only paths are now
one path. Nothing about `Icon`'s props changed.

## 0.6.0

A third skin, a preset for each of the three, and the architectural change that
made the third skin possible.

### The elevation slot opens

`--pw-elev` is consumed as a `box-shadow`. That was fine while both skins
answered with one, and it is why the kit's central claim, that a skin replaces
the treatment without touching a component, had only ever been proved in the
shape it was built for.

The shadow pair is mirrored by `--pw-fill-raised` and `--pw-fill-sunken`, and
the slot grew a three-layer background stack: ornament, elevation fill, texture.
`--pw-ornament` is the same mechanism for a mark no component draws, because a
treatment cannot add elements and a slot is the only way a skin puts something
new on a surface.

Every rule assigning `--pw-elev` now assigns `--pw-elev-fill`, and a test holds
the pair together. The failure it exists for is silent: a rule that sets the
shadow to sunken and leaves the fill on the raised default is correct under both
shadow skins, because both fills are `none`.

### `paper`, whose depth is not a shadow

Elevation is dither density: a raised surface printed at a coarse screen and a
sunken one at a fine faint one. Measured, which is the point: a raised button
and a sunken checkbox have **identical** box-shadows and differ only in their
`background-image`.

The screen is a translucent black rather than a named ink, which took two
attempts to get right. A fixed colour has a different local contrast on every
ground it is printed on: a warm grey dot measured 1.64:1 on the paper stock and
3.91:1 on the primary. A screen is the surface's own colour at partial coverage.

A halftone surface also has a **second ground** the contrast gate cannot see,
since it reads a computed `background-color` and that is the stock rather than
the dot. `check` refuses a translucent background, correctly, so a test
composites what the browser will paint across eight grounds and checks both
legibility and calmness.

### Skins move more than colour now

Measured before this release: the cyber skin overrode 29 of 29 semantic
colours, 10 of 10 treatment knobs, **0 of 11** density tokens and **0 of 18**
motion tokens. Every control was the same height, padding, type and timing as
chrome's. A skin that moves all of its colour and none of its rhythm reads as
the same design twice.

Type, padding, gaps, border and focus weight, and all of motion are a skin's to
move. `--pw-control-h` is not: 44px is a hit target, not a style, and
`check:a11y` measures it.

Two ordering traps went with it. `motion.css` imported after every skin, so a
skin's timing was silently ignored; it imports before them now. And a skin
moving a density token wins at *both* densities, so the compact axis was dead
under cyber for everything the skin had touched. Both are guarded.

### A preset may move rhythm, and the line moved

It was "whether a treatment file is involved". It is now: **a preset may change
anything a skin may change, except the treatment.** `deck` takes the new range
and is tighter; it is still a preset because chrome's bevel still paints its
depth.

Two new presets:

- **`redline`**, for cyber. The skin is documented as accessible cyberpunk and
  is not one: it is a terminal, which its own reference set says in its first
  line. The restraint is what makes it readable for hours, so the base keeps it
  and this is where the name gets cashed: near-black stock, one hot ink, the
  raster at 0.16 against the skin's 0.055, the glow spent on everything.
- **`newsprint`**, for paper. The one-colour job: cool cheap stock, no spot at
  all, a heavier screen. Losing the spot is the interesting part, because
  warning and error go graphite and the badge glyph is the only thing left
  saying which. A palette with three status hues can claim it never leans on
  colour alone without ever being asked to prove it.

### Fixes

**The cyber skin declared a whole amber ramp and read none of it**, kept alive
by a comment saying it survived for "the readout, which is amber because a
segment display is". The readout is `--pw-phos-300` and always has been. The
reason was false the day it was written, and those four shades are the ones
that collided with the chrome skin's amber and painted its warning ink for
three releases.

**Visible change:** the redline preset no longer crowds its labels. It shipped
at 0.46em of horizontal padding against the type it is set in, where every
other look sits between 0.50 and 1.07. There is a floor now.

12 looks. 299 declared pairs across 13 themes, 51384 painted pairs across 6
looks, 24 axe combinations, 196 tests.

## 0.5.0

The visualiser, a corner fix that changes how the cyber skin looks, and a
palette bug that had been painting the wrong ink since 0.2.0.

### The spectrum analyser

The last piece of the console this skin draws, built from research that had
been on file and unreferenced since before the first commit.

**The gradient is sampled by height, not stretched to it**, and that is the
whole technique. Winamp coloured each *row* of the display: a band reaching the
top is green at the bottom and red at the top, and a short band is green all
the way up because it never reaches the rows where the ramp turns. A gradient
painted on a short bar at `background-size: 100% 100%` does the opposite, so
every band shows every colour and the ramp stops meaning level. The bar's
background is sized to the full column and anchored to its floor instead, and
the bar's own height clips it.

**It listens to nothing.** No Web Audio, no `AnalyserNode`, no animation frame:
it takes an array of levels and draws them. An audio graph needs a user
gesture, needs cleaning up, and belongs to the application. That boundary is
also where WCAG 2.2.2 lands, since the component never animates on its own.
Peaks are held here and decay per update rather than per second, which keeps
them drawing rather than motion and makes them the same at any frame rate.

The palette's *structure* is Strider's 1998 skin specification, which documents
`viscolor.txt` as 24 lines. The values are this kit's own ramps, for the same
reason the project cites Winamp as prior art and does not use its name. There
is no oscilloscope.

### The cyber skin is square now

**Visible change.** It set the chamfer and left the radius alone, so it had
both. Measured before the fix: eleven surfaces notched and twenty still
carrying chrome's 2px, including every button, tab, text field, checkbox,
select and switch, and the dialog panel. `--pw-clip-control` reaches only the
surfaces that do not draw a focus ring, because `clip-path` clips an outline,
so the controls a keyboard lands on were opted out of the chamfer and kept a
radius nobody had overridden. They looked like chrome's controls in a different
colour, which is what the skin was rebuilt to stop being.

Two tokens. After: ten notched, one rounded, and the one is the radio, which
stays round on purpose and which a skin cannot square, because the roundness is
what says choose-one before a word has been read.

If you are writing a skin: set both or neither. The README says so now.

### The chrome skin's warning ink was the cyber skin's amber

Both primitive files declared on a bare `:root` and the cyber one is imported
second. `:root` and `[data-skin="cyber"]` are both (0,1,0), so wherever the two
ramps shared a name the later import won *everywhere*. All four amber shades
are shared and all four differ, so `--pw-color-warning-content` resolved to
`#f5c542` where `#e6c463` was declared, in every chrome theme and in the deck
preset, since 0.2.0.

Nothing could see it, and the reason is the useful part: the contrast gate
resolves the cascade exactly as the browser does, so it measured the colour
being painted and passed. What was wrong is that the painted colour was not the
declared one, and "every token has a reader" is a different question from
"every token's declaration is the one that wins". The corrected numbers still
pass at 6.41:1 and 8.41:1 against a 4.5 floor.

The base ramp owns `:root` and every other skin's ramp scopes to its own skin
now, which makes the collision impossible rather than merely absent. Sharing a
name stays fine, and is done on purpose: the cyber skin reads the phosphor ramp
from the base file, because a lit display does not follow the skin.

191 tests. 138 rendered classes, 17028 painted pairs, 27 parity shapes, 10
accessible names.

## 0.4.0

Five components, all of them on primitives the package already depended on, so
none is new interaction work. Nothing existing changed what it paints.

### Switch, collapsible, toolbar, separator, tooltip

**A switch is not a toggle**, and the kit ships both on purpose. A toggle is a
button that stays pressed: it answers "is this mode on", it carries its label
inside itself, and a screen reader says "pressed". A switch is a thing you
throw: the label sits beside it, the state is where the thumb is, and
`aria-checked` makes it "on". If it belongs in a toolbar it is a toggle; if it
belongs in a settings list it is a switch.

Position carries the state and the track's tint is the second signal, which
the cyber skin makes concrete rather than theoretical: it resolves its accents
to one ink on purpose, so a skin can arrive where a tint says nothing. The
thumb's travel is the track's width minus its height, which is one expression
at any padding, because the padding is `--pw-bevel-1` and collapses to zero
under a flat skin. Measured: 1 to 17 under chrome, 0 to 16 under cyber.

**The toolbar** is one tab stop with the arrow keys inside it, which is the
whole reason to use one: eleven buttons in a plain row is eleven tab stops.
`Transport` has been this primitive with a fixed set of buttons in it since
0.1; this is the general shape. Its buttons wear `.pw-button`, because a button
in a toolbar is a button.

**The separator** is why `--pw-color-divider` exists. That token was declared
in every palette from the beginning and read by nothing, sitting on the
reserved-token list with the note that it was "a semantic slot for consumers".
It is now that. The menu's own separator stays engraved from the bevel pair,
which is a different job: a groove between two rows of a bevelled popup is the
period drawing. Its 2:1 tier and the contrast gate's grouping-line branch are
both exercised for the first time.

Two things declined on purpose. **The collapsible does not animate its
height**: Radix publishes the variable for it and every kit in this genre uses
it, but height is a layout property and animating it reflows the document every
frame. The chevron turns instead. And **the tooltip has no arrow**: an arrow is
an SVG, every edge in this kit is an inset box-shadow, and a skinned arrow
would be a hand-drawn second description of the frame that no token controls.

A tooltip is not a label. A control whose only name is its tooltip has no name
to a touch user, who cannot hover, and no name to anyone else until focus
reaches it.

### Two holes in the gate, found by walking into them

**`check:colour` could not see element opacity.** It read a computed `color`
and composited its alpha, and opacity is not alpha. Six text surfaces here are
quieted that way rather than with a quieter ink, and every one was measured at
full strength. All six pass once measured properly, which is the good outcome
and not the point: nothing could have said so. Proved by fading the metadata
label to 0.30, which goes red with the fix and clean with the old arithmetic.

**A headless page is never the focused window.** `document.hasFocus()` is
false, so `element.focus()` moves `activeElement` without firing a focus event,
and anything listening for one never hears it. The tooltip opens on focus and
was simply not being told, and focus is the only way a keyboard user ever sees
one. With focus emulation the tooltip joins the surfaces axe opens: eight
rather than six.

Getting there took three attempts and each one found something. The first
capped the wait at four seconds, which is a fixed bet wearing a poll's clothes:
it held here and lost on CI, in the dark theme only, on the last of eight
iterations. The second polled properly and revealed the real fault, because the
new assertion that a surface is **still open after axe has run** fired: the
tooltip opened on focus and closed again partway through the scan, which would
otherwise have been a clean report on a page with no tooltip on it. It is
opened by parking a real pointer on the trigger now, because a hovered tooltip
stays open exactly as long as the pointer is there and axe does not move the
pointer.

190 tests. 130 rendered classes, 16884 painted pairs, 32 focus rings under a
skin's clip, 26 parity shapes.

## 0.3.1

Documentation and the CSS-only path. No component and no visual change:
`git diff v0.3.0..v0.3.1 -- src/` is empty, and the only rules added to the
stylesheet are one per icon name.

This release is the other half of a bet the package made in 0.1 and then
documented badly. The stylesheet is meant to stand alone, most of the audience
for a skin is not React-first, and a consumer on that path was handed one class
name and four thousand lines of CSS.

### `CLASSES.md`

Every class the stylesheet ships, what it is, and the element it goes on. The
list is generated from `css/panelware.css`, so it cannot be short, and four
tests hold it honest: every shipped class is described and no description
outlives its class, every class named in a markup example is one that ships,
every shipped class is rendered by a component or is on a hook list with a
reason, and the element each class claims is the element the component renders.

The last two earned their place on the first run. The hook test found
`.pw-lcd-caption`, which `glow.css` uppercased and nothing had ever rendered,
so the rule could never match. The element test found two errors in the
descriptions as they were being written: `.pw-title` documented at `h3` when
the component defaults to level 2, and `.pw-list-marker` described as the
selected row's mark when it is the playing row's.

The general lesson is the mirror of what the gates taught. Writing prose about
code and then measuring it against the code found errors in the prose
immediately.

### The demo is in the package

`demo/` is in the `files` array. `demo/states.html` renders every component in
every state an attribute can reach with no JavaScript at all, and the README
has called it the standing proof the CSS needs no React since 0.1 while leaving
it out of the tarball.

```bash
open node_modules/@josueavalosjim/panelware/demo/states.html
```

Every relative path both pages make resolves inside the package, verified by
packing and loading `states.html` from where a consumer would open it. The
tarball goes from 180kB to 260kB.

### An icon names itself

```html
<span class="pw-icon" data-icon="check" aria-hidden="true"></span>
```

`<Icon name="check">` reads the index and writes the sprite cell inline.
Hand-written markup could not, because the mapping lived only in
`src/icons.ts`, so the CSS-only path carried `--pw-icon-x` and `--pw-icon-y` by
hand and got the numbers by reading the source of a generated file.

Same generator, same font data, one source. `demo/states.html` now carries no
sprite coordinates at all, which puts eighty-six elements resolving through the
new rules on the page every browser check loads.

Specificity does the ordering: the generated rule is (0,2,0), the `.pw-icon`
defaults are (0,1,0), and an inline style beats both, so an attribute overrides
the defaults and the component's own style still overrides the attribute. The
spinner depends on that.

`check:cssom` asks the browser what each name resolved to, against the font
data rather than against the generated CSS. The failure it is there for is the
quiet one: a rule that stops matching does not error, `--pw-icon-x` falls back
to 0, and the page shows the wrong glyph.

190 tests.

## 0.3.0

A minor rather than a patch, for the new components. Two existing controls also
change what they paint, and both are noted below rather than left to be found.

### The kit can build a form now

`<Input>` and `<Textarea>`, and `.pw-input` and `.pw-textarea` for the half of
the audience that never touches React.

Three of the four form controls shipped in 0.1 and the fourth did not, so the
kit could label a choice and could not take a name. Installing the published
tarball and building an ordinary settings panel against it found that in the
first minute: five bare `<input>`s at browser default, and on the dark cyber
skin they were the brightest thing on the page.

There is no Radix under these and there is not meant to be. An input is an
input, the interaction is the platform's, and neither Radix nor shadcn wraps
one either. All the components add is a class name, which is what made this the
cheapest thing in the kit to have been missing.

It is the same sunken well as the combo box's field half, deliberately: the two
sit in the same form, and a raised text field beside a sunken select would be
two vocabularies in one row.

**The placeholder is italic rather than dimmed**, which is a measurement rather
than a preference. A placeholder is text in an enabled control, so 1.4.3 asks
4.5:1 of it and the disabled tier's 3.0 does not apply.
`--pw-color-disabled-content` against a field's own ground clears 4.5 in three
of the six palettes here and misses in the other three, at 4.29, 4.44 and 3.83.
Adding a seventh rung to six palettes to land just over the floor is the trade
the metadata ink was offered and refused.

**Invalid draws a ring, not a tint**, and `--pw-invalid-ring` is a separate
token from `--pw-border` because the cyber skin resolves error, success and
warning to one cyan pair on purpose. Under that skin colour carries nothing and
weight is the only thing left, so a ring at the resting edge's own weight would
be a state with no carrier. Nothing here validates: `aria-invalid` is yours to
set.

### Three controls get their focus ring back under the cyber skin

`.pw-panel`, `.pw-list` and `.pw-select` have been shipping with no focus ring
in that skin. All three are in the list `reset.css` rings and the list
`bevel.css` opts out of the corner clip, and both lists were correct.
`dialog.css`, `list.css` and `field.css` each re-declared `clip-path` anyway,
and `@layer pw.components` sorts after `@layer pw.treatment`, so the component
won and the opt-out lost. `clip-path` clips an outline and this kit's focus
ring is an outline.

The test holding those two lists together could not see it, because the defect
was in a third file neither list knows about. The new guard asks the browser
what the cascade settled on instead, sets both clip hooks rather than one, and
fails if any ringed class is missing from both demo pages.

**Visible change:** the cyber dialog no longer has a notched corner. That was
already the documented trade, argued at length in `bevel.css`: a notched skin
still cannot notch the things a keyboard lands on. The window, the menu, the
equaliser, the select list and the tab panel keep theirs.

### The select's placeholder changes with the text field's

**Visible change:** it was `opacity: 0.7` and it is italic now. That half is a
fix rather than a consistency pass. `check-colour` reads a computed `color` and
composites its alpha, and element opacity is not alpha, so the gate had been
measuring the full-strength value and the ratio the select was actually
painting had never been checked at all.

### Two checks that would have reported a clean run

`check:interaction`'s focus-ring sweep queried `a[href]`, `button` and `input`
and not `textarea`, so a new control would have been green in a check that
never looked at it. And both new controls are in `check:parity`'s shape list,
which is the claim that file makes about what it compares: 191x44 and 200x88,
identical on both pages.

182 tests. 16680 painted pairs, up from 15840. 14 focus rings, up from 12.

## 0.2.2

No component, stylesheet output or type changed. `git diff v0.2.1..v0.2.2 --
src/ assets/` is empty, and the only change under `css/` de-duplicates four
declarations that already resolved to the same values.

Six gates and the documentation. Every guard added here was proved by planting
the mutation it claims to catch and watching it go red.

### The gate stops betting on a clock

`check:interaction` was moved to a polled wait when a fixed settle nearly took
a release out. The other five browser checks kept theirs, so the fix covered
the file where the flake happened rather than the shape of it.

The bet was worse than a slow gate. Each wait for the demo to boot was
followed by a control count, and that count cannot tell a page that rendered
nothing from a page that was merely slow: both arrive at zero and both were
reported as a defect. Only the first one is. The counts stay, worded as they
were, and the waits in front of them are conditions now.

`check:pages` went from 1:43 to 0:40 as a side effect, which is the 63 seconds
of fixed waiting there was to remove.

### One `:root` declared four tokens twice

`--pw-bracket-inset`, `--pw-bracket-arm`, `--pw-bracket-weight` and
`--pw-meta-label-opacity` each appeared twice in the same block in
`structural.css`, from two commits inserting near the same line. Both copies
carried the same value, so nothing here measured anything different and every
gate agreed with itself.

It is a live hazard rather than untidiness: an edit to the first copy is
silently overruled by the second. A guard now walks every stylesheet and holds
each block to declaring a name once.

### Thirteen skin knobs were real, live, and unwritten

The README's "Writing a skin" section gave the procedure as copy
`skin.chrome.css` and change the values, then documented six of the
twenty-two tokens those files touch. The selection slot, the bracket geometry,
the three glow tokens, the three gloss internals and the glass blur were all
missing. The demo's token table listed them as a name and a value, which is
worse than silence: it says a knob exists and nothing about what turning it
does.

They are written up now, grouped by what turning one does, with the selection
slot given the most room because it is the second worked example of the rule
the cascade layers set up and the first one is easy to read as a special case.

Two claims in the same file had gone stale and are corrected. The four clip
and texture hooks no longer "do nothing today": the cyber skin uses all of
them. And a preset moving `--pw-bevel-depth` is no longer unenforced.

A guard holds the set going forward, on the reserved-token list's rule: every
knob is documented, or is on a list with a reason.

### Three more lists that could drift apart

The demo's skin picker and its `PRESETS` map are now held to the same
filesystem-derived set of looks the check scripts already answer to, and a
preset's owning skin is read out of its own selector rather than assumed.

The demo's import map is held to the package's own peer ranges. It boots React
and Radix from esm.sh, so the versions in that HTML are what every browser
check measures, and the map could have pinned a Radix a major behind `^1.6`
with every check still passing.

### The recorded Radix exemption, re-checked

`check:a11y` records one upstream exemption, that Radix's Select hides the page
with `aria-hidden` without also making it `inert`. Still occurring on
radix-ui 1.6.7, the current published version. The exemption stays, and the
green line now names the version it was measured against.

## 0.2.1

Documentation only. No component, stylesheet or type changed, and
`git diff v0.2.0..v0.2.1 -- src/ css/ assets/` is empty.

The README gains a Releasing section, because the release script it would have
described was wrong. `npm run release` ended in `npm version`, which fought the
test holding the changelog's top heading to package.json's version: writing the
entry first meant the bump went past it, and bumping first meant the suite went
red before the script reached the bump. There was no order that worked, so
0.1.3, 0.1.4 and 0.2.0 were each cut by hand around a documented path that
could not be followed.

It verifies rather than bumps now. The version is a hand edit, which it always
effectively was, and the script refuses to tag unless the version, the
changelog heading, the branch, the working tree, the unpushed count and the
tag's availability all already agree. Each refusal says why it matters rather
than only that it fired.

This release is the first one cut with it.

## 0.2.0

A minor rather than a patch, and the reason is the cyber skin: anyone rendering
`data-skin="cyber"` gets a visibly different product. Nothing about the chrome
skin, the API, or the CSS entry points changed, so an upgrade is safe if you
were never on cyber, and deliberate if you were.

### The cyber skin stops being the chrome skin in a different colour

It differed by hue and a bevel, which makes it a theme. Same face, same size,
same rhythm, same three-hue status vocabulary, so the two side by side showed
one design twice. Four changes fix that, all of them things the reference
lineage does and the kit already had hooks for.

**Notched corners.** `--pw-clip-control` and `--pw-clip-box` have been offered
in the README since the beginning as the way to get a notched skin, and
nothing had ever used them. Two opposite corners rather than four: four reads
as an octagon, two reads as a cut, and the diagonal is what the idiom is
actually built from.

**Scanlines** in `--pw-texture`, one pixel on and two off, stronger in dark
than light because a dark line on a light ground reads heavier at equal alpha.
That wired `--pw-texture-opacity`, which had been declared, documented as a
skin hook, and read by nothing.

**Selection is drawn, not tinted.** A selected row and a highlighted menu item
get four corner brackets and keep their ground. Selection became a slot to do
it: components assign `--pw-selected-bg`, `--pw-selected-content` and
`--pw-selected-mark` exactly as they already assign `--pw-elev`, and the
defaults reproduce chrome's inversion to the pixel.

**One accent, and shape carries the rest.** `success`, `warning` and `error`
all resolve to the same cyan pair. A chassis has three inks because green,
amber and red are the moulded-plastic vocabulary; a HUD has a ground, an ink
and one signal, and says which signal by drawing a different shape. The
badge's mark already did that work and was always the thing carrying meaning
for anyone who cannot separate hues.

**Mono, uppercase, tracked.** `--pw-font-ui` points at the mono stack, with
uppercase on controls only, because a control's label is structure and a list
row's text is content. This was the single biggest change and it cost one
token swap.

### A documented hook was unusable, and would have failed silently

`clip-path` clips an element's outline, and this kit's focus ring is an
outline. Setting `--pw-clip-control` as the README described would have taken
the ring off eight of the thirteen controls that draw one. Measured with a
10px outline against a 12px chamfer: the unclipped box draws its ring, the
clipped box draws nothing.

The failure is silent in the worst way. The rule still matches, the computed
style still reads `outline-style: solid`, and axe still sees an outline.
Nothing is painted.

The opt-out is now `reset.css`'s focus-ring list verbatim, with a test holding
both lists together and reading each out of the CSS so neither can drift. The
README's promise is smaller and true: a notched skin is still a token change,
it just cannot notch the things a keyboard lands on.

### New: metadata

`Meta`, and `.pw-meta` for the CSS-only install. The coordinate readouts and
serial strings a screen in this genre carries in its corners. A `<dl>`,
because field and value pairs have had an element since 1993 and a stack of
divs with a colon in the text reads identically to a sighted user while giving
a screen reader nothing to walk. Every item takes a label.

The contrast is the decision. Those screens draw this at around 8px and
something like 2.5:1; copying the size is fine and copying the contrast is
not, because 1.4.3 applies to small text. A quieter ink was tried and
abandoned: it needed a new rung in four palettes, and in three of them the
only rung clearing the floor was barely quieter than the body ink anyway, with
the deck's light theme at 4.37:1 against a 4.5 floor. Metadata takes the body
ink and gets its quiet from size, tracking and the label's own step back.

### Two icons redrawn

`restore` is on `maximize`'s footprint. It was 12x12 and 84 ink against
maximize's 10x10 and 64, so the same button changed size the moment you
clicked it. Two 7x7 windows at offset 3 puts it at 10x10 and 68.

`question` gained a second row on its left shoulder. At 24 ink against a set
median of 32, with a bowl two rows deep before the descent, it read as a hook
rather than as a question mark. The one-row shoulder was not incorrect: a
question mark's bowl is open at the lower left. The problem was weight, and
the earlier pass closed it by asking whether the drawing was wrong and never
asking whether it was thin.

## 0.1.4

Documentation only. The code is identical to 0.1.3, and the release exists for
the reason 0.1.2 existed: npm renders the README and the metadata from the
published tarball, so prose sitting on `main` is prose nobody reads.

**The demo is public.** GitHub Pages had never been enabled on the repository,
so `pages.yml` had been failing on every push to `main` since it was written,
and the README's claim that the demo is the documentation pointed at a file
path that only helps someone who has already cloned the repo. It is live at
[josueavalosjim.github.io/panelware](https://josueavalosjim.github.io/panelware/),
and the README's Status section leads with it.

The site's root answered 404 at first, because the Pages artifact is the whole
repo root and the root has no index. That is deliberate: `demo/` imports
`../dist` and `../css`, so uploading `demo/` alone ships a page whose every
relative path leaves the artifact. There is a redirect at the root now rather
than a second copy of the demo, because two pages claiming to be the
documentation is the drift this repo already runs three checks against.

**`homepage` points somewhere worth going.** It was the repository's `#readme`
anchor, and npmjs.com renders the README directly beneath that link, so it
sent people to a copy of the page they were already reading. It is the demo
now. The repository stays one click away through the `repository` field npm
renders beside it.

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

### The release gate stopped the release, which is what it is for

Tagging 0.1.3 failed at `check:a11y`, so `npm publish` never ran. Two things
came out of it.

The demo's contrast tables scroll horizontally and had no keyboard access,
which is 2.1.1. They are focusable named regions now.

And the check that found it was itself green for the wrong reason. It ran at
1100px, where nothing on the page scrolls on a Mac, and passed. On CI it
failed, because Radix locks scrolling while a menu is open and pads the body to
compensate for the scrollbar it removed: macOS overlay scrollbars are zero wide
so nothing moves, Linux scrollbars are real, so the content narrowed and the
tables tipped into overflow. The opened-surface pass runs at 820px now, where
the tables overflow on any platform, and it reproduces CI's result locally.

That is the same failure this release exists to fix, found one level up: a
check whose result depended on the machine it ran on.

### The magnifier's handle met its lens at a corner

`search`'s handle touched the ring at a single diagonal pixel with both
orthogonal neighbours empty. A corner join has no width: it survives at 11×
and can render as a break at 1×, and a magnifier whose handle looks detached
from its lens has stopped being a magnifier. The ring's bottom row runs one
column further right now, which is the join.

It was the only eight-connected join in thirty-two glyphs, so the test that
now forbids them is the set's own rule written down rather than a new one
imposed on it. Separate parts stay legal and there are several: the question
mark's dot, the pause bars, eject's triangle over its bar. The defect is two
regions close enough to read as joined while being joined by nothing.

The paragraph explaining why `dot` is the one round mark in the set sat 283
lines from `dot`, heading a different section. It sits with `dot` now.

### The marquee's pause button had the browser's focus ring, not this kit's

`reset.css` declares the focus ring once for a list of classes, and that list
is the whole answer to 2.4.7. `.pw-lcd-pause` was not in it, so the readout's
pause button got whatever outline the browser draws on a `<button>`, on the
readout's dark green face. That surface is the reason this kit draws two rings
in the first place: a single ring is only as visible as the ground behind it
allows.

The check that found it is worth describing, because the obvious version of it
cannot fail. Reading the list out of `reset.css` and confirming each member
rings proves nothing: delete a control from the list and it leaves the list
being read. So the subject is what the page renders as focusable, and the list
is what is tested against it. And a bare outline is not evidence either, since
a browser rings a `<button>` whether or not this kit says anything. The
assertion is on `--pw-focus-halo`, the second ring, which the reset sets only
on classes it names and which has no user-agent equivalent.

### The checks now see the parts of the kit that only exist when opened

axe scanned pages at rest, and a menu, a select listbox and a dialog are not
on a page at rest. Ten classes the kit ships styling for had therefore never
rendered in any browser check: the whole menu popup, the whole select list,
and the dialog's overlay and panel. This file's own first line said "in every
state".

`browser.mjs` can press a real mouse button now, for the same reason it grew a
key primitive: Radix opens a menu on pointerdown, so `element.click()` from
page script opens nothing and looks like a broken component. Each surface is
opened and scanned in both themes, and each opener is checked for having
actually opened by naming the classes it should reveal, because a click that
lands on nothing leaves axe rescanning the page it already scanned and
reporting the same clean result.

It found one thing, and it is upstream. Radix's Select hides the rest of the
page with `aria-hidden` and does not also make it inert, so every focusable
control behind the open listbox sits in an `aria-hidden` subtree. The Dialog
does it properly and is clean, so this is a difference between two Radix
primitives rather than something the skin does or can fix. It is recorded as a
named exemption that is asserted to still be happening, so if Radix changes it
the entry goes stale and says so rather than excusing a fixed bug forever.

Two page-level rules are off for that pass. A modal correctly hides the page
behind it, so the demo page's own `<main>` and `<h1>` stop being visible to
axe and both rules fire: that is the modal working, reported as a defect.

`check:overflow` tested the default look and nothing else, so compact density,
the axis most likely to change whether a fixed-width row fits, had never been
measured at any width. Eight measurements became sixteen. It passes.

### The tarball's own citations, and a gate that never looked at the code

`HANDOFF.md` carries the design record and a dozen files in `src/` and `css/`
cite it by name for their reasoning. It was not in the `files` array, so every
one of those citations was a dead end for exactly the person the reasoning was
written for: they have the source, the source says see `HANDOFF.md`, and the
tarball has no `HANDOFF.md`. It ships now, without its kickoff-prompt section,
and its title no longer says "working name, rename before real work starts" on
a package that has been published three times.

`check:exports` could not see this. It asks whether the exports map resolves,
which is a different question: a file can be perfectly packed and still point
at nothing. A test now holds every packed file to citing only files the
tarball contains.

The treatments gate scanned `demo/states.html` alone, on the stated grounds
that it was the only markup in the repo. That was never true. Every component
in `src/` writes markup, and two of them cite this gate by name as the reason
they emit unitless custom properties rather than px, so the gate had never
looked at the file making the claim about it. One file scanned is eighteen
now. It passes, so those components were right, but a rule nobody is held to
is a rule that is right by luck. Confirmed by planting a `3px` inline value in
a component, which it now names by file and line.

Two README samples described code that had been replaced. The readout section
described a visually hidden span, which is what the component did before axe
found the problem with it: `role="img"` on the host pruned the marquee's own
pause button out of the accessibility tree. And the first code sample on the
page taught a `<span>` wrapper inside a glossed button, which `gloss.css`
explains at length was a workaround for a stacking bug that has been fixed,
and which costs the button its flex gap.

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
