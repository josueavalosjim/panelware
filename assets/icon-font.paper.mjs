/**
 * The icon set, drawn again for the paper skin.
 *
 * Same cell, same order, same nine derived glyphs, different pixels. See
 * icon-lattice.mjs for why that is the whole licence.
 *
 * ── What makes this set different from the other two ──────────────────────
 * The chrome sheet is a toolbar's marks: solid, geometric, sized to sit on a
 * button. The cyber sheet opened them out into outlines, because an
 * instrument shows readings rather than objects. Neither is what a printed
 * sheet does.
 *
 * Print has no elevation and no glow, so a mark carries entirely by WEIGHT.
 * This is the heaviest of the three sets: three-pixel strokes where the
 * chrome set uses two, solid where cyber is hollow, and round where cyber is
 * square. A bullet on a page is a dot of ink, not a cell on a grid: this is a
 * catalogue's vocabulary rather than a HUD's. The magnifier's lens is the
 * one exception to the lattice, drawn in vector, because six pixels with the
 * corners cut is a bullet and not a lens.
 *
 * One glyph here is chrome's to the pixel, `pause`, and it is the only one.
 * Two heavy bars with a gap is what a pause mark is at 16px, and drawing it
 * again in this set's vocabulary produces the same twelve columns. The overlap
 * is declared in test/icons.test.mjs by name, so it cannot grow by accident.
 *
 * ── Round, on a lattice that has no curves ────────────────────────────────
 * A circle at this size is six pixels with its four corners cut, and that is
 * the whole trick. Cutting more reads as an octagon, cutting less reads as a
 * square, and there is no third option at 16px. Every round thing here but
 * the lens is that one shape at one of two sizes, so the bullet, the question mark's
 * point and the ellipsis are the same mark rather than three attempts at it.
 *
 * The lattice's one hard rule applies here as it does everywhere: a
 * one-pixel diagonal is pixels touching at their corners rather than a
 * stroke, so every diagonal is a staircase whose steps share an edge. Heavy
 * strokes make that easier here than it was for the thin set.
 */
import { derive, rectsOf, rot180 } from './icon-lattice.mjs';
import { footprint, isVector, markupOf, ring, stroke, vector } from './icon-vector.mjs';

/** The stroke every glyph on this sheet is drawn at. */
export const WEIGHT = 3;

const drawn = {
  play: [
    '................',
    '................',
    '....##..........',
    '....####........',
    '....######......',
    '....########....',
    '....#########...',
    '....##########..',
    '....##########..',
    '....#########...',
    '....########....',
    '....######......',
    '....####........',
    '....##..........',
    '................',
    '................',
  ],

  /* Three-pixel bars with a three-pixel gap, which is the printer's answer to
     rhythm: the counter between the strokes is a stroke width. */
  pause: [
    '................',
    '................',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '................',
    '................',
  ],

  stop: [
    '................',
    '................',
    '..############..',
    '..############..',
    '..############..',
    '..############..',
    '..############..',
    '..############..',
    '..############..',
    '..############..',
    '..############..',
    '..############..',
    '..############..',
    '..############..',
    '................',
    '................',
  ],

  previous: [
    '................',
    '................',
    '..###.......#...',
    '..###......##...',
    '..###.....###...',
    '..###....####...',
    '..###...#####...',
    '..###..######...',
    '..###..######...',
    '..###...#####...',
    '..###....####...',
    '..###.....###...',
    '..###......##...',
    '..###.......#...',
    '................',
    '................',
  ],

  eject: [
    '................',
    '................',
    '.......##.......',
    '......####......',
    '.....######.....',
    '....########....',
    '...##########...',
    '..############..',
    '................',
    '................',
    '..############..',
    '..############..',
    '..############..',
    '................',
    '................',
    '................',
  ],

  /* Struck through, the way a form is corrected in ink. Three-pixel strokes,
     so the crossing carries six and the arms three: a ratio of two, which is
     two strokes lying alongside each other rather than the stroke growing. */
  close: [
    '................',
    '................',
    '................',
    '..###......###..',
    '..####....####..',
    '...####..####...',
    '....########....',
    '.....######.....',
    '.....######.....',
    '....########....',
    '...####..####...',
    '..####....####..',
    '..###......###..',
    '................',
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
    '..############..',
    '..############..',
    '..############..',
    '................',
    '................',
    '................',
  ],

  /* A three-pixel frame. Heavier than cyber's two, because a printed rule
     that thin disappears into the halftone around it. */
  maximize: [
    '................',
    '................',
    '..############..',
    '..############..',
    '..############..',
    '..###......###..',
    '..###......###..',
    '..###......###..',
    '..###......###..',
    '..###......###..',
    '..###......###..',
    '..############..',
    '..############..',
    '..############..',
    '................',
    '................',
  ],

  /* Two cards, one in front, and a knockout between them.

     This was two solid slabs that met at a corner and overlapped nowhere, so
     nothing was in front of anything: it read as an L, not as a restore. The
     other two sets both draw a frame clipped behind a frame, and this set has
     no outlines to clip, so it does what print does instead. The front card is
     solid and the back card is cut away for one pixel along it, which is a
     knockout: the channel is the paper showing through, and it is thinner than
     the strokes on purpose, because that is what a keyline is.

     What stays of the back card is its top band and its right edge, which is
     the same thing the reader sees in the other two sets. */
  restore: [
    '................',
    '................',
    '.....#########..',
    '.....#########..',
    '............##..',
    '..#########.##..',
    '..#########.##..',
    '..#########.##..',
    '..#########.##..',
    '..#########.##..',
    '..#########.....',
    '..#########.....',
    '..#########.....',
    '..#########.....',
    '................',
    '................',
  ],

  'chevron-down': [
    '................',
    '................',
    '................',
    '..###......###..',
    '..####....####..',
    '...####..####...',
    '....########....',
    '.....######.....',
    '......####......',
    '.......##.......',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],

  /* A drawn tick: three pixels through, and the two arms lying alongside each
     other at the vertex rather than the stroke swelling into it. */
  check: [
    '................',
    '................',
    '................',
    '................',
    '..........###...',
    '.........###....',
    '........###.....',
    '..###..###......',
    '...######.......',
    '....####........',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],

  exclamation: [
    '................',
    '................',
    '......###.......',
    '......###.......',
    '......###.......',
    '......###.......',
    '......###.......',
    '......###.......',
    '......###.......',
    '................',
    '................',
    '.....####.......',
    '.....####.......',
    '................',
    '................',
    '................',
  ],

  /* A bullet: six pixels with its corners cut, which is as round as this
     lattice gets. Every round thing in this set is this shape at one of two
     sizes, so they read as one mark rather than three attempts at it. */
  dot: [
    '................',
    '................',
    '................',
    '................',
    '.....######.....',
    '....########....',
    '....########....',
    '....########....',
    '....########....',
    '....########....',
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
    '..############..',
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
    '....########....',
    '....########....',
    '.....######.....',
    '.....######.....',
    '......####......',
    '.......##.......',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],

  /* The one vector glyph on this sheet. A lens built from pixels read as a
     Q or a key at every size, so this is a real circle and a handle with a
     round end, both at the sheet's 3px weight. */
  search: vector(
    ring(7, 7, 3.5, WEIGHT),
    stroke([[10, 10], [12.5, 12.5]], { w: WEIGHT, cap: 'round' }),
  ),

  question: [
    '................',
    '................',
    '....######......',
    '...########.....',
    '..###....###....',
    '.........###....',
    '........###.....',
    '.......###......',
    '......###.......',
    '......###.......',
    '................',
    '.....####.......',
    '.....####.......',
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
    '..###.###.###...',
    '..###.###.###...',
    '..###.###.###...',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],

  /* One bullet at four positions around the ring, the other four derived by
     turning these over. Weight rather than a tail carries the spin, because
     a printed mark does not fade. */
  'spinner-1': [
    '................',
    '................',
    '......####......',
    '......####......',
    '......####......',
    '......####......',
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
    '..........####..',
    '..........####..',
    '..........####..',
    '..........####..',
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
    '..........####..',
    '..........####..',
    '..........####..',
    '..........####..',
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
    '..........####..',
    '..........####..',
    '..........####..',
    '..........####..',
    '................',
    '................',
    '................',
  ],
};

/* info is exclamation turned over, the same bar and the same dot read the
   other way up, derived so the two cannot disagree. */
drawn.info = rot180(drawn.exclamation);

const I = derive(drawn);

export function iconRects(name) {
  const g = I[name];
  return rectsOf(isVector(g) ? footprint(g) : g, name);
}

const rectMarkup = (name) => rectsOf(I[name], name)
  .map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>`).join('');

export function iconMarkup(name) {
  return isVector(I[name]) ? markupOf(I[name]) : rectMarkup(name);
}

export const ICON_NAMES = Object.keys(I);
export const GLYPHS = Object.fromEntries(ICON_NAMES.map((n) => [n, isVector(I[n]) ? footprint(I[n]) : I[n]]));

/** The vector glyphs, by name, for the tests that measure geometry. */
export const VECTORS = Object.fromEntries(ICON_NAMES.filter((n) => isVector(I[n])).map((n) => [n, I[n]]));
