/**
 * The icon set, drawn again for the cyber skin, in vector.
 *
 * Same cell, same order, same nine derived glyphs. The pixels are gone:
 * icon-vector.mjs says why a sheet is allowed to leave the lattice and how its
 * ink is still measured.
 *
 * ── The vocabulary ─────────────────────────────────────────────────────────
 * Hairlines, 45 degree chamfers, and corner brackets. The chamfer is the cut
 * corner on the cyber window. The brackets are --pw-selected-mark, the corner
 * ticks this skin draws around a selected row. So stop is a solid core inside
 * that selection, and the frames (maximize, restore, search) are windows with
 * one corner cut.
 *
 * Three glyphs stay two pixels wide: exclamation, minus, and the plus
 * derived from it. A centred one pixel stroke is impossible on an even cell, and a
 * plus whose arms differ by a pixel reads as a mistake before it reads as
 * thin.
 */
import { box, deriveVector, fill, footprint, isVector, markupOf, rot180V, stroke, vector } from './icon-vector.mjs';
import { rectsOf } from './icon-lattice.mjs';

const R = { cap: 'round' };
const closedR = { cap: 'round', closed: true };

/* The four corner ticks of --pw-selected-mark, arms three pixels long. */
const brackets = (x0, y0, x1, y1) => [
  stroke([[x0, y0 + 2], [x0, y0], [x0 + 2, y0]]),
  stroke([[x1 - 2, y0], [x1, y0], [x1, y0 + 2]]),
  stroke([[x1, y1 - 2], [x1, y1], [x1 - 2, y1]]),
  stroke([[x0 + 2, y1], [x0, y1], [x0, y1 - 2]]),
];

const drawn = {
  play: vector(stroke([[5.5, 3.5], [12, 8], [5.5, 12.5]], closedR)),

  pause: vector(
    stroke([[5.5, 3.5], [5.5, 12.5]]),
    stroke([[10.5, 3.5], [10.5, 12.5]]),
  ),

  stop: vector(...brackets(3.5, 3.5, 12.5, 12.5), box(6, 6, 4, 4)),

  previous: vector(
    stroke([[3.5, 3.5], [3.5, 12.5]]),
    stroke([[12.5, 3.5], [6.5, 8], [12.5, 12.5]], closedR),
  ),

  eject: vector(
    stroke([[3.5, 8.5], [8, 4], [12.5, 8.5]], closedR),
    stroke([[3.5, 11.5], [12.5, 11.5]]),
  ),

  close: vector(
    stroke([[3.5, 3.5], [12.5, 12.5]], R),
    stroke([[12.5, 3.5], [3.5, 12.5]], R),
  ),

  minimize: vector(stroke([[3.5, 12.5], [12.5, 12.5]])),

  /* A window with its top right corner cut, and a title rule so it is not
     mistaken for stop. */
  maximize: vector(
    stroke([[2.5, 3.5], [11.5, 3.5], [13.5, 5.5], [13.5, 12.5], [2.5, 12.5]], { closed: true }),
    stroke([[2.5, 6.5], [13.5, 6.5]]),
  ),

  /* Two of those windows. The one behind is only drawn where the front one
     does not cover it, so the front reads as in front. */
  restore: vector(
    stroke([[2.5, 5.5], [8.5, 5.5], [10.5, 7.5], [10.5, 13.5], [2.5, 13.5]], { closed: true }),
    stroke([[5.5, 5.5], [5.5, 2.5], [11.5, 2.5], [13.5, 4.5], [13.5, 10.5], [10.5, 10.5]]),
  ),

  'chevron-down': vector(stroke([[3.5, 5.5], [8, 10], [12.5, 5.5]], R)),

  check: vector(stroke([[3.5, 8.5], [6.5, 11.5], [12.5, 5.5]], R)),

  exclamation: vector(box(7, 3, 2, 6), box(7, 11, 2, 2)),

  /* Solid, with the window's cut corner. It is the radio's selected mark, and
     a hollow mark in a well reads as the empty state. */
  dot: vector(fill([[5, 5], [9, 5], [11, 7], [11, 11], [5, 11]])),

  minus: vector(box(3, 7, 10, 2)),

  'caret-down': vector(fill([[4, 6], [12, 6], [8, 10]])),

  search: vector(
    stroke([[2.5, 2.5], [7.5, 2.5], [9.5, 4.5], [9.5, 9.5], [2.5, 9.5]], { closed: true }),
    stroke([[9.5, 9.5], [12.75, 12.75]], R),
  ),

  /* Chamfered at both shoulders and stepping into the stem at 45 degrees.
     Square shoulders read as a 7 with a tail. */
  question: vector(
    stroke([[4.5, 5.5], [6.5, 3.5], [9.5, 3.5], [11.5, 5.5], [11.5, 6.5], [8.5, 9.5]], R),
    box(8, 11, 1, 2),
  ),

  ellipsis: vector(box(3, 7, 2, 2), box(7, 7, 2, 2), box(11, 7, 2, 2)),

  /* A 2x2 mark stepping round a ring of radius five. The second four frames
     are the first four turned 180 degrees. */
  'spinner-1': vector(box(7, 2, 2, 2)),
  'spinner-2': vector(box(11, 3, 2, 2)),
  'spinner-3': vector(box(12, 7, 2, 2)),
  'spinner-4': vector(box(11, 11, 2, 2)),
};

drawn.info = rot180V(drawn.exclamation);

const I = deriveVector(drawn);

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
