/**
 * The readout's two bitmap fonts, as data.
 *
 * HANDOFF.md records a correction worth keeping in front of anyone editing
 * this file: Winamp's original readout was never per-segment rendering. It
 * was a bitmap sprite font. Strider's 1998 "Unofficial WinAMP Skin
 * Specifications" documents numbers.bmp at 9x13 pixel digit cells and
 * text.bmp at 5x6 glyph cells, and the display stepped a background offset
 * across the sheet. Those two cell sizes are the ones below, unchanged.
 *
 * The sheets in this directory are generated from this file rather than
 * drawn, so the glyphs stay editable and a change to a letterform shows up
 * in a diff as a letterform. test/sprites.test.mjs fails if a committed SVG
 * drifts from this source.
 *
 * DIGITS are described by which segments light, not by pixel rows, because a
 * segment display is what they are: fourteen cells that differ only in which
 * of seven bars is on. Writing them as pixels would be writing the same bar
 * ten times and inviting one copy to drift.
 *
 * GLYPHS are pixel rows, because letterforms have no such structure and any
 * scheme that pretended otherwise would be a worse way to say the same thing.
 */

/* ── Digits: 9 x 13, fourteen cells ───────────────────────────────────────
   Cells 0 to 10 are numbers.bmp's whole layout: ten digits and a blank. That
   file is 99px wide, which is eleven 9px cells and nothing else.

   Cell 11, the minus, is nums_ex.bmp's. That is a separate twelve-cell sheet
   Winamp prefers when a skin ships it. This comment used to say cell 11 was
   numbers.bmp's "hidden minus-sign sprite trick", which ran two unrelated
   things together: the trick is what Winamp does when a skin has NO
   nums_ex.bmp, faking a minus from a 5x1 slice of the crossbar of the 2.

   Cells 12 and 13 are ours. A time readout needs a separator, and two more
   cells is cheaper than a separate element with its own alignment problem.
   See assets/README.md for where any of these numbers come from, which is
   not where it looks: Nullsoft published no dimensions at all. */
export const DIGIT_W = 9;
export const DIGIT_H = 13;

/* Segment geometry, in cell pixels. a top, b top-right, c bottom-right,
   d bottom, e bottom-left, f top-left, g middle. */
const SEGMENTS = {
  a: { x: 2, y: 0,  w: 5, h: 1 },
  b: { x: 7, y: 1,  w: 1, h: 5 },
  c: { x: 7, y: 7,  w: 1, h: 5 },
  d: { x: 2, y: 12, w: 5, h: 1 },
  e: { x: 1, y: 7,  w: 1, h: 5 },
  f: { x: 1, y: 1,  w: 1, h: 5 },
  g: { x: 2, y: 6,  w: 5, h: 1 },
};

/* Dots, for the two cells that are not segment digits. */
const DOT_HIGH = { x: 4, y: 3,  w: 2, h: 2 };
const DOT_LOW  = { x: 4, y: 9,  w: 2, h: 2 };
const DOT_STOP = { x: 4, y: 11, w: 2, h: 2 };

export const DIGIT_CELLS = [
  { char: '0', segments: 'abcdef' },
  { char: '1', segments: 'bc' },
  { char: '2', segments: 'abged' },
  { char: '3', segments: 'abgcd' },
  { char: '4', segments: 'fgbc' },
  { char: '5', segments: 'afgcd' },
  { char: '6', segments: 'afgecd' },
  { char: '7', segments: 'abc' },
  { char: '8', segments: 'abcdefg' },
  { char: '9', segments: 'abcdfg' },
  { char: ' ', segments: '' },
  { char: '-', segments: 'g' },
  { char: ':', rects: [DOT_HIGH, DOT_LOW] },
  { char: '.', rects: [DOT_STOP] },
];

/** The rectangles a digit cell paints, in cell-local pixels. */
export function digitRects(cell) {
  if (cell.rects) return cell.rects;
  return [...cell.segments].map((s) => SEGMENTS[s]);
}

/* ── Glyphs: 5 x 6 ────────────────────────────────────────────────────────
   The cell is Winamp's. So, as it turns out, is the column count: text.bmp
   is 155px wide, which is 31 cells of 5px, and 18px tall, which is 3 rows.
   That is a coincidence rather than a citation, because this sheet's ORDER
   is ours and does not match. Winamp's row 0 is A-Z then a quote, an at
   sign, two unused cells and a space at column 30; row 1 is the digits and
   punctuation; row 2 is Å Ö Ä ? and an asterisk. Ours puts the space at 26
   and the digits on row 1 from column 0.

   --pw-lcd-glyph-cols in css/components/lcd.css is the only other place the
   column count is written down.

   Five pixels wide is the constraint that decides every letterform here. M
   and W get their diagonals as a centre stem rather than true diagonals,
   which is what every 5-wide bitmap font since the 1970s has done, because
   the alternative at this size is two letters that read as N and V. */
export const GLYPH_W = 5;
export const GLYPH_H = 6;
export const GLYPH_COLS = 31;

const G = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#'],
  B: ['####.', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.####', '#....', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '####.', '#....', '#....', '#....'],
  G: ['.####', '#....', '#..##', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '#####'],
  J: ['####.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '###..', '#..#.', '#...#', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '####.', '#..#.', '#...#', '#...#'],
  S: ['.####', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '.#.#.', '..#..', '..#..', '.#.#.', '#...#'],
  Y: ['#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#####'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.##..', '.##..'],
  ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....'],
  "'": ['..#..', '..#..', '.....', '.....', '.....', '.....'],
  0: ['.###.', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '...#.', '..#..', '.#...', '#####'],
  3: ['####.', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.'],
  5: ['#####', '#....', '####.', '....#', '#...#', '.###.'],
  6: ['..##.', '.#...', '#....', '####.', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '..#..', '..#..'],
  8: ['.###.', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '.####', '....#', '...#.', '.##..'],
  '?': ['.###.', '#...#', '...#.', '..#..', '.....', '..#..'],
};

/**
 * The glyph order on the sheet, read left to right then top to bottom.
 *
 * Row 0 is A-Z plus the five punctuation marks, which is exactly 31 and is
 * where the column count came from. Row 1 is the digits and the fallback.
 * Anything the character map cannot find renders the fallback, so an unknown
 * character shows as a question mark rather than as a hole in the readout.
 */
export const GLYPH_ORDER = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', ' ', '.', ':', '-', "'",
  ...'0123456789', '?',
];

export const GLYPH_ROWS = Math.ceil(GLYPH_ORDER.length / GLYPH_COLS);

/** The rectangles a glyph paints, in cell-local pixels, runs merged per row. */
export function glyphRects(char) {
  const rows = G[char] ?? G[Number(char)] ?? G['?'];
  const out = [];
  rows.forEach((row, y) => {
    let run = 0;
    for (let x = 0; x <= GLYPH_W; x += 1) {
      if (row[x] === '#') { run += 1; continue; }
      if (run) out.push({ x: x - run, y, w: run, h: 1 });
      run = 0;
    }
  });
  return out;
}
