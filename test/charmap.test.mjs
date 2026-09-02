/**
 * src/charmap.ts against assets/lcd-font.mjs.
 *
 * The two state the same orders in two languages, because the font data is
 * plain ESM the generator can run without a build and the component layer is
 * TypeScript compiled out of src/. Importing across that line would drag the
 * asset directory into dist.
 *
 * So this is the test that makes the duplication safe. Without it, adding a
 * cell to the sheet and forgetting the map does not fail anywhere: the
 * readout keeps rendering, one character off, for every character after the
 * one that moved.
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { DIGIT_CELLS, GLYPH_COLS, GLYPH_ORDER } from '../assets/lcd-font.mjs';
import { ORDERS, digitCell, glyphCell } from '../dist/charmap.js';

describe('the character map matches the font data', () => {
  test('digit order is identical', () => {
    assert.equal(ORDERS.DIGITS, DIGIT_CELLS.map((c) => c.char).join(''));
  });

  test('glyph order is identical', () => {
    assert.equal(ORDERS.GLYPHS, GLYPH_ORDER.join(''));
  });

  test('the column count is identical', () => {
    assert.equal(ORDERS.GLYPH_COLS, GLYPH_COLS);
  });

  test('every character resolves to the cell the sheet drew it in', () => {
    /* Walks both sheets rather than spot-checking. A spot check on "0" and
       "A" passes even when everything after the tenth cell has shifted. */
    DIGIT_CELLS.forEach((cell, i) => {
      assert.deepEqual(digitCell(cell.char), { x: i, y: 0 }, `digit ${cell.char}`);
    });
    GLYPH_ORDER.forEach((char, i) => {
      assert.deepEqual(glyphCell(char),
        { x: i % GLYPH_COLS, y: Math.floor(i / GLYPH_COLS) }, `glyph ${char}`);
    });
  });

  test('an unmappable character falls back rather than disappearing', () => {
    /* A hole in a readout reads as a bug. A blank or a question mark reads as
       a character the display cannot show, which is what happened. */
    assert.deepEqual(digitCell('Z'), digitCell(' '));
    assert.deepEqual(glyphCell('€'), glyphCell('?'));
  });

  test('glyphs are case insensitive', () => {
    assert.deepEqual(glyphCell('a'), glyphCell('A'));
  });
});
