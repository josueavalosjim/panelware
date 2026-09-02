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

describe('the drawings, not just the pipeline', () => {
  /* Everything above this point tests the machinery: that the sheet matches
     the data, the index matches the generator, nothing bleeds between cells.
     None of it looks at the shapes, and three comments in icon-font.mjs
     turned out to be describing drawings that did not do what they said.

     A comment is the design documentation in this repo, so a comment that
     lies is worse than an undocumented decision: it makes the defect
     invisible to review. These assert the claims instead. */
  const grid = (name) => {
    const g = Array.from({ length: ICON_H }, () => Array(ICON_W).fill(0));
    for (const r of iconRects(name)) {
      for (let x = r.x; x < r.x + r.w; x += 1) for (let y = r.y; y < r.y + r.h; y += 1) g[y][x] = 1;
    }
    return g;
  };
  const same = (a, b) => a.every((row, y) => row.every((v, x) => v === b[y][x]));
  const rot90 = (g) => g[0].map((_, x) => g.map((row) => row[x]).reverse());
  const flipX = (g) => g.map((row) => [...row].reverse());
  const bbox = (g) => {
    let x0 = 99, x1 = -1, y0 = 99, y1 = -1;
    g.forEach((row, y) => row.forEach((v, x) => {
      if (!v) return;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x);
      y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }));
    return { x0, x1, y0, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  };

  test('the four chevrons really are one shape turned four ways', () => {
    /* They were not. The vertical pair measured 12x7 and the horizontal pair
       6x10, and a 90 degree turn of 12x7 is 7x12. */
    /* Clockwise, which is the order the derivation actually turns them in:
       down, left, up, right. Writing the chain in the wrong order here is
       how the two horizontal chevrons ended up swapped in the first place. */
    let g = grid('chevron-down');
    for (const next of ['chevron-left', 'chevron-up', 'chevron-right']) {
      g = rot90(g);
      assert.ok(same(g, grid(next)), `${next} is not the previous chevron rotated`);
    }
  });

  test('next really is prev mirrored', () => {
    /* It was not. Every one of the twelve rows differed, the bar-to-triangle
       gap was 2px in one and 1px in the other, and the two shapes were 10
       and 9 pixels wide. */
    assert.ok(same(flipX(grid('prev')), grid('next')));
  });

  test('a triangle that claims a two-pixel apex has an even height', () => {
    /* A shape symmetric about the middle of an odd number of rows has one
       middle row, so its point is one pixel wide however it is drawn. */
    for (const name of ['play', 'prev', 'next']) {
      const g = grid(name);
      const widths = g.map((row) => row.reduce((a, v) => a + v, 0));
      const widest = Math.max(...widths);
      assert.equal(widths.filter((w) => w === widest).length, 2,
        `${name}'s apex is not two rows`);
    }
  });

  test('a shape symmetric on an axis has an even size on that axis', () => {
    /* An odd dimension in an even grid cannot be centred: it sits half a
       pixel off. Only shapes that are actually symmetric are held to this,
       because a right-pointing triangle is not symmetric horizontally and
       has no business being centred there. */
    for (const name of ['stop', 'dot', 'close', 'maximize', 'restore', 'pause']) {
      const { w, h } = bbox(grid(name));
      assert.equal(w % 2, 0, `${name} is ${w} wide, which cannot centre`);
      assert.equal(h % 2, 0, `${name} is ${h} tall, which cannot centre`);
    }
  });

  test('a stroke does not fatten as it converges', () => {
    /* The wedge signature. check used to run 2 3 3 5 6 6 6 4 2: the ink
       climbs steadily toward the vertex, which is a tick turning into a blob.
       It runs 2 2 2 4 4 4 2 now, where the 4s are the two arms lying
       adjacent at the meeting point.

       The rule is a ratio rather than a ceiling, because close is an X whose
       strokes CROSS and whose rows legitimately carry more ink at the
       crossing. Its profile is 4 6 6 6 4 4 6 6 6 4, a ratio of 1.5. The old
       check was 3. Anything up to double is two strokes touching; beyond
       that the stroke itself is growing. */
    for (const name of ['check', 'close']) {
      const g = grid(name);
      const perRow = g.map((row) => row.reduce((a, v) => a + v, 0)).filter(Boolean);
      const ratio = Math.max(...perRow) / Math.min(...perRow);
      assert.ok(ratio <= 2,
        `${name}'s ink swells ${ratio}x across its rows, so the stroke thickens: ${perRow.join(' ')}`);
    }
  });

  test('every glyph but play keeps the 12x12 live area', () => {
    /* 2px of trim on a 16px cell, which is the construction Fluent's own
       16px icons use. play is the documented exception: a triangle filling
       the same box as a square reads lighter, so it overshoots on purpose,
       the way Material gives a circle 20 units against a square's 18. */
    for (const name of ICON_ORDER) {
      if (name === 'play') continue;
      const { x0, x1, y0, y1 } = bbox(grid(name));
      assert.ok(x0 >= 2 && x1 <= 13 && y0 >= 2 && y1 <= 13,
        `${name} leaves the live area: x ${x0}-${x1}, y ${y0}-${y1}`);
    }
  });
});

describe('a chevron points where its name says', () => {
  /* The rotation test above cannot catch this. Four glyphs can be exact
     rotations of one another and still be labelled the wrong way round, and
     two of them were: rot90 turns clockwise, so the first turn of a down
     chevron points left, and it had been assigned to chevron-right.

     This asks the shape itself. A chevron's tip is the row or column where
     its ink reaches furthest in the direction it names, and that tip sits on
     the middle of the perpendicular axis. */
  const grid = (name) => {
    const g = Array.from({ length: ICON_H }, () => Array(ICON_W).fill(0));
    for (const r of iconRects(name)) {
      for (let x = r.x; x < r.x + r.w; x += 1) for (let y = r.y; y < r.y + r.h; y += 1) g[y][x] = 1;
    }
    return g;
  };

  const tip = (g, dir) => {
    const ink = [];
    g.forEach((row, y) => row.forEach((v, x) => { if (v) ink.push({ x, y }); }));
    if (dir === 'down') return Math.max(...ink.map((p) => p.y));
    if (dir === 'up') return Math.min(...ink.map((p) => p.y));
    if (dir === 'right') return Math.max(...ink.map((p) => p.x));
    return Math.min(...ink.map((p) => p.x));
  };

  for (const [name, dir, axis] of [
    ['chevron-down', 'down', 'y'], ['chevron-up', 'up', 'y'],
    ['chevron-right', 'right', 'x'], ['chevron-left', 'left', 'x'],
  ]) {
    test(`${name} reaches furthest ${dir}`, () => {
      const g = grid(name);
      const edge = tip(g, dir);
      /* The pixels at the extreme are the tip, and they must sit around the
         middle of the other axis. A chevron pointing the wrong way has its
         extreme pixels at the two ends of that axis instead. */
      const at = [];
      g.forEach((row, y) => row.forEach((v, x) => {
        if (!v) return;
        if (axis === 'y' && y === edge) at.push(x);
        if (axis === 'x' && x === edge) at.push(y);
      }));
      const centre = (Math.min(...at) + Math.max(...at)) / 2;
      assert.ok(Math.abs(centre - (ICON_W - 1) / 2) <= 1,
        `${name}'s furthest-${dir} ink sits at ${centre}, not near the middle: it points the other way`);
      assert.ok(at.length <= 4, `${name}'s tip is ${at.length} pixels wide, so it is a flat edge, not a point`);
    });
  }
});
