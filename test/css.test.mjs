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
  test('<body> carries no inset a scroll lock would take away', () => {
    /* react-remove-scroll, which is what Radix locks scroll with, injects
       this the moment a dialog or a select opens:

         body[data-scroll-locked] {
           padding-left: 0px; padding-top: 0px; padding-right: 0px;
           margin-left: 0; margin-top: 0; margin-right: 0px !important;
         }

       It is replacing the page's insets with values computed to hold the
       layout still where a classic scrollbar has just been removed. On the
       overlay scrollbars macOS and iOS use there is no scrollbar to make room
       for, so all of them compute to zero and the page loses its insets for
       as long as the thing is open.

       Three paddings and three margins. The first version of this lint
       checked the horizontal padding only, because that is the half I had
       understood, and the page still jumped 32px upward on its top padding
       with the lint green. Bottom is the only side the rule leaves alone and
       depending on that is not worth the characters.

       This has to be a lint rather than a note, because the failure appears
       only while a popup is open and only where a max-width is not already
       absorbing it. */
    const files = [];
    const walk = (dir) => {
      for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
        if (e.isDirectory()) walk(join(dir, e.name));
        else if (e.name.endsWith('.css')) files.push(join(dir, e.name));
      }
    };
    walk('css');
    walk('demo');
    const zero = (v) => v === '0' || /^0[a-z%]*$/.test(v);
    const bad = [];
    for (const f of files) {
      if (f.endsWith('panelware.css') || f.endsWith('tokens.css')) continue;
      const css = read(f).replace(/\/\*[\s\S]*?\*\//g, '');
      for (const m of css.matchAll(/(^|[},])\s*body\b[^{]*\{([^}]*)\}/g)) {
        for (const decl of m[2].split(';')) {
          const [prop, value] = decl.split(':').map((x) => (x ?? '').trim());
          if (!/^(padding|margin)(-(top|left|right|inline|block)(-(start|end))?)?$/.test(prop)) continue;
          const v = value.split(/\s+/).filter(Boolean);
          let sides;
          if (/-(top|left|right)$/.test(prop)) sides = v;
          else if (/-inline/.test(prop)) sides = v;
          else if (/-block(-start)?$/.test(prop)) sides = [v[0]];
          else if (/-block-end$/.test(prop)) sides = [];
          /* shorthand: the bottom is the only side that survives, so drop it
             and judge what is left */
          else if (v.length === 1) sides = v;
          else if (v.length === 2) sides = [v[0], v[1]];
          else sides = [v[0], v[1], v[3] ?? v[1]];
          if (sides.filter(Boolean).some((x) => !zero(x))) bad.push(`${f}: body { ${prop}: ${value} }`);
        }
      }
    }
    assert.deepEqual(bad, [],
      "an inset on <body> that react-remove-scroll will zero while a popup is open");
  });

  test('a toggle group segment casts no shadow', () => {
    /* A raised surface casts and a sunken one does not, which is right for a
       button on its own and wrong for a row that is one choice: the selected
       segment is sunken and casts nothing, every other segment casts 0 1px
       2px, and the row ends up with two different bottom edges. Measured, the
       raised segments painted two pixels taller. Two pixels on a 44px control
       is 4.5% and reads as nothing; on a 32px control in compact density it
       is 6.25%, and that is where it was reported from.

       Dropping the cast is the half that keeps the physics, since a hole in a
       surface casts nothing. The alternative, giving the sunken segment a
       shadow, would have made the selected one float. */
    const css = read('css/components/toggle.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const rule = css.match(/\.pw-toggle-group\s+\.pw-toggle\s*\{[^}]*\}/);
    assert.ok(rule, 'no rule scopes a segment inside its group');
    assert.match(rule[0], /--pw-shadow-outer:\s*0 0 0 0 transparent/,
      'a segment still casts, so the row has two bottom edges');
  });
  test('every control that can answer a press does', () => {
    /* A colour audit reported five controls with no :active rule and called
       all five a gap. Reading their rest states rather than their selectors
       says otherwise, and the difference is the whole point of this test.

       .pw-tab is raised at rest and sunken when selected, so it has a sink
       available and was genuinely missing the press.

       .pw-checkbox, .pw-radio and .pw-select are sunken AT REST. They are
       wells you put a mark into, not buttons, so none of them can answer a
       press by sinking: there is nowhere further down. Windows lightened the
       well's face, which would make colour the only carrier of the state, so
       they take the same pixel drop every other control uses. The select adds
       the one flip it does have: its raised drop button sinks, which is the
       same picture opening shows.

       .pw-menubar-trigger is not in this list and must not be added to it. It
       has no bevel at all and inverts when open, which its own comment gives
       the reason for: a pressed button and an open menu are different states
       and reading the same would be a lie about which. */
    const press = [
      ['css/components/tabs.css', /\.pw-tab:not\(\[data-state="active"\]\):not\(\[aria-selected="true"\]\):active/],
      ['css/components/field.css', /\.pw-checkbox:active,\s*\n\s*\.pw-radio:active/],
      ['css/components/field.css', /\.pw-select:active \.pw-select-button/],
    ];
    for (const [file, pattern] of press) {
      assert.match(read(file).replace(/\/\*[\s\S]*?\*\//g, ''), pattern,
        `${file} has no press rule matching ${pattern}`);
    }
    /* The selected tab is already translated by the fuse that lands its
       bottom edge under the panel. A press on top of that is two pixels, and
       the tab detaches from the panel it is supposed to be joined to. */
    const tabs = read('css/components/tabs.css').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const rule of tabs.match(/[^{}]*:active[^{}]*\{[^}]*\}/g) ?? []) {
      if (!rule.includes('.pw-tab:') || rule.includes(':disabled') || rule.includes('[data-disabled]')) continue;
      assert.match(rule, /:not\(\[data-state="active"\]\)/,
        'a tab press rule does not exclude the selected tab, which is already translated');
    }
  });
  test('every stylesheet closes every block it opens', () => {
    /* An extra } in one component file closed @layer pw.components early and
       orphaned every rule after it. Eleven rules reached the CSSOM instead of
       289: the whole window chrome, the transport, the list, the menu bar and
       the form controls stopped being styled, and it shipped that way in
       0.1.0.

       Nothing here could see it. The tests match selectors as text and the
       text was present. taste-check reads declarations and the declarations
       were fine. The colour check measures what is painted and unstyled
       elements still paint something. The parity check compares the two demo
       pages and both were broken identically, so they agreed.

       CSS is the product here and nothing in the toolchain parsed it. This is
       the cheapest possible version of parsing it, and it is the one that
       catches the failure that actually happened. */
    const files = [];
    const walk = (dir) => {
      for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
        if (e.isDirectory()) walk(join(dir, e.name));
        else if (e.name.endsWith('.css')) files.push(join(dir, e.name));
      }
    };
    walk('css');
    walk('demo');
    for (const file of files) {
      const css = read(file);
      let depth = 0;
      let comment = false;
      let negativeAt = null;
      let line = 1;
      for (let i = 0; i < css.length; i += 1) {
        if (css[i] === '\n') line += 1;
        if (!comment && css[i] === '/' && css[i + 1] === '*') { comment = true; i += 1; continue; }
        if (comment && css[i] === '*' && css[i + 1] === '/') { comment = false; i += 1; continue; }
        if (comment) continue;
        if (css[i] === '{') depth += 1;
        else if (css[i] === '}') {
          depth -= 1;
          if (depth < 0 && negativeAt === null) negativeAt = line;
        }
      }
      assert.equal(negativeAt, null, `${file} closes a block it never opened, at line ${negativeAt}`);
      assert.equal(depth, 0, `${file} leaves ${depth} block(s) open`);
      assert.equal(comment, false, `${file} leaves a comment unclosed`);
    }
  });
  test('both skins fill the shared slot for the same components', () => {
    /* bevel.css and glow.css each declare --pw-shadow-raised and
       --pw-shadow-sunken for a list of components. If the lists drift, a
       component reaches the slot under one skin and not the other, and it is
       flat in exactly one skin with nothing anywhere reporting it: the
       stylesheet parses, the component renders, and only a screenshot in the
       skin nobody was looking at shows the missing edge. */
    const listOf = (file) => {
      const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '');
      const m = css.match(/:where\(([^)]*?pw-select-list[^)]*)\)/);
      assert.ok(m, `${file} has no shared-slot selector list`);
      return m[1].replace(/\s+/g, ' ').split(',').map((x) => x.trim()).filter(Boolean).sort();
    };
    const bevel = listOf('css/treatment/bevel.css');
    const glow = listOf('css/treatment/glow.css');
    assert.ok(bevel.length >= 20, `only ${bevel.length} components in the slot`);
    assert.deepEqual(glow, bevel, 'the two skins fill the slot for different components');
  });

  test('the cyber skin turns the chrome treatment off rather than avoiding it', () => {
    /* The claim the depth knob has always made is that the whole bevel
       collapses at 0, and until a second skin existed nothing had asked it to.
       Both knobs are set explicitly rather than left to inherit: a skin that
       declares only its differences inherits the other one's decisions for
       everything it forgot. */
    const cyber = read('css/tokens/skin.cyber.css').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [token, value] of [['--pw-bevel-depth', '0'], ['--pw-gloss-opacity', '0']]) {
      const found = [...cyber.matchAll(new RegExp(`${token}:\\s*([^;]+);`, 'g'))].map((m) => m[1].trim());
      assert.equal(found.length, 2, `${token} is not declared in both cyber themes`);
      assert.deepEqual([...new Set(found)], [value], `${token} is ${found.join(' / ')}, not ${value}`);
    }
  });
  test('the page checks cover every look the tokens declare', () => {
    /* Both skin-aware checks once carried a hard-coded pair, so the day a
       third look landed they went on reporting a clean run for two, printing
       "2 skins" while three were shipping.

       The set is derived from the files rather than listed: a skin is a
       skin.*.css, a preset is a file under presets/, and a preset counts as
       its own look because it is a different palette on the same treatment
       and the palette is what these two measure. */
    const skins = new Set();
    for (const file of readdirSync(join(ROOT, 'css', 'tokens'))) {
      const m = file.match(/^skin\.([a-z0-9-]+)\.css$/);
      if (m) skins.add(m[1]);
    }
    const presets = readdirSync(join(ROOT, 'css', 'tokens', 'presets'))
      .filter((f) => f.endsWith('.css')).map((f) => f.replace(/\.css$/, ''));
    assert.ok(skins.size >= 2, `only ${skins.size} skin file(s) found`);
    assert.ok(presets.length >= 1, 'no preset files found');

    for (const script of ['scripts/check-colour.mjs', 'scripts/check-a11y.mjs']) {
      const src = read(script);
      const block = src.match(/const LOOKS = \[([\s\S]*?)\];/);
      assert.ok(block, `${script} has no LOOKS list`);
      const covered = block[1];
      for (const skin of skins) {
        assert.ok(covered.includes(`'${skin}'`), `${script} does not check the ${skin} skin`);
      }
      for (const preset of presets) {
        assert.ok(covered.includes(`preset: '${preset}'`), `${script} does not check the ${preset} preset`);
      }
    }
  });
});
