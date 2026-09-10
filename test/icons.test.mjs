/**
 * The icon sheet, its generated index, and the badge that now uses it.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { withGallery } from '../scripts/build-icon-gallery.mjs';
import { ICON_COLS, ICON_H, ICON_NAMES, ICON_ORDER, ICON_ROWS, ICON_W, iconRects } from '../assets/icon-font.mjs';
import { SKIN_SHEETS, iconSheet } from '../scripts/build-sprites.mjs';
import { SKIN_FONTS, iconsCss, iconsIndex, skinIconsCss } from '../scripts/build-icons-index.mjs';
import * as baseFont from '../assets/icon-font.mjs';
import * as cyberFont from '../assets/icon-font.cyber.mjs';
import * as paperFont from '../assets/icon-font.paper.mjs';
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

  test('the generated CSS is what the generator writes', () => {
    assert.equal(read('css/components/icon-index.css'), iconsCss());
  });

  test('every icon can be named from markup, at the cell the index gives it', () => {
    /* The component reads ICON_INDEX and writes the cell inline. Hand-written
       markup could not: the mapping was TypeScript, and CSS cannot read
       TypeScript, so the CSS-only half of this kit carried sprite coordinates
       by hand and got them by reading the source of a generated file.

       Both halves come from one generator now, and this is the comparison
       that says so. Testing the comparison rather than the run, which is the
       rule this repo learned from the parity hole: the browser applying a
       rule is check:cssom's job, and it does that too, because a selector
       that matches nothing renders cell 0,0 rather than an error. */
    const css = iconsCss();
    for (const name of INDEX_NAMES) {
      const cell = ICON_INDEX[name];
      const rule = css.match(
        new RegExp(`\\.pw-icon\\[data-icon="${name}"\\] \\{([^}]*)\\}`),
      );
      assert.ok(rule, `no data-icon rule for ${name}`);
      for (const [prop, want] of [
        ['--pw-icon-x', cell.x], ['--pw-icon-y', cell.y],
        ['--pw-icon-ink-l', cell.l], ['--pw-icon-ink-r', cell.r],
      ]) {
        assert.match(rule[1], new RegExp(`${prop}: ${want};`),
          `${name}'s ${prop} is not ${want}`);
      }
    }
    /* The bundle is what a consumer links, so the rules have to reach it. */
    const bundle = read('css/panelware.css');
    const named = new Set([...bundle.matchAll(/\[data-icon="([a-z0-9-]+)"\]/g)].map((m) => m[1]));
    assert.deepEqual([...named].sort(), [...INDEX_NAMES].sort());
  });

  test('every icon drawn is on the sheet, and nothing on the sheet is undrawn', () => {
    /* An icon in the table but not the order renders nowhere and nothing
       says so. One in the order but not the table throws at build time,
       which is the good direction to fail in, but worth pinning both. */
    assert.deepEqual([...ICON_ORDER].sort(), [...ICON_NAMES].sort());
  });

  test('the index agrees with the sheet, cell for cell', () => {
    /* deepEqual on the whole entry rather than on its coordinates, so a field
       added to the index has to be accounted for here rather than silently
       riding along. It caught the ink bearings the day they were added, which
       is the behaviour worth keeping. */
    ICON_ORDER.forEach((name, i) => {
      const rects = iconRects(name);
      const left = Math.min(...rects.map((r) => r.x));
      const right = Math.max(...rects.map((r) => r.x + r.w));
      assert.deepEqual(ICON_INDEX[name], {
        x: i % ICON_COLS,
        y: Math.floor(i / ICON_COLS),
        l: left,
        r: ICON_W - right,
      }, name);
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

  test('next really is previous mirrored', () => {
    /* It was not. Every one of the twelve rows differed, the bar-to-triangle
       gap was 2px in one and 1px in the other, and the two shapes were 10
       and 9 pixels wide. */
    assert.ok(same(flipX(grid('previous')), grid('next')));
  });

  test('a triangle that claims a two-pixel apex has an even height', () => {
    /* A shape symmetric about the middle of an odd number of rows has one
       middle row, so its point is one pixel wide however it is drawn. */
    for (const name of ['play', 'previous', 'next']) {
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

  test('no two parts of a glyph meet at a corner and nowhere else', () => {
    /* An eight-connected join. search's handle met its ring at a single
       diagonal pixel with both orthogonal neighbours empty, which is the one
       place in the whole set two parts of a mark touched without sharing an
       edge. A corner join has no width: it survives at 11x and can render as
       a break at 1x, and a magnifier whose handle looks detached from its
       lens has stopped being a magnifier.

       Separate parts are fine and there are several: the question mark's
       dot, the pause bars, eject's triangle over its bar. Those are clearly
       apart. The defect is two regions close enough to read as joined while
       being joined by nothing.

       One instance in thirty-two glyphs, so this is the set's own rule
       written down rather than a new one imposed on it. */
    const offenders = [];
    for (const name of ICON_NAMES) {
      const g = grid(name);
      /* Four-connected components, so "different region" is decidable. */
      const id = Array.from({ length: ICON_H }, () => Array(ICON_W).fill(-1));
      let next = 0;
      for (let y = 0; y < ICON_H; y += 1) {
        for (let x = 0; x < ICON_W; x += 1) {
          if (!g[y][x] || id[y][x] >= 0) continue;
          const stack = [[x, y]];
          id[y][x] = next;
          while (stack.length) {
            const [cx, cy] = stack.pop();
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const nx = cx + dx, ny = cy + dy;
              if (nx < 0 || ny < 0 || nx >= ICON_W || ny >= ICON_H) continue;
              if (g[ny][nx] && id[ny][nx] < 0) { id[ny][nx] = next; stack.push([nx, ny]); }
            }
          }
          next += 1;
        }
      }
      for (let y = 0; y < ICON_H; y += 1) {
        for (let x = 0; x < ICON_W - 1; x += 1) {
          for (const [dx, dy] of [[1, 1], [1, -1]]) {
            const nx = x + dx, ny = y + dy;
            if (ny < 0 || ny >= ICON_H) continue;
            if (!g[y][x] || !g[ny][nx]) continue;
            /* An edge connector anywhere around the corner makes it a join. */
            if (g[y][nx] || g[ny][x]) continue;
            if (id[y][x] !== id[ny][nx]) {
              offenders.push(`${name}: (${x},${y}) touches (${nx},${ny}) only at a corner`);
            }
          }
        }
      }
    }
    assert.deepEqual(offenders, []);
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
  test('the spinner frames are one whole row, starting at its left edge', () => {
    /* The animation walks mask-position across a row and reads the row off
       --pw-icon-y, which the component sets. That is what keeps it from
       naming a row number the generator owns, and it is only true while the
       eight frames are consecutive and start at column zero. Reorder the
       sheet without this and the spinner cycles through eject and close. */
    const first = ICON_ORDER.indexOf('spinner-1');
    assert.notEqual(first, -1);
    assert.equal(first % ICON_COLS, 0, 'the spin does not start at a row edge');
    assert.equal(ICON_COLS, 8, 'the step count in the CSS is 8');
    for (let k = 1; k <= 8; k += 1) {
      assert.equal(ICON_ORDER[first + k - 1], `spinner-${k}`, `frame ${k} is out of order`);
    }
  });

  test('the second half of the spin is the first half turned around', () => {
    /* Frames 5 to 8 are derived, so this is really asking whether the
       derivation is the one claimed: a half turn, which is two exact quarter
       turns on a square lattice. A 45 degree turn is not exact, which is why
       there are eight drawn positions and not one rotated glyph. */
    const grid = (n) => {
      const g = Array.from({ length: ICON_H }, () => '.'.repeat(ICON_W).split(''));
      for (const r of iconRects(n)) for (let i = 0; i < r.w; i += 1) g[r.y][r.x + i] = '#';
      return g.map((r) => r.join(''));
    };
    const rot180 = (r) => r.map((row) => [...row].reverse().join('')).reverse();
    for (let k = 1; k <= 4; k += 1) {
      assert.deepEqual(grid(`spinner-${k + 4}`), rot180(grid(`spinner-${k}`)), `frame ${k + 4}`);
    }
  });

  test('info is exclamation upside down', () => {
    /* Both are drawn, so neither owns the other's placement, and this is the
       thing that would silently stop being true if one were nudged: they
       share a live area and a dot row, and an i whose stem is a pixel off an
       exclamation's reads as a different weight in the same row. */
    const bbox = (n) => {
      const rs = iconRects(n);
      const top = Math.min(...rs.map((r) => r.y));
      const bottom = Math.max(...rs.map((r) => r.y));
      const g = Array.from({ length: bottom - top + 1 }, () => '.'.repeat(ICON_W).split(''));
      for (const r of rs) for (let i = 0; i < r.w; i += 1) g[r.y - top][r.x + i] = '#';
      return g.map((r) => r.join(''));
    };
    assert.deepEqual(bbox('info'), [...bbox('exclamation')].reverse());
  });

  test('plus is minus and its own quarter turn', () => {
    /* Derived, so the pair cannot end up with different stroke widths or
       different extents, which is the whole reason they read as a pair in a
       tree view. */
    const xs = (n) => iconRects(n).flatMap((r) => [r.x, r.x + r.w - 1]);
    const ys = (n) => iconRects(n).map((r) => r.y);
    assert.equal(Math.min(...xs('plus')), Math.min(...xs('minus')));
    assert.equal(Math.max(...xs('plus')), Math.max(...xs('minus')));
    assert.equal(Math.max(...ys('plus')) - Math.min(...ys('plus')),
      Math.max(...xs('plus')) - Math.min(...xs('plus')), 'plus is not square');
  });

  test('the demo gallery shows every icon, and is generated', () => {
    /* It was hand-written and listed seventeen of nineteen. The miss is
       silent: a gallery missing a glyph looks exactly like a complete one. */
    const page = read('demo/states.html');
    assert.equal(page, withGallery(page), 'demo/states.html has drifted, run npm run generate');
    for (const name of ICON_ORDER) {
      assert.ok(page.includes(`>${name}</span>`), `${name} is not in the gallery`);
    }
  });
  test('the README states the sheet size it actually generates', () => {
    /* It said 128x48 and seventeen cells while the sheet was 128x64 with
       thirty-two, which is the third hand-kept copy of the icon set found
       stale in one afternoon. The other two are now generated; this one is
       prose, so it gets a guard instead. */
    const doc = read('assets/README.md');
    const w = ICON_COLS * ICON_W;
    const h = ICON_ROWS * ICON_H;
    assert.ok(doc.includes(`${w}x${h}`), `README does not say ${w}x${h}`);
    const svg = read('assets/icons.svg');
    assert.ok(svg.includes(`viewBox="0 0 ${w} ${h}"`), 'the sheet is not that size');
  });
  test('the README states the transport ink it actually draws', () => {
    /* It said "pulled in to 9x9" and "49, 72 and 81 pixels" while the drawing
       is an 8x8 square and 56, 72, 64. That paragraph opens by warning it is
       "the kind of thing that gets corrected later", which is exactly what
       makes a wrong number in it expensive: it tells the next reader not to
       touch the drawing to match. A 9x9 square would also fail the even-size
       test above, so the README documented a mark this suite forbids.

       Measured from the same rects the sheet is drawn from, so redrawing a
       transport mark fails here until the prose is updated with it. */
    /* Whitespace-normalised, because the claim is a sentence in wrapped prose
       and a line break landing mid-phrase is not a drift worth failing on. */
    const doc = read('assets/README.md').replace(/\s+/g, ' ');
    const ink = (name) => iconRects(name).reduce((n, r) => n + r.w * r.h, 0);
    const size = (name) => {
      const rects = iconRects(name);
      const x = Math.min(...rects.map((r) => r.x));
      const y = Math.min(...rects.map((r) => r.y));
      return [Math.max(...rects.map((r) => r.x + r.w)) - x,
        Math.max(...rects.map((r) => r.y + r.h)) - y];
    };
    assert.ok(doc.includes(`play ${ink('play')}, pause ${ink('pause')} and stop ${ink('stop')}`),
      `README does not state the ink it draws: play ${ink('play')}, pause ${ink('pause')}, `
      + `stop ${ink('stop')}`);
    assert.ok(doc.includes(`pulled in to ${size('stop').join('x')}`),
      `README does not state stop's ${size('stop').join('x')}`);
    assert.ok(doc.includes(`tall and narrow at ${size('play').join('x')}`),
      `README does not state play's ${size('play').join('x')}`);
  });

  test('the index carries each glyph\'s ink bearings, measured not guessed', () => {
    /* Every icon is a 16x16 cell and almost none fill it. The check is 12
       pixels of ink with 2 either side; the exclamation is 2 with 7. A badge
       laying them out with one gap value measured identically and read nothing
       alike: 10px of inset before the check against 15 before the exclamation.

       The bearings are generated from the same rects the sheet is drawn from,
       so a redrawn glyph brings its own correction. This checks they are the
       real measurement rather than a copied number. */
    for (const name of ICON_ORDER) {
      const cell = ICON_INDEX[name];
      const rects = iconRects(name);
      assert.ok(rects.length, `${name} draws nothing`);
      const left = Math.min(...rects.map((r) => r.x));
      const right = Math.max(...rects.map((r) => r.x + r.w));
      assert.equal(cell.l, left, `${name} left bearing`);
      assert.equal(cell.r, ICON_W - right, `${name} right bearing`);
      assert.ok(cell.l + cell.r < ICON_W, `${name} bearings cover the whole cell`);
    }
  });

  test('the badge subtracts the bearing so the optical gap is even', () => {
    /* Verified in a browser at the time: all four badges went from 10/6, 15/11,
       11/7 and 13/9 pixels of edge-to-ink and ink-to-word to exactly 8 and 4.
       The rule reads the bearings off the element rather than naming glyphs,
       so a new mark needs no rule and a redrawn one needs no edit. */
    const css = read('css/components/badge.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const rule = css.match(/\.pw-badge \.pw-icon\s*\{[^}]*\}/);
    assert.ok(rule, 'the badge does not compensate for its mark\'s bearings');
    assert.match(rule[0], /margin-left:\s*calc\([^)]*--pw-icon-ink-l/);
    assert.match(rule[0], /margin-right:\s*calc\([^)]*--pw-icon-ink-r/);
    /* Scaled, or the correction is wrong at --pw-icon-scale: 2. */
    assert.match(rule[0], /--pw-icon-scale/);
    /* And something has to declare what the badge subtracts. That used to be
       icon.tsx, inline; it is the generated index now, because inline beat
       every layer and a skin with its own sheet could not correct a bearing
       welded into the markup. */
    assert.match(read('css/components/icon-index.css'), /--pw-icon-ink-l:\s*\d+/);
  });
});

describe('every sheet, not just the first one', () => {
  /* A skin may point --pw-icon-sheet at its own drawings, and the moment a
     second set exists every rule the first set is held to becomes a rule
     about the first set only. That is the shape of mistake this repo keeps
     finding: a check that names a fixed set, asked nothing about what happens
     when the set grows.

     So the set-level invariants run over every sheet here. The chrome sheet
     is in the list too, deliberately, because a test that only ever runs
     against the new thing stops covering the old one. */
  const SHEETS = [
    ['chrome', baseFont],
    ['cyber', cyberFont],
    ['paper', paperFont],
  ];

  const gridOf = (font, name) => {
    const g = Array.from({ length: ICON_H }, () => Array(ICON_W).fill(0));
    for (const r of font.iconRects(name)) {
      for (let x = r.x; x < r.x + r.w; x += 1) g[r.y][x] = 1;
    }
    return g;
  };
  const boxOf = (g) => {
    let x0 = 99, x1 = -1, y0 = 99, y1 = -1;
    g.forEach((row, y) => row.forEach((v, x) => {
      if (!v) return;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x);
      y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }));
    return { x0, x1, y0, y1 };
  };

  test('there is more than one sheet to compare', () => {
    /* The precondition. Every test below is vacuously true of a list of one,
       and this file has already shipped a test that passed while measuring
       nothing. */
    assert.ok(SHEETS.length >= 2, `only ${SHEETS.length} sheet, so the rest of this compares nothing`);
  });

  test('every sheet draws every name, and no name the order does not have', () => {
    /* The cell a name resolves to is its index in ICON_ORDER, so a sheet that
       drew a different set would paint every name after the difference as its
       neighbour. Nothing would error. */
    for (const [skin, font] of SHEETS) {
      assert.deepEqual([...font.ICON_NAMES].sort(), [...ICON_ORDER].sort(), skin);
    }
  });

  test('every sheet fills the cell it is given and no more', () => {
    for (const [skin, font] of SHEETS) {
      for (const name of ICON_ORDER) {
        const rects = font.iconRects(name);
        assert.ok(rects.length > 0, `${skin}: ${name} is blank`);
        for (const r of rects) {
          assert.ok(r.x >= 0 && r.x + r.w <= ICON_W, `${skin}: ${name} overflows horizontally`);
          assert.ok(r.y >= 0 && r.y + r.h <= ICON_H, `${skin}: ${name} overflows vertically`);
        }
      }
    }
  });

  test('every sheet keeps the 12x12 live area, play excepted', () => {
    for (const [skin, font] of SHEETS) {
      for (const name of ICON_ORDER) {
        if (name === 'play') continue;
        const { x0, x1, y0, y1 } = boxOf(gridOf(font, name));
        assert.ok(x0 >= 2 && x1 <= 13 && y0 >= 2 && y1 <= 13,
          `${skin}: ${name} leaves the live area: x ${x0}-${x1}, y ${y0}-${y1}`);
      }
    }
  });

  test('no sheet joins two parts of a glyph at a corner and nowhere else', () => {
    /* The rule that constrains a thin set hardest, and the reason the cyber
       diagonals are staircases two pixels wide where they turn. A one-pixel
       diagonal is not a stroke on this lattice: it is a column of pixels
       touching at their corners, which survives at 11x and renders as a
       dotted line at 1x. */
    const offenders = [];
    for (const [skin, font] of SHEETS) {
      for (const name of ICON_ORDER) {
        const g = gridOf(font, name);
        const id = Array.from({ length: ICON_H }, () => Array(ICON_W).fill(-1));
        let next = 0;
        for (let y = 0; y < ICON_H; y += 1) {
          for (let x = 0; x < ICON_W; x += 1) {
            if (!g[y][x] || id[y][x] >= 0) continue;
            const stack = [[x, y]];
            id[y][x] = next;
            while (stack.length) {
              const [cx, cy] = stack.pop();
              for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = cx + dx, ny = cy + dy;
                if (nx < 0 || ny < 0 || nx >= ICON_W || ny >= ICON_H) continue;
                if (g[ny][nx] && id[ny][nx] < 0) { id[ny][nx] = next; stack.push([nx, ny]); }
              }
            }
            next += 1;
          }
        }
        for (let y = 0; y < ICON_H; y += 1) {
          for (let x = 0; x < ICON_W - 1; x += 1) {
            for (const [dx, dy] of [[1, 1], [1, -1]]) {
              const nx = x + dx, ny = y + dy;
              if (ny < 0 || ny >= ICON_H) continue;
              if (!g[y][x] || !g[ny][nx]) continue;
              if (g[y][nx] || g[ny][x]) continue;
              if (id[y][x] !== id[ny][nx]) {
                offenders.push(`${skin}: ${name} (${x},${y}) touches (${nx},${ny}) only at a corner`);
              }
            }
          }
        }
      }
    }
    assert.deepEqual(offenders, []);
  });

  test('no sheet lets a stroke fatten as it converges', () => {
    for (const [skin, font] of SHEETS) {
      for (const name of ['check', 'close']) {
        const perRow = gridOf(font, name)
          .map((row) => row.reduce((a, v) => a + v, 0)).filter(Boolean);
        const ratio = Math.max(...perRow) / Math.min(...perRow);
        assert.ok(ratio <= 2,
          `${skin}: ${name}'s ink swells ${ratio}x across its rows: ${perRow.join(' ')}`);
      }
    }
  });

  test('every sheet derives its own nine, rather than inheriting the first sheet\'s', () => {
    /* A chevron has to be a rotation of ITS OWN sheet's chevron-down. Copying
       the derivation results across would give the cyber sheet four chrome
       chevrons and nothing would report it. */
    for (const [skin, font] of SHEETS) {
      const g = (n) => gridOf(font, n).map((r) => r.join('')).join('|');
      const rot = (n) => {
        const src = gridOf(font, n);
        return src[0].map((_, x) => src.map((row) => row[x]).reverse().join('')).join('|');
      };
      assert.equal(g('chevron-left'), rot('chevron-down'), `${skin}: chevron-left`);
      assert.equal(g('chevron-up'), rot('chevron-left'), `${skin}: chevron-up`);
      assert.equal(g('chevron-right'), rot('chevron-up'), `${skin}: chevron-right`);
      const flipped = gridOf(font, 'previous').map((r) => [...r].reverse().join('')).join('|');
      assert.equal(g('next'), flipped, `${skin}: next is not previous mirrored`);
    }
  });

  test('a skin\'s committed sheet is what its font data draws', () => {
    for (const [file, rects] of SKIN_SHEETS) {
      assert.equal(read(join('assets', file)), iconSheet(rects), file);
    }
    assert.ok(SKIN_SHEETS.length >= 1, 'no skin sheet is generated, so this compared nothing');
  });

  test('a skin\'s bearing overrides are what the generator writes', () => {
    for (const [skin, rects] of SKIN_FONTS) {
      assert.equal(read(join('css', 'skins', skin, 'icon-index.css')), skinIconsCss(skin, rects));
    }
  });

  test('a skin only overrides the bearings its drawings actually moved', () => {
    /* Cells are never in a skin's file, because every sheet shares ICON_ORDER
       and the base index already has them right. A skin file that carried
       --pw-icon-x would be stating something it cannot know better than the
       generator does. */
    for (const [skin] of SKIN_FONTS) {
      const css = read(join('css', 'skins', skin, 'icon-index.css'));
      assert.doesNotMatch(css, /--pw-icon-x|--pw-icon-y/,
        `${skin} overrides a cell, and the cell is the one thing a sheet may not move`);
      assert.match(css, /--pw-icon-ink-l/, `${skin} overrides nothing, so it is drawn identically`);
    }
  });
});
