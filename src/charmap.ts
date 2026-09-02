/**
 * Character to sprite cell.
 *
 * The sheets are generated from assets/lcd-font.mjs, which is plain ESM so
 * the generator and its tests can use it without a build. This file states
 * the same two orders again in TypeScript rather than importing that module,
 * because importing it would pull a .mjs outside rootDir into the compiled
 * output and drag the whole asset directory into dist.
 *
 * So it is duplication, and it is checked: test/charmap.test.mjs asserts both
 * orders match the font data exactly, character for character. Duplication
 * that a test holds is a different thing from duplication that is hoped for.
 *
 * Two integers come out rather than one index, because the CSS multiplies
 * them by the cell size to get a mask offset. CSS mod() and round() could do
 * the row and column split from a single number, but they only reached Chrome
 * in 125, and this map has to exist here anyway.
 */

export interface Cell {
  x: number;
  y: number;
}

/* Cells 0 to 11 are Winamp's numbers.bmp layout, including the blank and the
   minus. 12 and 13 are ours. assets/README.md says which is which. */
const DIGITS = '0123456789 -:.';

/* Row 0 is A-Z plus five marks, which is 31 and is where the column count
   comes from. Row 1 is the digits and the fallback. */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ .:-'0123456789?";
const GLYPH_COLS = 31;

/** The blank cell, which is what an unmappable character becomes. */
const DIGIT_BLANK = DIGITS.indexOf(' ');
/** The `?` cell. A hole in a readout reads as a bug; a question mark reads
    as a character the display cannot show, which is what happened. */
const GLYPH_FALLBACK = GLYPHS.indexOf('?');

export function digitCell(char: string): Cell {
  const i = DIGITS.indexOf(char);
  return { x: i === -1 ? DIGIT_BLANK : i, y: 0 };
}

export function glyphCell(char: string): Cell {
  const i = GLYPHS.indexOf(char.toUpperCase());
  const n = i === -1 ? GLYPH_FALLBACK : i;
  return { x: n % GLYPH_COLS, y: Math.floor(n / GLYPH_COLS) };
}

/** Exposed so the test can compare these against the font data. */
export const ORDERS = { DIGITS, GLYPHS, GLYPH_COLS } as const;
