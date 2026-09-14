/**
 * The icon set, drawn again for the cyber skin, in vector.
 *
 * Same cell, same order, same nine derived glyphs. icon-vector.mjs says why a
 * sheet may leave the pixel lattice and how its ink is still measured.
 *
 * ── The construction rules ────────────────────────────────────────────────
 * One set of rules, and every glyph keeps all of them. test/icons.test.mjs
 * checks the first three.
 *
 * 1. WEIGHT. Every mark is a 1px stroke. There are no fills and no 2px
 *    strokes. A point (the dot of an exclamation, the ellipsis) is a single
 *    1x1 pixel, which is the same weight seen end on.
 * 2. ANGLES. Straight strokes are horizontal or vertical and run on pixel
 *    centres. Diagonals are 45 degrees and nothing else, so every diagonal
 *    antialiases the same way.
 * 3. AXIS. Glyphs are centred on pixel 8, at 8.5, not on the cell's middle
 *    at 8. A 1px stroke can only be centred on a pixel, so this is the one
 *    centre a symmetric plus, pause, or close can have. Derived glyphs turn
 *    about it.
 * 4. KEYLINE. The live box is pixels 3 to 13, eleven wide, odd so it has a
 *    centre pixel. Full size glyphs touch it on at least two sides.
 * 5. MOTIFS. Two, both taken from the skin. A frame (maximize, restore,
 *    search) has its top right corner cut 2px at 45 degrees, the notch on the
 *    cyber window. Stop wears the corner brackets of --pw-selected-mark, arms
 *    three pixels long.
 * 6. CAPS AND JOINS. Square caps and mitred corners wherever a stroke ends
 *    straight or turns 90 or 135 degrees, so it ends on a whole pixel and
 *    its corners stay sharp. Round wherever a diagonal ends or a stroke turns
 *    through 45, so neither comes to a spur.
 */
import { box, deriveVector, footprint, isVector, markupOf, rot180V, stroke, vector } from './icon-vector.mjs';
import { rectsOf } from './icon-lattice.mjs';

export const AXIS = 8.5;
export const WEIGHT = 1;

const R = { cap: 'round' };
const closedR = { cap: 'round', closed: true };
const closed = { closed: true };
const point = (x, y) => box(x, y, 1, 1);

const drawn = {
  play: vector(stroke([[6.5, 3.5], [11.5, 8.5], [6.5, 13.5]], closedR)),

  pause: vector(
    stroke([[6.5, 3.5], [6.5, 13.5]]),
    stroke([[10.5, 3.5], [10.5, 13.5]]),
  ),

  /* The selection brackets around a 3x3 core. */
  stop: vector(
    stroke([[3.5, 5.5], [3.5, 3.5], [5.5, 3.5]]),
    stroke([[11.5, 3.5], [13.5, 3.5], [13.5, 5.5]]),
    stroke([[13.5, 11.5], [13.5, 13.5], [11.5, 13.5]]),
    stroke([[5.5, 13.5], [3.5, 13.5], [3.5, 11.5]]),
    stroke([[7.5, 7.5], [9.5, 7.5], [9.5, 9.5], [7.5, 9.5]], closed),
  ),

  previous: vector(
    stroke([[4.5, 3.5], [4.5, 13.5]]),
    stroke([[12.5, 3.5], [7.5, 8.5], [12.5, 13.5]], closedR),
  ),

  eject: vector(
    stroke([[3.5, 9.5], [8.5, 4.5], [13.5, 9.5]], closedR),
    stroke([[3.5, 12.5], [13.5, 12.5]]),
  ),

  close: vector(
    stroke([[3.5, 3.5], [13.5, 13.5]], R),
    stroke([[13.5, 3.5], [3.5, 13.5]], R),
  ),

  minimize: vector(stroke([[3.5, 13.5], [13.5, 13.5]])),

  /* A frame with its corner cut, and a title rule so it is not stop. */
  maximize: vector(
    stroke([[3.5, 3.5], [11.5, 3.5], [13.5, 5.5], [13.5, 13.5], [3.5, 13.5]], closed),
    stroke([[3.5, 6.5], [13.5, 6.5]]),
  ),

  /* Two frames. The one behind is only drawn where the front one does not
     cover it, so the front reads as in front. */
  restore: vector(
    stroke([[3.5, 6.5], [8.5, 6.5], [10.5, 8.5], [10.5, 13.5], [3.5, 13.5]], closed),
    stroke([[6.5, 6.5], [6.5, 3.5], [11.5, 3.5], [13.5, 5.5], [13.5, 10.5], [10.5, 10.5]]),
  ),

  'chevron-down': vector(stroke([[4.5, 6.5], [8.5, 10.5], [12.5, 6.5]], R)),

  check: vector(stroke([[3.5, 8.5], [6.5, 11.5], [13.5, 4.5]], R)),

  exclamation: vector(stroke([[8.5, 3.5], [8.5, 10.5]]), point(8, 13)),

  /* A ring with a point in it: the selected state of a radio. Solid would
     break rule 1, and a ring alone reads as unselected. */
  dot: vector(
    stroke([[6.5, 6.5], [10.5, 6.5], [10.5, 10.5], [6.5, 10.5]], closed),
    point(8, 8),
  ),

  minus: vector(stroke([[4.5, 8.5], [12.5, 8.5]])),

  'caret-down': vector(stroke([[4.5, 6.5], [12.5, 6.5], [8.5, 10.5]], closedR)),

  search: vector(
    stroke([[3.5, 3.5], [8.5, 3.5], [10.5, 5.5], [10.5, 10.5], [3.5, 10.5]], closed),
    stroke([[10.5, 10.5], [13.5, 13.5]], R),
  ),

  question: vector(
    stroke([[4.5, 5.5], [6.5, 3.5], [10.5, 3.5], [12.5, 5.5], [12.5, 6.5], [8.5, 10.5]], R),
    point(8, 13),
  ),

  ellipsis: vector(point(4, 8), point(8, 8), point(12, 8)),

  /* A three pixel tick stepping round a ring of radius five, each centred on
     the ring. The second four frames are the first four turned 180 degrees. */
  'spinner-1': vector(stroke([[7.5, 3.5], [9.5, 3.5]])),
  'spinner-2': vector(stroke([[11.5, 4.5], [13.5, 6.5]], R)),
  'spinner-3': vector(stroke([[13.5, 7.5], [13.5, 9.5]])),
  'spinner-4': vector(stroke([[13.5, 10.5], [11.5, 12.5]], R)),
};

drawn.info = rot180V(drawn.exclamation, AXIS);

const I = deriveVector(drawn, AXIS);

export function iconRects(name) {
  const g = I[name];
  if (!g) throw new Error(`no icon named ${JSON.stringify(name)}`);
  return rectsOf(isVector(g) ? footprint(g) : g, name);
}

export function iconMarkup(name) {
  return markupOf(I[name]);
}

export const ICON_NAMES = Object.keys(I);
export const GLYPHS = Object.fromEntries(ICON_NAMES.map((n) => [n, footprint(I[n])]));

/** The vector glyphs, by name, for the tests that measure geometry. */
export const VECTORS = I;
