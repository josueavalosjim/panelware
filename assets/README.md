# The readout sheets

Both files here are generated. Edit `lcd-font.mjs` and run `npm run sprites`;
`test/sprites.test.mjs` fails if a sheet has drifted from the font data, so a
hand edit to an SVG will not quietly become the source of truth.

## What is sourced and what is ours

The cell sizes are Winamp's, from Strider's "Unofficial WinAMP Skin
Specifications" v1.2.1 (1998), preserved at `github.com/WACUP/Winamp-Skinning-Archive`
and cited in `HANDOFF.md`. This matters because the obvious modern assumption
about that display is wrong: it was never per-segment rendering. It was a
bitmap sprite font, and the player stepped an offset across one image.

**`lcd-digits.svg`** — 126x13, fourteen 9x13 cells.

| Cell | 0-9 | 10 | 11 | 12 | 13 |
| --- | --- | --- | --- | --- | --- |
| Glyph | `0`-`9` | blank | `-` | `:` | `.` |

**Cells 0 to 10 are `numbers.bmp`'s layout**: ten digits and a blank, which is
all of it. That file is 99px wide, which is eleven 9px cells and no more.

**Cell 11, the minus, is not from `numbers.bmp`.** It is `nums_ex.bmp`'s, an
extended sheet of twelve cells that Winamp uses in preference when a skin
ships it. An earlier version of this file said cell 11 was `numbers.bmp`'s
"hidden minus-sign sprite trick", which conflated two different things: the
trick is what Winamp does when a skin has *no* `nums_ex.bmp`, where it fakes a
minus by lifting a 5x1 slice out of the crossbar of the `2`. There is no
eleventh cell to find.

**Cells 12 and 13 are ours**, not Winamp's: a clock needs a separator, and two
more cells cost
less than a separate element with its own vertical alignment problem.

**`lcd-glyphs.svg`** — 155x12, 5x6 cells in a 31 x 2 grid. The cell is
`text.bmp`'s. The grid shape is ours; row 0 is A-Z plus five punctuation
marks, which is 31, and that is where the column count comes from. Row 1 is
the digits and a `?` fallback, so an unmapped character renders as a question
mark rather than as a gap.

## Where these numbers come from

Worth stating plainly, because this kit trades on sourced technique and the
provenance here is thinner than it first appears.

**Nullsoft's own skinning documentation contains no pixel dimensions at all.**
The official tutorial ran on winamp.com from 2000, moved to dev.winamp.com and
then wiki.winamp.com, and is prose throughout: "the top row is the unpressed
state, the second row is the pressed state", illustrated with GIFs. There is
no first-party sprite-offset table. The one exception is `region.txt` inside
the base skin, a commented tutorial signed by Justin Frankel, which states
that the main window runs 0 to 275 by 0 to 116.

Every precise number in this file therefore comes from community
reverse-engineering: Strider's "Unofficial WinAMP Skin Specifications" (1998,
and the word Unofficial is in its title), Skinner's Atlas 1.5 (2003), and
Webamp's `skinSprites.ts`, which are in broad agreement and disagree in
places. That is a perfectly good basis for a citation. It is not the same
thing as a specification, and this kit should not imply that it is.

## Why SVG, and why a mask

The original was a bitmap and the modern equivalent would be a PNG. These are
SVG, and they are applied with `mask-image` rather than `background-image`.

The mechanic is identical, a whole-pixel offset step across a sheet. What the
mask buys is that the ink is not baked into the file. The painted colour comes
from `--pw-color-lcd-content`, which means the contrast gate can name it in a
pair against `--pw-color-lcd` and measure it (11.26:1), a second skin can
re-tint the readout without shipping a second asset, and forced-colors mode
has something to override. A coloured PNG offers none of that. It is a picture
of a colour.

`--pw-lcd-scale` must stay a whole number. The sheet is a pixel grid, and a
fractional scale puts cell edges between device pixels, which tears a glyph
rather than softening it.

## The icon sheet

**`icons.svg`** — 128x64, thirty-two 16x16 cells in an 8 x 4 grid, generated
from `icon-font.mjs` the same way the readout sheets are, and applied the same
way: as a `mask-image` painted in `currentColor`, so an icon inside a button
takes the button's ink including its disabled and primary-content colours, and
forced-colors works with no special case.

**16x16 is the Windows toolbar and menu icon size** through 95, 2000 and XP,
so it is the period-correct grid for the chrome this kit cites.

**It is not Winamp's.** Strider's spec records Winamp's transport buttons at
**23x18**, stacked in one bitmap with the pressed state directly below the
normal one at (23,18). That number is recorded here and deliberately unused: a
second grid would need a second set of size tokens, a second scale knob and a
second sheet, to place five glyphs.

## The names, and why they are these names

Eleven icon sets were read before naming anything, and the two places this set
disagreed with all of them have been changed.

**`previous`, not `prev`.** One of the eleven abbreviated it. An icon name is
something a consumer types into an autocomplete, and an abbreviation only one
set uses is a name nobody guesses.

**`exclamation`, not `bang`.** None of the eleven used `bang`. It is a
typesetter's word for the glyph, not the word anyone searches for.

**`minimize`, `maximize` and `restore` are window operations here**, and that
is worth saying out loud because in most modern sets those three words mean
something else: `minimize` and `maximize` are a viewport going full screen, and
`restore` is an undo. These are the three Windows title-bar buttons, drawn as
the title bar draws them.

**No enclosed message-box marks.** The four Windows 95 message-box icons
(information, warning, error, question) were on the list and are deliberately
not here. They were 32x32 in the original, and at 16x16 a 2px enclosure on
every side leaves an 8x8 glyph inside, which is a worse mark than the bare one
sitting beside it in this sheet. `info`, `exclamation`, `close` and `question`
already carry those four meanings. A real dialog icon wants 32x32, which is a
second grid, refused here for the same reason Winamp's 23x18 was.

**The spinner is eight cells, not one glyph rotated.** Only a quarter turn is
exact on a square lattice. A 45 degree rotation resamples, and resampled pixel
art tears rather than softening, so the eight positions are drawn. Frames 5 to
8 are frames 1 to 4 turned 180 degrees, which is two exact quarter turns, so
they are derived and cannot drift. Five of the eight markers are lit: three
was the first attempt and read as scattered specks in a still frame, which is
what a component renders before anything animates.

## Two constraints a consumer needs to know about

**Serve the sheet same-origin, or set CORS headers on it.** `mask-image` is
fetched in CORS mode and `background-image` is not, so an `icons.svg` on a
different host without `Access-Control-Allow-Origin` kills every icon in
Chromium, WebKit and Firefox alike. If your bundler emits assets to a CDN on
another origin, either set the header or override `--pw-icon-sheet` with a
data URI. The failure is at least quiet rather than ugly: a mask whose URL
fails renders nothing, not a solid block.

**`--pw-icon-scale` controls CSS pixels, not device pixels.** Windows display
scaling at 125, 150 or 175% puts a 16px icon on 20, 24 or 28 device pixels,
which is 1.25 to 1.75 device pixels per art pixel. The whole-number rule
cannot prevent that, and that is precisely the environment this aesthetic
cites. Known limit, not a solved problem.

`--pw-icon-scale` must stay a whole number, for the same reason
`--pw-lcd-scale` must. It is also why an icon stays 16px in compact density
while the control around it drops from 44 to 32: scaling by the same ratio
would be 0.727 of the grid, and a 16px mark inside a 32px control is a
proportion the whole 90s toolbar canon already used.

These are original drawings citing an era. Nothing here is traced from
Microsoft, Apple or Nullsoft artwork, and the marks themselves are the common
geometric shapes and familiar symbols that copyright does not reach.

The check is a 3px stroke where the chevrons are 2px, and that is deliberate.
Drawn at 2px it measured 20 ink pixels against close's 52 and read as a
noticeably lighter mark in the same row. Five variants were rendered side by
side with close and exclamation for reference before picking; the chosen one is 29.
A tick is one bent stroke where an X is two crossing, so matching their ink
exactly would make the tick look heavy, and matching their stroke width made
it look thin.

Optical note, since it is the kind of thing that gets "corrected" later: play,
pause and stop do not share a bounding box. A solid square reads heavier than
a triangle that fills the same box, so the square is pulled in to 8x8 and the
triangle is drawn tall and narrow at 7x14. Ink areas are play 56, pause 72 and
stop 64, and that imbalance is what makes them look equal in a row.

Those five numbers are asserted against the drawing in `test/icons.test.mjs`,
because the paragraph above them was wrong for months: it said 49, 72 and 81
with a 9x9 square, describing a version of the mark that was redrawn and never
existed in the shipped sheet. A 9x9 square would fail the even-size test two
sections down. Prose that states a measurement gets a guard, the same as the
sheet size does.
