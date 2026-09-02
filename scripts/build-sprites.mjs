/**
 * Draw the two readout sheets from assets/lcd-font.mjs.
 *
 * SVG rather than the BMP or PNG the original used, and used as a mask
 * rather than as a background image. Same mechanic either way: the cell is
 * chosen by stepping an offset across the sheet. What the mask buys is that
 * the ink stops being baked into the file. The painted colour becomes
 * --pw-color-lcd-content, which is a token the contrast gate can name in a
 * pair, which a second skin can re-tint without shipping a second asset, and
 * which forced-colors mode can override. A background image is none of those
 * things; it is a picture of a colour.
 *
 * Output is committed. test/sprites.test.mjs redraws and compares, so a sheet
 * edited by hand instead of through the font data fails rather than silently
 * becoming the source of truth.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DIGIT_CELLS, DIGIT_H, DIGIT_W, digitRects,
  GLYPH_COLS, GLYPH_H, GLYPH_ORDER, GLYPH_ROWS, GLYPH_W, glyphRects,
} from '../assets/lcd-font.mjs';
import {
  ICON_COLS, ICON_H, ICON_ORDER, ICON_ROWS, ICON_W, iconRects,
} from '../assets/icon-font.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(HERE, '..', 'assets');

const rect = ({ x, y, w, h }, dx, dy) =>
  `<rect x="${x + dx}" y="${y + dy}" width="${w}" height="${h}"/>`;

/**
 * A sheet is one <svg> of flat rects on a transparent ground.
 *
 * No <g>, no transform, no viewBox scaling: the mask steps by whole pixels
 * and every edge has to land on the pixel grid it was authored on. A
 * transform would introduce a rounding step between the data and the paint.
 */
function sheet(width, height, body) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"`,
    ` viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges" fill="#000">`,
    body.join(''),
    '</svg>',
    '',
  ].join('\n');
}

export function digitSheet() {
  const body = DIGIT_CELLS.map((cell, i) =>
    digitRects(cell).map((r) => rect(r, i * DIGIT_W, 0)).join(''));
  return sheet(DIGIT_CELLS.length * DIGIT_W, DIGIT_H, body);
}

export function glyphSheet() {
  const body = GLYPH_ORDER.map((char, i) => {
    const dx = (i % GLYPH_COLS) * GLYPH_W;
    const dy = Math.floor(i / GLYPH_COLS) * GLYPH_H;
    return glyphRects(char).map((r) => rect(r, dx, dy)).join('');
  });
  return sheet(GLYPH_COLS * GLYPH_W, GLYPH_ROWS * GLYPH_H, body);
}

export function iconSheet() {
  const body = ICON_ORDER.map((name, i) => {
    const dx = (i % ICON_COLS) * ICON_W;
    const dy = Math.floor(i / ICON_COLS) * ICON_H;
    return iconRects(name).map((r) => rect(r, dx, dy)).join('');
  });
  return sheet(ICON_COLS * ICON_W, ICON_ROWS * ICON_H, body);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(join(ASSETS, 'lcd-digits.svg'), digitSheet());
  writeFileSync(join(ASSETS, 'lcd-glyphs.svg'), glyphSheet());
  writeFileSync(join(ASSETS, 'icons.svg'), iconSheet());
  console.log(`lcd-digits.svg  ${DIGIT_CELLS.length * DIGIT_W}x${DIGIT_H}, ${DIGIT_CELLS.length} cells`);
  console.log(`lcd-glyphs.svg  ${GLYPH_COLS * GLYPH_W}x${GLYPH_ROWS * GLYPH_H}, ${GLYPH_ORDER.length} glyphs in ${GLYPH_COLS}x${GLYPH_ROWS}`);
  console.log(`icons.svg       ${ICON_COLS * ICON_W}x${ICON_ROWS * ICON_H}, ${ICON_ORDER.length} icons in ${ICON_COLS}x${ICON_ROWS}`);
}
