/**
 * The shipped stylesheet against the sources it is built from.
 *
 * css/panelware.css is generated and committed, which means the same rules
 * exist twice in the repo and one copy is the one consumers get. Editing the
 * bundle by hand would work, would look right, and would be silently undone
 * by the next `npm run generate`.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { bundle } from '../scripts/build-css.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

describe('the shipped stylesheet', () => {
  /* These comparisons only mean something because `npm test` compiles but
     does not regenerate. It used to run the generators first, which
     overwrote any drift a moment before the comparison and made every test
     in this file and in icons.test.mjs unable to fail. Four planted hand
     edits went undetected. `npm run build` generates; `npm test` checks. */
  test('is what the sources build to', () => {
    assert.equal(read('css/panelware.css'), bundle('css/_panelware.css'));
  });

  test('the tokens-only entry is too', () => {
    assert.equal(read('css/tokens.css'), bundle('css/tokens/index.css'));
  });

  test('ships as one file, with no imports left to chain', () => {
    /* The @import version made 22 requests for one page, in serial waves,
       because a browser cannot discover a nested import until the parent has
       parsed. It also meant one stale file in the chain could silently
       remove a whole component's styling with no error, which is exactly
       what happened to the dialog's title bar. */
    const css = read('css/panelware.css').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(css, /@import/);
  });

  test('every url() in the bundle resolves from css/', () => {
    /* The icon sheet is referenced as ../../assets/ from css/components/.
       Inlined one directory shallower it would be wrong by a level, and the
       icons would silently stop painting rather than erroring. */
    const refs = [...read('css/panelware.css').matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1]);
    assert.ok(refs.length >= 3, 'expected the sprite sheets to be referenced');
    for (const ref of refs) {
      assert.ok(readFileSync(join(ROOT, 'css', ref)), `${ref} does not resolve from css/`);
    }
  });

  test('no source file is emitted twice', () => {
    /* @import is idempotent in the cascade; concatenation is not. A file
       pulled in from two places would put a second copy of its rules after
       the first, and a consumer override written to beat the first copy
       would lose to the second.

       Counting selectors would not test this: .pw-button legitimately
       appears twice in its own file, once in the components layer and once
       inside its reduced-motion block. What has to occur once is each FILE,
       so this counts each source's own header line. */
    const css = read('css/panelware.css');
    const sources = readdirSync(join(ROOT, 'css'), { recursive: true })
      .filter((f) => typeof f === 'string' && f.endsWith('.css'))
      .filter((f) => !['panelware.css', 'tokens.css', '_panelware.css'].includes(f));
    assert.ok(sources.length >= 12, `expected the split sources, found ${sources.length}`);

    for (const rel of sources) {
      const first = read(join('css', rel)).split('\n')[1];
      if (!first || !first.startsWith(' *')) continue;
      const hits = css.split(first).length - 1;
      /* theme-auto is opt-in and deliberately not in the bundle. */
      if (rel.endsWith('theme-auto.css')) {
        assert.equal(hits, 0, `${rel} is opt-in and must not be bundled`);
        continue;
      }
      assert.equal(hits, 1, `${rel} appears ${hits} times in the bundle`);
    }
  });
});

describe('the published reference data', () => {
  /* demo/docs-data.json is generated from the same files the gate reads and
     from the gate itself, so the token table and the contrast table in the
     documentation cannot drift from the build. A hand-written token table is
     a second copy of the contract that nothing checks; a hand-written
     contrast table is worse, being a claim about accessibility with no
     measurement behind it. */
  test('is what the sources and the gate produce', async () => {
    const { data } = await import('../scripts/build-docs-data.mjs');
    const onDisk = JSON.parse(read('demo/docs-data.json'));
    assert.deepEqual(onDisk, data);
  });

  test('publishes every pair the gate checks, and none of them failing', () => {
    const onDisk = JSON.parse(read('demo/docs-data.json'));
    const config = JSON.parse(read('tastecheck.config.json'));
    const expected = config.contrast.pairs.length * config.contrast.themes.length;
    assert.equal(onDisk.contrast.length, expected,
      'the published table is not the whole table');
    assert.deepEqual(onDisk.contrast.filter((r) => !r.pass), []);
  });

  test('resolves a semantic token through to a literal', () => {
    /* A table showing var(--pw-silver-300) and stopping there has told the
       reader the name of a thing rather than the thing. */
    const onDisk = JSON.parse(read('demo/docs-data.json'));
    const roles = onDisk.groups.find((g) => g.name === 'Colour roles');
    const base = roles.tokens.find((t) => t.name === '--pw-color-base-200');
    assert.match(base.values.light.declared, /^var\(/);
    assert.match(base.values.light.resolved, /^#[0-9a-f]{6}$/i);
    assert.notEqual(base.values.light.resolved, base.values.dark.resolved);
  });
  test('no lone visible line is drawn with a decorative bevel ink', () => {
    /* Four of the five bevel inks are interior shading, and only
       --pw-bevel-boundary carries WCAG 1.4.11. The catch is that in the light
       theme --pw-bevel-frame resolves to the same silver-700 that boundary
       does, so a line drawn with frame looks correct, measures 4.69:1, and
       passes every review, right up until the dark theme moves frame to
       silver-950 and the line drops to 1.11:1 against the page.

       demo.css drew every section rule that way and nobody saw it, because
       the failure exists in one theme only and only as an absence.

       "Lone" is the whole rule, and it is not an exception carved out to let
       an existing offender through. A single line in a decorative ink is
       asking one shading tone to be seen against a surface, which is the
       thing that stops working when the theme moves it. Two decorative inks
       on opposite edges are a groove, where the signal is the step between
       the two rather than either one against the ground, which is the bevel's
       own logic at one pixel. The menu separator is that, and it holds in
       both themes for the same reason the bevel does. */
    const DECORATIVE = ['--pw-bevel-frame', '--pw-bevel-light', '--pw-bevel-shade', '--pw-bevel-face'];
    const files = [];
    const walk = (dir) => {
      for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
        if (e.isDirectory()) walk(join(dir, e.name));
        else if (e.name.endsWith('.css')) files.push(join(dir, e.name));
      }
    };
    walk('css');
    walk('demo');
    const bad = [];
    for (const f of files) {
      if (f.endsWith('panelware.css') || f.endsWith('tokens.css')) continue;
      for (const block of read(f).split('}')) {
        const hits = [];
        for (const line of block.split('\n')) {
          const decl = line.split('/*')[0];
          if (!/^\s*(border|outline)[a-z-]*\s*:/.test(decl)) continue;
          for (const t of DECORATIVE) if (decl.includes(t)) hits.push({ t, decl: decl.trim() });
        }
        if (hits.length === 1) bad.push(`${f}: ${hits[0].decl}`);
      }
    }
    assert.deepEqual(bad, [], 'a decorative bevel ink is drawing a line on its own');
  });
});
