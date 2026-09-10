/**
 * The square lattice every icon sheet is drawn on, and the operations that
 * are exact on it.
 *
 * This was inside icon-font.mjs until a second sheet needed it. Nothing here
 * is new: it is the same grid constants, the same sheet order, the same
 * rotations and mirrors, and the same rows-to-rects reader, lifted so that a
 * skin's sheet cannot drift from the one it has to line up with.
 *
 * ── Why a second sheet has no freedom about any of this ───────────────────
 * A skin points --pw-icon-sheet somewhere else and nothing else changes. The
 * cell stays 16x16 and the sheet stays eight columns, because icon.css
 * declares those once as tokens and a test compares them to ICON_W, ICON_H
 * and ICON_COLS here. The order stays ICON_ORDER, because the cell an icon
 * lives in is computed from its index in it and a sheet that reordered would
 * paint every name as its neighbour. Only the pixels inside a cell change.
 *
 * That is the whole contract, and it is what makes a sheet swap a token
 * change rather than a fork.
 */

export const ICON_W = 16;
export const ICON_H = 16;
export const ICON_COLS = 8;

/** Sheet order, left to right then top to bottom. Every sheet shares it. */
export const ICON_ORDER = [
  'play', 'pause', 'stop', 'previous', 'next', 'eject', 'close', 'minimize',
  'maximize', 'restore', 'chevron-down', 'chevron-up', 'chevron-right',
  'chevron-left', 'check', 'exclamation', 'dot', 'minus', 'plus',
  'caret-down', 'search', 'info', 'question', 'ellipsis',
  'spinner-1', 'spinner-2', 'spinner-3', 'spinner-4',
  'spinner-5', 'spinner-6', 'spinner-7', 'spinner-8',
];

export const ICON_ROWS = Math.ceil(ICON_ORDER.length / ICON_COLS);

/* ── The exact operations ─────────────────────────────────────────────────
   A 90 degree rotation and a horizontal flip are both exact on a square
   lattice, so there is nothing to lose by deriving and one obvious thing to
   lose by not: three chevrons and a `next` were hand copies that had quietly
   drifted from the shape they claimed to be. */

/* Turns clockwise, so the first turn of a down chevron points LEFT.
   Assigning that to chevron-right produced four glyphs that were exact
   rotations of each other and two of which were labelled the wrong way
   round, which a rotation test cannot see: consistent and mislabelled is
   still consistent. */
export const rot90 = (r) => r[0].split('').map((_, x) => r.map((row) => row[x]).reverse().join(''));
export const flipX = (r) => r.map((row) => [...row].reverse().join(''));
export const rot180 = (r) => rot90(rot90(r));
export const union = (a, b) => a.map((row, y) => [...row]
  .map((c, x) => (c === '#' || b[y][x] === '#' ? '#' : '.')).join(''));

/**
 * The nine glyphs no sheet draws by hand, applied to the twenty-three it
 * does. Every sheet derives the same nine the same way, so a chevron is a
 * rotation of its own sheet's chevron rather than of the first sheet's.
 */
export function derive(drawn) {
  const I = { ...drawn };
  I['chevron-left'] = rot90(I['chevron-down']);
  I['chevron-up'] = rot90(I['chevron-left']);
  I['chevron-right'] = rot90(I['chevron-up']);
  I.next = flipX(I.previous);
  /* A plus is a minus and its own quarter turn, so it cannot end up with a
     different stroke width or extent from the glyph it pairs with in a tree
     view. */
  I.plus = union(I.minus, rot90(I.minus));
  /* Two quarter turns is 180 degrees, exact, and it is what makes the second
     half of the spin the first half's opposite by construction. */
  for (const k of [1, 2, 3, 4]) I[`spinner-${k + 4}`] = rot180(I[`spinner-${k}`]);
  return I;
}

/** The rectangles an icon paints, in cell-local pixels, runs merged per row. */
export function rectsOf(rows, name) {
  if (!rows) throw new Error(`no icon named ${JSON.stringify(name)}`);
  const out = [];
  rows.forEach((row, y) => {
    let run = 0;
    for (let x = 0; x <= ICON_W; x += 1) {
      if (row[x] === '#') { run += 1; continue; }
      if (run) out.push({ x: x - run, y, w: run, h: 1 });
      run = 0;
    }
  });
  return out;
}
