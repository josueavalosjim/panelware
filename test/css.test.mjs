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
    /* Not pairs times themes. A pair may name the themes it applies to, and
       the count is summed per pair so that a pair which does gets counted
       once per theme it names rather than once per theme that exists.

       No pair in this config uses that yet. It is summed rather than
       multiplied because the alternative is a count that silently expects
       more rows than the gate produces the first time one does.

       The paper skin's dither ink is NOT one of these, which this comment
       claimed for three releases. A pair is two resolved colours and the gate
       rejects a translucent bg outright, so a screen cannot be a pair at all.
       The test further down composites it instead. */
    const expected = config.contrast.pairs.reduce(
      (n, p) => n + (p.themes ? p.themes.length : config.contrast.themes.length), 0);
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
    /* Every treatment, derived, not the two this was written against. It named
       bevel.css and glow.css, so the day a third arrived it went on comparing
       the first two and reporting a clean run: the halftone skin could have
       reached the slot for a different set of surfaces and been flat in
       exactly one skin, which is the failure this test exists for. */
    const files = readdirSync(join(ROOT, 'css', 'treatment'))
      .filter((f) => f.endsWith('.css'))
      .map((f) => join('css', 'treatment', f))
      .filter((f) => read(f).includes('pw-select-list'));
    assert.ok(files.length >= 3, `only ${files.length} treatment(s) fill the slot`);

    const base = listOf(files[0]);
    assert.ok(base.length >= 20, `only ${base.length} components in the slot`);
    for (const file of files.slice(1)) {
      assert.deepEqual(listOf(file), base,
        `${file} fills the slot for a different set of surfaces than ${files[0]}`);
    }
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
  test('a second skin\'s ramp cannot reach the first skin', () => {
    /* Both primitive files declared on a bare :root and this one is imported
       second. :root and [data-skin="cyber"] are both (0,1,0), so wherever the
       two ramps shared a name the later import won EVERYWHERE, including under
       the skin that did not declare it. All four amber shades were shared, and
       the chrome skin's warning ink had been the cyber skin's amber since the
       second skin landed: --pw-color-warning-content reads --pw-amber-800 in
       light and --pw-amber-300 in dark, and both resolved to the wrong file.

       Nothing could see it. The contrast gate resolves the cascade exactly as
       the browser does, so it measured the colour being painted and passed;
       what was wrong is that the painted colour was not the declared one. And
       "every token has a reader" is a different question from "every token's
       declaration is the one that wins", which is the one nobody was asking.

       So the rule is about scope rather than about names: the base ramp owns
       :root, and every other skin's ramp scopes to its own skin. Sharing a
       name is then harmless, which matters because the phosphor ramp is shared
       on purpose. */
    const files = readdirSync(join(ROOT, 'css', 'tokens'))
      .filter((f) => /^primitive\..+\.css$/.test(f));
    assert.ok(files.length >= 2, `only ${files.length} primitive ramp(s) found`);

    const BASE = 'primitive.chrome.css';
    assert.ok(files.includes(BASE), 'the base ramp is gone, so this checks nothing');

    for (const file of files) {
      const css = read(join('css', 'tokens', file)).replace(/\/\*[\s\S]*?\*\//g, '');
      const selectors = [...css.matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim()).filter(Boolean);
      assert.ok(selectors.length, `${file} declares nothing`);
      const skin = file.replace(/^primitive\.|\.css$/g, '');
      for (const selector of selectors) {
        if (file === BASE) {
          assert.ok(selector.includes(':root'),
            `${BASE} is the base ramp and every other file reads it, so it owns :root; ` +
            `this block is "${selector}"`);
        } else {
          assert.ok(selector.includes(`[data-skin="${skin}"]`),
            `${file} declares under "${selector}". A ramp on a bare :root ties with the base ` +
            'ramp at (0,1,0) and wins by import order, under every skin rather than its own.');
          assert.ok(!/(^|\s):root(\s|$|,)/.test(selector),
            `${file} declares under "${selector}", which includes a bare :root`);
        }
      }
    }
  });

  test('every elevation assignment sets both halves of it', () => {
    /* Elevation is two properties now, because a skin whose depth is dither
       density or hatch pitch cannot put that in a box-shadow: it is a
       background-image, and no custom property feeds two different properties.

       So a component says which state it is in twice, and the failure that
       makes this worth a test is silent in the worst way. A rule that sets
       --pw-elev to sunken and leaves --pw-elev-fill on the raised default is
       correct under both shipped skins, because both fills are none. It only
       goes wrong under the skin that motivated the split, and by then the
       component is somebody else's. */
    const offenders = [];
    for (const file of readdirSync(join(ROOT, 'css', 'components'))) {
      if (!file.endsWith('.css')) continue;
      const css = read(join('css', 'components', file)).replace(/\/\*[\s\S]*?\*\//g, '');
      for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const shadow = body.match(/--pw-elev:\s*var\(--pw-shadow-(raised|sunken)\)/);
        const fill = body.match(/--pw-elev-fill:\s*var\(--pw-fill-(raised|sunken)\)/);
        const where = `${file}: ${selector.trim().split(/\s+/).join(' ').slice(0, 48)}`;
        if (shadow && !fill) offenders.push(`${where} sets --pw-elev and not --pw-elev-fill`);
        else if (fill && !shadow) offenders.push(`${where} sets --pw-elev-fill and not --pw-elev`);
        else if (shadow && fill && shadow[1] !== fill[1]) {
          offenders.push(`${where} is ${shadow[1]} in shadow and ${fill[1]} in fill`);
        }
      }
    }
    assert.deepEqual(offenders, [], offenders.join('\n'));
  });

  test('nothing in the shared slot paints over the surface stack', () => {
    /* The slot puts three background layers on every surface: the ornament a
       skin draws, the elevation fill, and the texture. A component declaring
       background-image is in pw.components, the slot is in pw.treatment, and
       components sort later, so the component wins and the whole stack is
       gone.

       That is the clip-path bug again, in a different property, and it had
       already happened: .pw-visualiser declared its dot grid as a
       background-image and silently dropped the cyber skin's scanlines from
       the one surface in the kit that is actually a screen. It uses the
       ornament slot now.

       --pw-surface-layers exists so a component that genuinely must paint its
       own surface can splice the stack in rather than repeat it, which is the
       escape hatch this allows for. */
    const slot = read('css/treatment/bevel.css').replace(/\/\*[\s\S]*?\*\//g, '')
      .match(/:where\(([^)]*)\)\s*\{[^}]*--pw-surface-layers/);
    assert.ok(slot, 'the shared slot no longer declares --pw-surface-layers');
    const members = new Set(slot[1].split(',').map((x) => x.trim().replace(/^\./, '')));
    assert.ok(members.size >= 20, `only ${members.size} surfaces in the slot`);

    const offenders = [];
    for (const file of readdirSync(join(ROOT, 'css', 'components'))) {
      if (!file.endsWith('.css')) continue;
      const css = read(join('css', 'components', file)).replace(/\/\*[\s\S]*?\*\//g, '');
      for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (!/background(-image)?\s*:/.test(body)) continue;
        if (body.includes('--pw-surface-layers')) continue;
        const hit = [...selector.matchAll(/\.(pw-[a-z0-9-]+)/g)].map((m) => m[1])
          .filter((c) => members.has(c));
        for (const c of hit) {
          offenders.push(`${file}: .${c} is in the shared slot and declares its own background, ` +
            'so the ornament, the elevation fill and the texture never reach it');
        }
      }
    }
    assert.deepEqual(offenders, [], offenders.join('\n'));
  });

  test('a skin that moves a density token restates it at both densities', () => {
    /* [data-skin="x"] and [data-density="compact"] are both (0,1,0), and the
       skin files import after density.css, so a skin setting a density-owned
       token wins the tie at BOTH densities and the compact axis quietly stops
       existing under that skin.
       
       Measured when the cyber skin first moved its padding: cyber at compact
       had the comfortable 8px, and nothing said a word. The axis is documented
       as orthogonal, so this is the check that keeps it that way.
       
       The type scale is deliberately not density-owned. density.css aliases
       --pw-control-text to --pw-text-ui and --pw-text-micro, so a skin moving
       those rungs flows through both densities correctly, which is the whole
       reason the alias is there. */
    const owned = new Set([...read('css/tokens/density.css')
      .replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--pw-[\w-]+)\s*:/g)].map((m) => m[1]));
    assert.ok(owned.size >= 8, `only ${owned.size} density tokens found`);

    const files = [
      ...readdirSync(join(ROOT, 'css', 'tokens'))
        .filter((f) => /^skin\..+\.css$/.test(f)).map((f) => ['css/tokens', f]),
      ...readdirSync(join(ROOT, 'css', 'tokens', 'presets'))
        .filter((f) => f.endsWith('.css')).map((f) => ['css/tokens/presets', f]),
    ];
    for (const [dir, file] of files) {
      const skin = file.replace(/^skin\.|\.css$/g, '');
      const css = read(join(dir, file)).replace(/\/\*[\s\S]*?\*\//g, '');
      const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
        .map(([, sel, body]) => ({ sel: sel.trim(), body }));

      const moved = new Set();
      for (const b of blocks) {
        if (/\[data-density="compact"\]/.test(b.sel)) continue;
        for (const [, t] of b.body.matchAll(/(--pw-[\w-]+)\s*:/g)) if (owned.has(t)) moved.add(t);
      }
      if (!moved.size) continue;

      const compact = blocks.filter((b) => /\[data-density="compact"\]/.test(b.sel));
      assert.ok(compact.length,
        `${file} moves ${[...moved].join(', ')}, which density.css owns, and never restates ` +
        'them at [data-density="compact"], so the compact axis is dead under it');
      const restated = new Set(compact
        .flatMap((b) => [...b.body.matchAll(/(--pw-[\w-]+)\s*:/g)].map((x) => x[1])));
      const missing = [...moved].filter((t) => !restated.has(t));
      assert.deepEqual(missing, [],
        `${file} moves these at one density and not the other:\n${
          missing.map((t) => `  ${t}`).join('\n')}`);
    }
  });

  test('a screened surface is legible and calm on every ground it lands on', () => {
    /* The contrast gate cannot do this one, and its refusal is correct: a
       translucent screen has nothing definite to measure against, because what
       it measures against is whatever it was printed on.

       That is also why the screen was wrong twice. It was a fixed colour, and
       a fixed colour has a different local contrast on every ground: a warm
       grey dot measured 1.64:1 on paper stock and 3.91:1 on the primary, so
       the button looked like it had a rash while the panel looked fine.
       Softening the ink fixed the panel and did nothing for the button.

       So this composites what the browser will paint and checks two things per
       ground. Legibility, which is the floor the gate would have applied. And
       CALMNESS, which is the thing nobody could gate and which took two
       attempts and somebody looking at it: a screen whose dot stands more than
       a little away from its own ground stops reading as a tone and starts
       reading as dots. That number is 1.4:1, and it is a proxy rather than a
       law, but it is a proxy that would have caught both mistakes. */
    const literals = new Map([...read('css/tokens/primitive.paper.css')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .matchAll(/(--pw-[\w-]+)\s*:\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
    assert.ok(literals.size >= 12, `only ${literals.size} paper shades found`);

    const semantic = read('css/tokens/semantic.paper.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const skin = read('css/tokens/skin.paper.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const blockOf = (css, selector) => {
      const i = css.indexOf(selector);
      assert.ok(i >= 0, `no ${selector} block`);
      return css.slice(i, css.indexOf('}', i));
    };
    const tokenIn = (block, name) => {
      const m = block.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
      assert.ok(m, `${name} is not declared in that block`);
      const v = m[1].trim();
      const ref = v.match(/^var\((--pw-[\w-]+)\)$/);
      return ref ? literals.get(ref[1]) : v;
    };

    const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const lum = (h) => { const [r, g, b] = rgb(h).map((v) => lin(v / 255));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05); };
    const screened = (ground, ink) => {
      const m = ink.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
      assert.ok(m, `the screen is ${ink}, which is not a translucent colour. A screen that ` +
        'names an opaque ink has a different local contrast on every ground it is printed on.');
      const a = Number(m[4]);
      const over = rgb(`#${[1, 2, 3].map((i) => Number(m[i]).toString(16).padStart(2, '0')).join('')}`);
      return `#${rgb(ground).map((v, i) => Math.round(over[i] * a + v * (1 - a))
        .toString(16).padStart(2, '0')).join('')}`;
    };

    const looks = [
      ['light', '[data-skin="paper"],', '[data-skin="paper"],'],
      ['dark', '[data-skin="paper"][data-theme="dark"]', '[data-skin="paper"][data-theme="dark"]'],
    ];
    let checked = 0;
    for (const [name, semSel, skinSel] of looks) {
      const sem = blockOf(semantic, semSel);
      const ink = tokenIn(blockOf(skin, skinSel), '--pw-dither-ink');
      const text = tokenIn(sem, '--pw-color-base-content');
      const grounds = [
        ['base-100', tokenIn(sem, '--pw-color-base-100'), text],
        ['base-200', tokenIn(sem, '--pw-color-base-200'), text],
        ['base-300', tokenIn(sem, '--pw-color-base-300'), text],
        ['primary', tokenIn(sem, '--pw-color-primary'), tokenIn(sem, '--pw-color-primary-content')],
      ];
      for (const [where, ground, fg] of grounds) {
        const dot = screened(ground, ink);
        checked += 1;
        assert.ok(ratio(fg, dot) >= 4.5,
          `${name}: text on the screened ${where} is ${ratio(fg, dot).toFixed(2)}:1`);
        assert.ok(ratio(dot, ground) <= 1.4,
          `${name}: the screen on ${where} is ${ratio(dot, ground).toFixed(2)}:1 against its own ` +
          'ground, which reads as dots rather than as a tone');
      }
    }
    assert.equal(checked, 8, `only ${checked} screened grounds measured`);
  });

  test('no look crowds a control label against its own edge', () => {
    /* Horizontal padding only means something as a proportion of the type it
       is set in, which is why an absolute value is the wrong thing to compare
       across looks. 12px is roomy at 15px type and tight at 24.

       The redline preset shipped at 6px on 13px type, which is 0.46em, and the
       label very nearly touched the border. The reasoning was that signage is
       dense, and it is: dense in the spacing BETWEEN elements and generous
       inside the lozenge. Getting that backwards is easy and nothing here
       could see it, because every gate measured colour, geometry, and hit
       targets, and none of them measured whether a control had room to
       breathe.

       0.5em is a floor rather than a target, and it is calibrated the way the
       halftone's calmness number is: to the case that was visibly wrong. It
       does not know what looks good, it knows what is definitely too tight.
       The densest look that ships sits at 0.50 and the one that did not clear
       it was at 0.46.

       Resolved through the space and type scales rather than read as pixels,
       because that is how the tokens are written. */
    const files = [
      ...readdirSync(join(ROOT, 'css', 'tokens'))
        .filter((f) => /^(skin\.|structural|density)/.test(f) && f.endsWith('.css'))
        .map((f) => join('css', 'tokens', f)),
      ...readdirSync(join(ROOT, 'css', 'tokens', 'presets'))
        .filter((f) => f.endsWith('.css')).map((f) => join('css', 'tokens', 'presets', f)),
    ];
    /* Every declaration of the two tokens that matter, plus the scales they
       resolve through, keyed by the block that declared them. */
    /* The base scale is structural.css and only structural.css. Reading it from
       whichever file happened to be walked first put the cyber skin's own type
       override in as everybody's baseline, which made the chrome numbers wrong
       by a rung. A skin's override is applied per file below, on top of this. */
    const scale = new Map([...read('css/tokens/structural.css')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .matchAll(/(--pw-(?:space|text)-[\w-]+)\s*:\s*([^;]+);/g)]
      .map((m) => [m[1], m[2].trim()]));
    assert.ok(scale.size >= 10, `only ${scale.size} scale rungs found`);

    const blocks = [];
    for (const file of files) {
      const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '');
      for (const [, sel, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        blocks.push({ file, sel: sel.trim().split(/\s+/).join(' '), body });
      }
    }
    const rem = (v) => {
      const direct = v.match(/^([\d.]+)rem$/);
      if (direct) return Number(direct[1]) * 16;
      const px = v.match(/^([\d.]+)px$/);
      if (px) return Number(px[1]);
      const ref = v.match(/^var\((--pw-[\w-]+)\)$/);
      assert.ok(ref && scale.has(ref[1]), `cannot resolve ${v}`);
      return rem(scale.get(ref[1]));
    };

    let checked = 0;
    for (const b of blocks) {
      const pad = b.body.match(/--pw-control-pad-x\s*:\s*([^;]+);/);
      const text = b.body.match(/--pw-control-text\s*:\s*([^;]+);/);
      if (!pad) continue;
      /* The type comes from the same block when it sets one, and otherwise
         from the scale rung this density reads. A block that moves padding and
         not type is compared against both rungs, since it applies at both. */
      /* Which rung applies is decided by the selector, not by guessing: a
         compact block reads --pw-text-micro and everything else reads
         --pw-text-ui, because that is what density.css aliases
         --pw-control-text to. A skin that moved the rung is read from
         wherever it moved it, which is why the scale is collected first. */
      const compact = /\[data-density="compact"\]/.test(b.sel);
      const rung = compact ? '--pw-text-micro' : '--pw-text-ui';
      const moved = blocks
        .filter((o) => o.file === b.file && new RegExp(`${rung}\\s*:`).test(o.body))
        .map((o) => o.body.match(new RegExp(`${rung}\\s*:\\s*([^;]+);`))[1].trim());
      const size = text ? rem(text[1].trim())
        : rem(moved.length ? moved[0] : `var(${rung})`);
      for (const _ of [size]) {
        const ratio = rem(pad[1].trim()) / size;
        checked += 1;
        assert.ok(ratio >= 0.5,
          `${b.file} "${b.sel}" sets --pw-control-pad-x to ${ratio.toFixed(2)}em of its type, ` +
          'which crowds the label against the edge');
      }
    }
    assert.ok(checked >= 6, `only ${checked} padding declarations measured`);
  });

  test('the demo offers every look the tokens declare', () => {
    /* The same drift the check scripts had, in the one place a visitor meets
       it. demo/index.html hand-maintains two lists: the skin picker's
       SelectItems, and a PRESETS map keyed by skin. A third skin that landed
       without both being edited would ship a demo that renders it nowhere,
       and the page is the only thing most people will ever look at.

       A preset's owning skin is read out of its own selector rather than
       assumed, because the pairing is the part that can be wrong: a preset
       listed under the wrong skin matches nothing and falls back silently,
       which is the behaviour the token contract chose on purpose and is
       therefore invisible. */
    const skins = new Set();
    for (const file of readdirSync(join(ROOT, 'css', 'tokens'))) {
      const m = file.match(/^skin\.([a-z0-9-]+)\.css$/);
      if (m) skins.add(m[1]);
    }
    assert.ok(skins.size >= 2, `only ${skins.size} skin file(s) found`);

    const owners = new Map();
    for (const file of readdirSync(join(ROOT, 'css', 'tokens', 'presets'))) {
      if (!file.endsWith('.css')) continue;
      const name = file.replace(/\.css$/, '');
      const css = read(join('css', 'tokens', 'presets', file));
      const m = css.match(new RegExp(`\\[data-skin="([a-z0-9-]+)"\\]\\[data-preset="${name}"\\]`));
      assert.ok(m, `${file} never scopes itself to a skin, so it matches nothing`);
      owners.set(name, m[1]);
    }
    assert.ok(owners.size >= 1, 'no preset files found');

    const demo = read('demo/index.html');
    const presets = demo.match(/const PRESETS = \{([^}]*)\}/);
    assert.ok(presets, 'demo/index.html has no PRESETS map');

    for (const skin of skins) {
      assert.match(demo, new RegExp(`SelectItem, \\{ value: '${skin}' \\}`),
        `the demo's skin picker does not offer ${skin}`);
      assert.match(presets[1], new RegExp(`${skin}:\\s*\\[`),
        `the demo's PRESETS map has no entry for ${skin}, so picking it throws`);
    }
    for (const [preset, skin] of owners) {
      const list = presets[1].match(new RegExp(`${skin}:\\s*\\[([^\\]]*)\\]`));
      assert.ok(list?.[1].includes(`'${preset}'`),
        `the demo does not offer the ${preset} preset under ${skin}, which is the skin it scopes itself to`);
    }
  });
  test('no preset moves the treatment, which is what makes it a preset', () => {
    /* A preset may move anything a skin may move, EXCEPT the treatment. That
       is the whole line, and it moved: it used to be "whether a treatment file
       is involved", which stopped being useful the day a preset was allowed to
       move rhythm as well as palette. The deck preset now sets its own type
       and padding, and it is still a preset because chrome's bevel is still
       what paints its depth.

       So the elevation model is the thing under test. --pw-bevel-depth was the
       original case and the fill slots joined it when elevation stopped being
       only a shadow: a preset filling --pw-fill-sunken would be shipping a
       treatment without a treatment file, which is precisely the thing the
       name is supposed to tell you it does not do.

       --pw-bevel-depth is the exception, because it is not a decoration: at 0
       the entire stacked-inset treatment collapses and the controls lose their
       edges, which is what separates the cyber skin from the chrome one. A
       preset that set it would be a different skin wearing a preset's name,
       and the taxonomy would stop meaning anything the first time somebody
       did it.

       Written down in the preset file and the README before this existed.
       Prose does not fail a build. */
    const dir = join(ROOT, 'css', 'tokens', 'presets');
    const files = readdirSync(dir).filter((f) => f.endsWith('.css'));
    assert.ok(files.length, 'no presets found, so this checked nothing');
    for (const file of files) {
      const bare = read(join('css', 'tokens', 'presets', file))
        .replace(/\/\*[\s\S]*?\*\//g, '');
      for (const token of [
        '--pw-bevel-depth', '--pw-shadow-raised', '--pw-shadow-sunken',
        '--pw-fill-raised', '--pw-fill-sunken', '--pw-elev', '--pw-elev-fill',
      ]) {
        assert.doesNotMatch(bare, new RegExp(`${token}\\s*:`),
          `${file} sets ${token}. A preset may move palette, rhythm, type and ` +
          'timing; the treatment is what separates it from a skin.');
      }
    }
  });
  test('no block declares the same token twice', () => {
    /* structural.css declared --pw-bracket-inset, --pw-bracket-arm,
       --pw-bracket-weight and --pw-meta-label-opacity twice inside one :root,
       from two commits inserting near the same line. The second copy had also
       drifted away from its comment, so the "Surface texture" note sat above a
       bracket declaration with --pw-texture forty lines further down.

       Nothing could see it. Both copies carried the same value, so no gate
       here measured anything different: parity, contrast and the CSSOM check
       all read whichever copy won and agreed with themselves. It is a live
       hazard rather than untidiness, because an edit to the first copy is
       silently overruled by the second, which is the same failure as editing a
       generated file by hand.

       Comments come off first, for the reason the bevel-derivation test gives:
       a guard a comment can turn red is a guard people edit around. */
    const files = [];
    const walk = (dir) => {
      for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
        if (e.isDirectory()) { walk(`${dir}/${e.name}`); continue; }
        /* The bundles are concatenations of these files, so a duplicate would
           be reported twice and could be fixed in the copy nobody edits. */
        if (e.name === 'panelware.css' || e.name === 'tokens.css') continue;
        if (e.name.endsWith('.css')) files.push(`${dir}/${e.name}`);
      }
    };
    walk('css');
    assert.ok(files.length > 20, `only ${files.length} stylesheets scanned, so this looked at nothing`);

    const offenders = [];
    for (const rel of files) {
      const css = read(rel).replace(/\/\*[\s\S]*?\*\//g, '');
      const stack = [];
      let line = 1;
      let decl = '';
      for (const ch of css) {
        if (ch === '\n') line += 1;
        if (ch === '{') { stack.push(new Map()); decl = ''; continue; }
        if (ch === '}') { stack.pop(); decl = ''; continue; }
        if (ch !== ';') { decl += ch; continue; }
        /* Anchored, so box-shadow: var(--pw-elev) is not read as declaring
           --pw-elev. Only a custom property on the left counts. */
        const name = decl.trimStart().match(/^(--pw-[\w-]+)\s*:/)?.[1];
        const block = stack[stack.length - 1];
        if (name && block) {
          if (block.has(name)) {
            offenders.push(`${rel}: ${name} is declared twice in one block, ending at lines ` +
              `${block.get(name)} and ${line}, so an edit to the first is overruled by the second`);
          } else block.set(name, line);
        }
        decl = '';
      }
    }
    assert.deepEqual(offenders, [], offenders.join('\n'));
  });
  test('every knob a skin sets is written down, or is on the list with a reason', () => {
    /* A knob a consumer cannot find is a knob that does not exist. Thirteen of
       them shipped that way: the selection slot, the bracket geometry, the
       three glow tokens, the three gloss internals and the glass blur were all
       real, live, and absent from the README, and the demo's token table
       listed them as a name and a value, which tells somebody that a knob is
       there and nothing about what turning it does.

       The rule is the one the reserved-token list uses, for the same reason:
       not "every knob is documented", but "every knob is documented or is on
       this list with a reason", which turns a silent set into a maintained
       one. A new knob fails until somebody either writes it up or writes down
       why it is not a knob.

       The set is derived rather than listed. A knob is what a skin.*.css
       declares, plus what one of those files reaches into structural.css for,
       because "copy skin.chrome.css and change the values" is the procedure
       the README actually gives. */
    const NOT_A_KNOB = new Map([
      ['--pw-font-mono', 'a face in the type stack, not a knob; it is what --pw-font-ui is pointed at'],
      /* A skin picking a rung off the space scale is the scale working. What
         would be worth documenting is a skin declaring a rung, and none does:
         these are all on the right-hand side of a padding or a gap. */
      ['--pw-space-2xs', 'a rung of the space scale, picked from rather than set'],
      ['--pw-space-xs', 'a rung of the space scale, picked from rather than set'],
      ['--pw-space-sm', 'a rung of the space scale, picked from rather than set'],
      ['--pw-space-md', 'a rung of the space scale, picked from rather than set'],
      ['--pw-space-xl', 'a rung of the space scale, picked from rather than set'],
    ]);

    const skinFiles = readdirSync(join(ROOT, 'css', 'tokens'))
      .filter((f) => /^skin\..+\.css$/.test(f));
    assert.ok(skinFiles.length >= 2, `only ${skinFiles.length} skin file(s) found`);

    const declared = new Set();
    const referenced = new Set();
    for (const file of skinFiles) {
      const css = read(join('css', 'tokens', file)).replace(/\/\*[\s\S]*?\*\//g, '');
      for (const [, n] of css.matchAll(/(--pw-[\w-]+)\s*:/g)) declared.add(n);
      for (const [, n] of css.matchAll(/var\((--pw-[\w-]+)/g)) referenced.add(n);
    }
    const structural = new Set();
    for (const [, n] of read('css/tokens/structural.css').replace(/\/\*[\s\S]*?\*\//g, '')
      .matchAll(/(--pw-[\w-]+)\s*:/g)) structural.add(n);

    const knobs = [...new Set([...declared,
      ...[...referenced].filter((n) => structural.has(n) && !declared.has(n))])].sort();
    assert.ok(knobs.length >= 15, `only ${knobs.length} knobs found, so this scanned nothing`);

    const doc = read('README.md');
    const undocumented = knobs.filter((n) => !doc.includes(n) && !NOT_A_KNOB.has(n));
    assert.deepEqual(undocumented, [],
      `a skin sets these and the README never names them:\n${undocumented.map((n) => `  ${n}`).join('\n')}`);

    /* The other direction, so the list cannot outlive its reasons. */
    for (const [name, why] of NOT_A_KNOB) {
      assert.ok(knobs.includes(name),
        `${name} is on the not-a-knob list ("${why}") and no skin touches it any more`);
      assert.ok(!doc.includes(name),
        `${name} is on the not-a-knob list ("${why}") and the README documents it, so take it off`);
    }
  });
});

describe('the skin layer', () => {
  /* pw.skin sorts after pw.components, which is the point of it: a skin can
     restyle what a component painted rather than only fill what it left
     blank. That is also what makes it dangerous, so the contract in
     css/_panelware.css is held here rather than trusted.

     Every rule below is one a skin file would break silently. A skin that
     writes background-image erases its own elevation and still renders. A
     skin that hides a focusable control leaves it in the tab order and looks
     fine on screen. Neither announces itself. */
  const nostrip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
  const files = readdirSync(join(ROOT, 'css', 'skins'), { recursive: true })
    .map((f) => join('css', 'skins', f))
    .filter((f) => f.endsWith('.css'))
    .map((rel) => [rel, nostrip(read(rel))]);

  test('there is a skin layer to check at all', () => {
    /* The precondition, re-checked here rather than assumed, because every
       test below passes trivially against an empty list and would report
       green while measuring nothing. */
    assert.ok(files.length >= 2, `only ${files.length} skin files, so the rest of this scanned nothing`);
    const statement = nostrip(read('css/_panelware.css'))
      .match(/@layer\s+([^;]+);/)?.[1] ?? '';
    const order = statement.split(',').map((x) => x.trim());
    assert.deepEqual(order, ['pw.reset', 'pw.tokens', 'pw.treatment', 'pw.components', 'pw.skin', 'pw.overrides'],
      'the layer order moved, and pw.skin only works where it is');
  });

  test('every skin file declares the layer it belongs to, and only that one', () => {
    for (const [rel, css] of files) {
      const layers = [...css.matchAll(/@layer\s+([\w.]+)\s*\{/g)].map((m) => m[1]);
      assert.deepEqual(layers, ['pw.skin'],
        `${rel} opens ${layers.join(', ') || 'no layer'}, so it lands wherever it was imported`);
    }
  });

  test('no skin paints over the surface stack or writes box-shadow', () => {
    /* background and background-image carry the ornament, the elevation fill
       and the texture together; box-shadow carries --pw-elev and
       --pw-focus-halo together. Writing either replaces the whole list. Both
       have slots, and the slots are the supported way in. */
    const offenders = [];
    for (const [rel, css] of files) {
      for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (/box-shadow\s*:/.test(body)) {
          offenders.push(`${rel}: ${selector.trim()} writes box-shadow, so assign --pw-elev instead`);
        }
        if (/background(-image)?\s*:/.test(body) && !body.includes('--pw-surface-layers')) {
          offenders.push(`${rel}: ${selector.trim()} paints its own background, `
            + 'so the ornament, the elevation fill and the texture never reach it');
        }
      }
    }
    assert.deepEqual(offenders, [], offenders.join('\n'));
  });

  test('no skin hides anything that draws a focus ring', () => {
    /* The case this rule was written for: the cyber skin has no title bar, so
       the obvious first use of this layer was hiding the window's minimise,
       maximise and close cluster. Those are real buttons with real accessible
       names, so hiding them leaves three named controls in the tab order and
       invisible on screen. A skin does not get to add the corner label that
       would replace them, which is where this layer stops. */
    const ringed = new Set(
      [...nostrip(read('css/reset.css')).matchAll(/:where\(([^)]*)\):focus-visible/g)]
        .flatMap((m) => m[1].split(',').map((x) => x.trim().replace(/^\./, ''))),
    );
    assert.ok(ringed.size > 8, `only ${ringed.size} classes draw a ring, so this scanned nothing`);

    const offenders = [];
    for (const [rel, css] of files) {
      for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (!/(display\s*:\s*none|visibility\s*:\s*hidden)/.test(body)) continue;
        for (const c of [...selector.matchAll(/\.(pw-[a-z0-9-]+)/g)].map((m) => m[1])) {
          if (ringed.has(c)) {
            offenders.push(`${rel}: .${c} takes focus and draws a ring, and this hides it`);
          }
        }
      }
    }
    assert.deepEqual(offenders, [], offenders.join('\n'));
  });

  test('every class a skin names is a class something renders', () => {
    /* A skin file is the one place in this kit where a typo is completely
       silent: the rule parses, matches nothing, and the skin simply looks
       like it did before. */
    const shipped = new Set(
      [...read('css/panelware.css').matchAll(/\.(pw-[a-z0-9-]+)/g)].map((m) => m[1]),
    );
    const offenders = [];
    for (const [rel, css] of files) {
      for (const [, selector] of css.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
        for (const c of [...selector.matchAll(/\.(pw-[a-z0-9-]+)/g)].map((m) => m[1])) {
          if (!shipped.has(c)) offenders.push(`${rel}: .${c} is styled by no component`);
        }
      }
    }
    assert.deepEqual(offenders, [], offenders.join('\n'));
  });

  test('a skin file names the skin it is filed under', () => {
    /* The directory is the skin, so a rule in skins/paper/ that scopes itself
       to [data-skin="cyber"] is filed where nobody will look for it. */
    for (const [rel, css] of files) {
      const skin = rel.split('/')[2];
      for (const [, selector] of css.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
        if (!selector.includes('[data-skin=')) continue;
        for (const named of [...selector.matchAll(/\[data-skin="([^"]+)"\]/g)].map((m) => m[1])) {
          assert.equal(named, skin, `${rel} carries a rule scoped to ${named}`);
        }
      }
    }
  });
});
