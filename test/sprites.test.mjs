/**
 * The committed sheets against the font data they came from.
 *
 * assets/*.svg are generated and committed, which means there are two copies
 * of the same truth in the repo and one of them is the one people look at. A
 * hand edit to an SVG would work, would look right, and would be silently
 * undone by the next `npm run sprites`. This is what stops that.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  DIGIT_CELLS, DIGIT_H, DIGIT_W, digitRects,
  GLYPH_COLS, GLYPH_H, GLYPH_ORDER, GLYPH_ROWS, GLYPH_W, glyphRects,
} from '../assets/lcd-font.mjs';
import { digitSheet, glyphSheet } from '../scripts/build-sprites.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

describe('the readout sheets', () => {
  test('the committed digit sheet is what the font data draws', () => {
    assert.equal(read('assets/lcd-digits.svg'), digitSheet());
  });

  test('the committed glyph sheet is what the font data draws', () => {
    assert.equal(read('assets/lcd-glyphs.svg'), glyphSheet());
  });

  test('the geometry in the CSS matches the geometry in the data', () => {
    /* The cell sizes are written down twice: once as data here, once as
       tokens the CSS does its arithmetic with. They are not derived from each
       other, so nothing but this notices when one moves. Every glyph would
       shift by a fraction of a cell, which reads as a font that is subtly
       wrong rather than as a bug. */
    const css = read('css/components/lcd.css');
    const token = (name) => {
      const m = css.match(new RegExp(`${name}:\\s*([^;]+);`));
      assert.ok(m, `${name} is not declared`);
      return m[1].trim();
    };
    assert.equal(token('--pw-lcd-digit-w'), `${DIGIT_W}px`);
    assert.equal(token('--pw-lcd-digit-h'), `${DIGIT_H}px`);
    assert.equal(token('--pw-lcd-digit-cols'), String(DIGIT_CELLS.length));
    assert.equal(token('--pw-lcd-glyph-w'), `${GLYPH_W}px`);
    assert.equal(token('--pw-lcd-glyph-h'), `${GLYPH_H}px`);
    assert.equal(token('--pw-lcd-glyph-cols'), String(GLYPH_COLS));
    assert.equal(token('--pw-lcd-glyph-rows'), String(GLYPH_ROWS));
  });

  test('the scale is a whole number', () => {
    /* The sheet is a pixel grid. A fractional scale puts cell edges between
       device pixels, which tears a glyph rather than softening it. */
    const scale = read('css/components/lcd.css').match(/--pw-lcd-scale:\s*([^;]+);/)[1].trim();
    assert.match(scale, /^\d+$/, `--pw-lcd-scale is ${scale}, which is not a whole number`);
  });

  test('cells 0 to 11 are Winamp\'s numbers.bmp layout', () => {
    /* The order is sourced, not chosen, and assets/README.md says which half
       is which. Reordering it would be reasonable-looking and wrong. */
    assert.deepEqual(DIGIT_CELLS.slice(0, 12).map((c) => c.char),
      ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ' ', '-']);
  });

  test('every glyph in the order actually draws something, except space', () => {
    /* A missing entry in the letterform table falls back to `?` rather than
       throwing, which is right at runtime and would hide a typo here. */
    for (const ch of GLYPH_ORDER) {
      const rects = glyphRects(ch);
      if (ch === ' ') { assert.equal(rects.length, 0, 'space should draw nothing'); continue; }
      assert.ok(rects.length > 0, `${JSON.stringify(ch)} draws nothing`);
    }
  });

  test('no glyph paints outside its own cell', () => {
    /* A rect a pixel wide of the cell bleeds into its neighbour on the sheet,
       and the mask offset would then show a sliver of the wrong letter. */
    for (const ch of GLYPH_ORDER) {
      for (const r of glyphRects(ch)) {
        assert.ok(r.x >= 0 && r.x + r.w <= GLYPH_W, `${ch} overflows the cell horizontally`);
        assert.ok(r.y >= 0 && r.y + r.h <= GLYPH_H, `${ch} overflows the cell vertically`);
      }
    }
    for (const cell of DIGIT_CELLS) {
      for (const r of digitRects(cell)) {
        assert.ok(r.x >= 0 && r.x + r.w <= DIGIT_W, `${cell.char} overflows the cell horizontally`);
        assert.ok(r.y >= 0 && r.y + r.h <= DIGIT_H, `${cell.char} overflows the cell vertically`);
      }
    }
  });
});
