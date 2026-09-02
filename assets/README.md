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

Cells 0 through 11 are `numbers.bmp`'s layout exactly, including the blank and
the minus that the spec describes as a hidden sprite trick. **Cells 12 and 13
are ours**, not Winamp's: a clock needs a separator, and two more cells cost
less than a separate element with its own vertical alignment problem.

**`lcd-glyphs.svg`** — 155x12, 5x6 cells in a 31 x 2 grid. The cell is
`text.bmp`'s. The grid shape is ours; row 0 is A-Z plus five punctuation
marks, which is 31, and that is where the column count comes from. Row 1 is
the digits and a `?` fallback, so an unmapped character renders as a question
mark rather than as a gap.

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

**`icons.svg`** — 128x48, seventeen 16x16 cells in an 8 x 3 grid, generated
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

`--pw-icon-scale` must stay a whole number, for the same reason
`--pw-lcd-scale` must. It is also why an icon stays 16px in compact density
while the control around it drops from 44 to 32: scaling by the same ratio
would be 0.727 of the grid, and a 16px mark inside a 32px control is a
proportion the whole 90s toolbar canon already used.

Optical note, since it is the kind of thing that gets "corrected" later: play,
pause and stop do not share a bounding box. A solid square reads heavier than
a triangle that fills the same box, so the square is pulled in to 9x9 and the
triangle is drawn tall and narrow. Ink areas are 49, 72 and 81 pixels, and
that imbalance is what makes them look equal in a row.
