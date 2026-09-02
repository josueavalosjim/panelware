/**
 * The icon sheet, its generated index, and the badge that now uses it.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { ICON_COLS, ICON_H, ICON_NAMES, ICON_ORDER, ICON_ROWS, ICON_W, iconRects } from '../assets/icon-font.mjs';
import { iconSheet } from '../scripts/build-sprites.mjs';
import { iconsIndex } from '../scripts/build-icons-index.mjs';
import { ICON_INDEX, ICON_NAMES as INDEX_NAMES } from '../dist/icons.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

describe('the icon sheet', () => {
  test('the committed sheet is what the font data draws', () => {
    assert.equal(read('assets/icons.svg'), iconSheet());
  });

  test('the generated index is what the generator writes', () => {
    /* A generator nobody runs is a hand-kept copy with a misleading comment
       at the top. This is what makes the "GENERATED" claim true. */
    assert.equal(read('src/icons.ts'), iconsIndex());
  });

  test('every icon drawn is on the sheet, and nothing on the sheet is undrawn', () => {
    /* An icon in the table but not the order renders nowhere and nothing
       says so. One in the order but not the table throws at build time,
       which is the good direction to fail in, but worth pinning both. */
    assert.deepEqual([...ICON_ORDER].sort(), [...ICON_NAMES].sort());
  });

  test('the index agrees with the sheet, cell for cell', () => {
    ICON_ORDER.forEach((name, i) => {
      assert.deepEqual(ICON_INDEX[name],
        { x: i % ICON_COLS, y: Math.floor(i / ICON_COLS) }, name);
    });
    assert.deepEqual([...INDEX_NAMES], [...ICON_ORDER]);
  });

  test('no icon paints outside its own cell', () => {
    /* A rect a pixel wide of the cell bleeds into its neighbour on the sheet,
       and the mask offset then shows a sliver of the wrong icon. */
    for (const name of ICON_NAMES) {
      for (const r of iconRects(name)) {
        assert.ok(r.x >= 0 && r.x + r.w <= ICON_W, `${name} overflows horizontally`);
        assert.ok(r.y >= 0 && r.y + r.h <= ICON_H, `${name} overflows vertically`);
      }
    }
  });

  test('every icon actually draws something', () => {
    for (const name of ICON_NAMES) {
      assert.ok(iconRects(name).length > 0, `${name} is blank`);
    }
  });

  test('the geometry in the CSS matches the geometry in the data', () => {
    const css = read('css/components/icon.css');
    const token = (n) => css.match(new RegExp(`${n}:\\s*([^;]+);`))[1].trim();
    assert.equal(token('--pw-icon-w'), `${ICON_W}px`);
    assert.equal(token('--pw-icon-h'), `${ICON_H}px`);
    assert.equal(token('--pw-icon-cols'), String(ICON_COLS));
    assert.equal(token('--pw-icon-rows'), String(ICON_ROWS));
  });

  test('the icon scale is a whole number', () => {
    /* The sheet is a pixel grid. A fractional scale puts cell edges between
       device pixels, which tears a glyph rather than softening it. */
    const scale = read('css/components/icon.css').match(/--pw-icon-scale:\s*([^;]+);/)[1].trim();
    assert.match(scale, /^\d+$/, `--pw-icon-scale is ${scale}`);
  });
});
