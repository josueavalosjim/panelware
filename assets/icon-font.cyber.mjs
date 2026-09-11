/**
 * The icon set, drawn again for the cyber skin.
 *
 * Same cell, same order, same nine derived glyphs, different pixels. That is
 * the entire licence a skin gets here, and icon-lattice.mjs says why.
 *
 * ── What makes this set different from the chrome one ─────────────────────
 * The chrome sheet is solid. Its stop is a filled square, its dot is a filled
 * blob, its lens is a circle. That is the right vocabulary for a toolbar of
 * pressable objects and the wrong one for an instrument, where a mark is a
 * reading rather than a thing.
 *
 * So this set is drawn OPEN. Outlines where chrome fills, right angles where
 * chrome curves, and a square where chrome draws a circle: a HUD's dot is a
 * cell on a grid, not a dab of ink. The magnifier's lens is rectangular for
 * the same reason, and it stops reading as a magnifier and starts reading as
 * a selection, which is what a scan actually is.
 *
 * ── Six glyphs here are chrome's, to the pixel ────────────────────────────
 * The four chevrons, the check, and the exclamation. That is deliberate and it
 * is not laziness. Every one of them is already a stroke, so there is nothing
 * for a rule that says "outlines where the first set fills" to open, and a
 * chevron drawn differently is a chevron drawn worse. The overlap is declared
 * in test/icons.test.mjs by name, so redrawing one of them fails a test rather
 * than passing quietly, which is the only way a reader can tell a shared
 * drawing from a forgotten one.
 *
 * ── The one thing a thin set may not do ───────────────────────────────────
 * A one-pixel diagonal is not a stroke on this lattice, it is a column of
 * pixels that touch at their corners and nothing else. It survives at 11x and
 * renders as a dotted line at 1x, and the set's own test rejects it: two
 * regions joined by nothing are two regions. Every diagonal here is a
 * staircase whose steps share an edge, which is why they are two pixels wide
 * where they turn. That is a constraint of the grid rather than a style, and
 * it is the reason this set is thin rather than hairline.
 */
import { derive, rectsOf } from './icon-lattice.mjs';

const drawn = {
  /* Transport, opened out. The triangles keep the two-pixel apex the chrome
     set established, which needs an even height to exist at all. */
  play: [
    '................',
    '................',
    '....##..........',
    '....###.........',
    '....####........',
    '....##.##.......',
    '....##..##......',
    '....##...##.....',
    '....##...##.....',
    '....##..##......',
    '....##.##.......',
    '....####........',
    '....###.........',
    '....##..........',
    '................',
    '................',
  ],

  pause: [
    '................',
    '................',
    '....##....##....',
    '....##....##....',
    '....##....##....',
    '....##....##....',
    '....##....##....',
    '....##....##....',
    '....##....##....',
    '....##....##....',
    '....##....##....',
    '....##....##....',
    '....##....##....',
    '....##....##....',
    '................',
    '................',
  ],

  /* Hollow, which is the whole argument of this set in one glyph: the chrome
     stop is a filled block because a button is an object, and this is the
     same square read as a boundary. */
  stop: [
    '................',
    '................',
    '................',
    '................',
    '....########....',
    '....########....',
    '....##....##....',
    '....##....##....',
    '....##....##....',
    '....##....##....',
    '....########....',
    '....########....',
    '................',
    '................',
    '................',
    '................',
  ],

  previous: [
    '................',
    '................',
    '..##......##....',
    '..##.....###....',
    '..##....####....',
    '..##...##.##....',
    '..##..##..##....',
    '..##.##...##....',
    '..##.##...##....',
    '..##..##..##....',
    '..##...##.##....',
    '..##....####....',
    '..##.....###....',
    '..##......##....',
    '................',
    '................',
  ],

  eject: [
    '................',
    '................',
    '.......##.......',
    '......####......',
    '.....##..##.....',
    '....##....##....',
    '...##......##...',
    '..############..',
    '................',
    '................',
    '..############..',
    '..############..',
    '................',
    '................',
    '................',
    '................',
  ],

  /* The X, as two crossed staircases. Its rows carry more ink where the
     strokes cross, which is the one place the set's stroke-fattening test
     allows a swell. */
  close: [
    '................',
    '................',
    '..##........##..',
    '..###......###..',
    '...###....###...',
    '....###..###....',
    '.....######.....',
    '......####......',
    '......####......',
    '.....######.....',
    '....###..###....',
    '...###....###...',
    '..###......###..',
    '..##........##..',
    '................',
    '................',
  ],

  minimize: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '..############..',
    '..############..',
    '................',
    '................',
    '................',
  ],

  /* A window, not a rectangle, and that is a repair rather than a flourish.

     The chrome set tells stop from maximize by FILL: its stop is a solid
     block and its maximize is an outline. This set's rule is outlines
     everywhere, so it spent the one distinction chrome had and shipped two
     hollow squares at two sizes. Side by side in a toolbar they read as the
     same mark, which no measurement in this repo could say: every pair here
     is more than sixty pixels apart, and sixty pixels apart is not the same
     as telling two things apart.

     So the title rule comes back, separated from the frame's own top bar by a
     clear row. Chrome does not need it and does not have it. This set does,
     because it gave away the answer chrome was using. */
  maximize: [
    '................',
    '................',
    '..############..',
    '..############..',
    '..##........##..',
    '..##........##..',
    '..############..',
    '..############..',
    '..##........##..',
    '..##........##..',
    '..##........##..',
    '..##........##..',
    '..############..',
    '..############..',
    '................',
    '................',
  ],

  /* Two frames, one behind the other. The chrome set draws the same idea with
     filled bars; this keeps both outlines so the one in front reads as being
     in front rather than as a solid patch.

     The front frame is nine wide at every row, which it was not. Its top bar
     and upper rails were drawn seven wide and its lower rails and bottom bar
     nine, so the right edge stepped outward two pixels halfway down and the
     window came out a trapezoid. Nothing caught it: a lattice test can see a
     broken diagonal and a rotation that drifted, and it cannot see a rectangle
     that is not one.

     The back frame is clipped to what falls outside the front frame's box,
     which is what makes the front read as in front. Same rule the chrome set
     uses, and the clip has to move whenever the front frame's box does: the
     bottom bar's stub was still cut for a seven-wide front. */
  restore: [
    '................',
    '................',
    '.....#########..',
    '.....#########..',
    '.....##.....##..',
    '..#########.##..',
    '..#########.##..',
    '..##.....##.##..',
    '..##.....#####..',
    '..##.....#####..',
    '..##.....##.....',
    '..##.....##.....',
    '..#########.....',
    '..#########.....',
    '................',
    '................',
  ],

  'chevron-down': [
    '................',
    '................',
    '................',
    '................',
    '..##........##..',
    '..###......###..',
    '...###....###...',
    '....###..###....',
    '.....######.....',
    '......####......',
    '.......##.......',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],

  /* Two staircases of a constant three pixels, meeting at the vertex. Drawn
     at a constant width on purpose: the obvious version ran 2 3 3 5 6 6 6 4,
     where the ink climbs steadily toward the point, and that is a tick
     turning into a blob. This runs 3 3 3 6 6 5 3, where the sixes are the two
     arms lying alongside each other rather than the stroke growing. */
  check: [
    '................',
    '................',
    '................',
    '................',
    '...........###..',
    '..........###...',
    '.........###....',
    '..###...###.....',
    '...###.###......',
    '....#####.......',
    '.....###........',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],

  exclamation: [
    '................',
    '................',
    '.......##.......',
    '.......##.......',
    '.......##.......',
    '.......##.......',
    '.......##.......',
    '.......##.......',
    '.......##.......',
    '................',
    '................',
    '.......##.......',
    '.......##.......',
    '................',
    '................',
    '................',
  ],

  /* A cell on a grid rather than a dab of ink, which is what a HUD's dot is.
     Square where the chrome set draws a circle, and solid where the rest of
     this set is open: it is the radio's selected mark, and a hollow mark in a
     well reads as the empty state. The well stays round, because roundness is
     what says choose-one before a word has been read, and no skin gets to
     square that. */
  dot: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....######.....',
    '.....######.....',
    '.....######.....',
    '.....######.....',
    '.....######.....',
    '.....######.....',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],

  minus: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '..############..',
    '..############..',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],

  'caret-down': [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '....########....',
    '....########....',
    '.....######.....',
    '......####......',
    '.......##.......',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],

  /* A rectangular lens. A circle would be the chrome set's answer, and a
     rectangle is what a scan actually selects. The handle meets the frame
     along an edge rather than at a corner, which is the defect the set's
     corner test was written for. */
  search: [
    '................',
    '................',
    '..##########....',
    '..##########....',
    '..##......##....',
    '..##......##....',
    '..##......##....',
    '..##......##....',
    '..##########....',
    '..##########....',
    '........###.....',
    '.........###....',
    '..........###...',
    '...........##...',
    '................',
    '................',
  ],

  question: [
    '................',
    '................',
    '....######......',
    '....######......',
    '....##..##......',
    '........##......',
    '.......###......',
    '......###.......',
    '......##........',
    '......##........',
    '................',
    '......##........',
    '......##........',
    '................',
    '................',
    '................',
  ],

  ellipsis: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '..##...##...##..',
    '..##...##...##..',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],

  /* Eight positions of one mark around a ring. The second four are the first
     four turned 180 degrees, derived rather than drawn, so the spin cannot
     develop a wobble. */
  'spinner-1': [
    '................',
    '................',
    '......###.......',
    '......###.......',
    '......###.......',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],

  'spinner-2': [
    '................',
    '................',
    '................',
    '..........###...',
    '..........###...',
    '..........###...',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],

  'spinner-3': [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...........###..',
    '...........###..',
    '...........###..',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],

  'spinner-4': [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '..........###...',
    '..........###...',
    '..........###...',
    '................',
    '................',
    '................',
    '................',
  ],
};

/* info is exclamation turned over, which is what it has always been: the same
   bar and the same dot, read the other way up. Derived here rather than drawn
   so the two cannot disagree. */
import { rot180 } from './icon-lattice.mjs';
drawn.info = rot180(drawn.exclamation);

const I = derive(drawn);

export function iconRects(name) {
  return rectsOf(I[name], name);
}

export const ICON_NAMES = Object.keys(I);
export const GLYPHS = I;
