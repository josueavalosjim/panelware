/**
 * The claims this kit makes about itself, held to.
 *
 * Every test here guards something that fails SILENTLY. A theme missing a
 * token still renders, using the wrong one. A bevel offset written as a
 * literal still draws, just never flattens. A color-mix() in a token file
 * still paints, and only the gate goes quiet. None of these announce
 * themselves, which is exactly why they are worth a test rather than a
 * convention.
 *
 * Three of the five were real bugs in this repo before they were tests.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

/** Comments removed. Every file here explains its own selectors in prose. */
const bare = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * Every `--name: value;` inside the first rule whose selector list begins at
 * the start of a line with `selector`.
 *
 * The line anchor is not decoration. Searching for the bare string found
 * `:root[data-theme="dark"]` inside the header comment that explains why the
 * dark block is written the way it is, and every one of these tests then
 * measured the light block against itself and passed.
 */
function block(css, selector) {
  const source = bare(css);
  /* Leading whitespace allowed: theme-auto's block is indented inside its
     media query. */
  const at = source.search(new RegExp(`^[ \t]*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm'));
  assert.notEqual(at, -1, `no block found for ${selector}`);
  return declarations(source, at);
}

function declarations(css, at) {
  const open = css.indexOf('{', at);
  let depth = 0;
  let end = open;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') { depth -= 1; if (!depth) { end = i; break; } }
  }
  const body = css.slice(open + 1, end);
  const out = new Map();
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out.set(m[1], m[2].trim());
  return out;
}

describe('the theme contract', () => {
  const semantic = read('css/tokens/semantic.chrome.css');
  const skin = read('css/tokens/skin.chrome.css');
  const auto = read('css/tokens/theme-auto.css');

  const light = block(semantic, ':root,\n:root[data-skin="chrome"]');
  const dark = block(semantic, ':root[data-theme="dark"]');

  test('light and dark declare the identical token set', () => {
    /* Not "dark declares the differences". A skin x theme block that is only
       a diff loses a specificity tie to a future :root[data-skin="cyber"],
       silently, and only for the tokens it left out. The completeness is the
       thing that removes the tie, so it is the thing under test. */
    assert.deepEqual([...dark.keys()].sort(), [...light.keys()].sort());
  });

  test('every semantic colour differs between the themes, or it is deliberate', () => {
    /* A token identical in both themes is either a real decision or a line
       someone forgot to update. The readout is the decision: a lit display is
       a light source and does not dim because the page did. Anything else
       matching is worth a look. */
    const same = [...light.keys()].filter((k) => light.get(k) === dark.get(k));
    assert.deepEqual(same.sort(), ['--pw-color-lcd', '--pw-color-lcd-content']);
  });

  test('theme-auto is value for value the dark block', () => {
    /* It is a verbatim copy under a media query, because CSS cannot reuse a
       block conditionally and this kit ships no build. Duplication that is
       checked is a different thing from duplication that is hoped for. */
    const autoBlock = block(auto, ':root:not([data-theme])');
    const darkAll = new Map([...dark, ...block(skin, ':root[data-theme="dark"]')]);
    for (const [name, value] of darkAll) {
      assert.equal(autoBlock.get(name), value, `theme-auto drifted on ${name}`);
    }
    assert.deepEqual([...autoBlock.keys()].sort(), [...darkAll.keys()].sort());
  });
});

describe('the depth knob', () => {
  const bevel = read('css/treatment/bevel.css');

  test('every bevel offset is a calc of the depth, never a literal', () => {
    /* One literal px here and depth 0 leaves a ghost edge: the flat skin is
       not flat, the deferred second skin cannot turn the chrome off, and
       nothing reports an error. */
    const shadows = bevel.match(/--pw-bevel-(?:raised|sunken)-\w+:[\s\S]*?;/g) ?? [];
    assert.equal(shadows.length, 4, 'expected four bevel shadow declarations');
    for (const decl of shadows) {
      assert.equal(/\binset\s+-?\d/.test(decl), false,
        `a bevel offset is a literal rather than a calc:\n${decl}`);
    }
    assert.match(bevel, /--pw-shadow-outer:\s*\n?\s*0 calc\(var\(--pw-bevel-depth\)/,
      'the cast shadow does not scale with depth');
  });

  test('the derivation is on the component, not on :root', () => {
    /* A custom property referencing another is substituted against the
       element the first is declared on. Declared on :root, --pw-bevel-1
       resolves against :root's depth once and descendants inherit the
       finished "1px", so setting the depth anywhere else does nothing at
       all. That shipped, and demo/states.html caught it. */
    const at = bevel.indexOf('--pw-bevel-1:');
    assert.notEqual(at, -1);
    const selector = bevel.lastIndexOf(':where(', at);
    const rootDecl = bevel.lastIndexOf(':root', at);
    assert.ok(selector > rootDecl,
      '--pw-bevel-1 is declared outside the component-level :where() block');
  });
});

describe('state rules that could reach an ancestor', () => {
  const gloss = read('css/treatment/gloss.css');

  test('the gloss press-dim requires the glossed element to be a control', () => {
    /* :active matches every ancestor of the element being activated, not
       only the element itself. A bare [data-gloss]:active therefore fires on
       any glossed CONTAINER whenever anything inside it is pressed.

       That shipped. The dialog's title bar carries the gloss and holds the
       close button, so pressing the X dimmed the whole bar, which reads as a
       change unattached to the thing you pressed. It is not period behaviour
       either: an XP titlebar's gradient did not move when its close button
       was clicked.

       The guard is on the selector because the selector is the fix. Every
       :active rule in this file has to name what kind of element it applies
       to, so a container can never satisfy it. */
    const bare = [...bare_(gloss).matchAll(/([^{}]*):active[^{}]*\{/g)]
      .map((m) => m[0].trim())
      .filter((rule) => !/\b(?:button|a\[href\]|\[role=)/.test(rule));
    assert.deepEqual(bare, [],
      `a gloss :active rule does not restrict to a control, so it fires on ancestors too:\n${bare.join('\n')}`);
  });
});

const bare_ = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('what a colour token is allowed to be', () => {
  const files = [
    'css/tokens/primitive.chrome.css',
    'css/tokens/semantic.chrome.css',
    'css/tokens/theme-auto.css',
  ];

  test('no color-mix, no color(), no relative colour syntax', () => {
    /* taste-check lists color-mix and color in KNOWN_UNSUPPORTED and rejects
       oklch(from ...). A derived colour is one the gate skips, and a skipped
       pair reports as a pass. It is also the idiom DaisyUI uses everywhere,
       so it is the single most likely thing for a helpful edit to introduce. */
    for (const rel of files) {
      const css = read(rel).replace(/\/\*[\s\S]*?\*\//g, '');
      assert.equal(/color-mix\(/.test(css), false, `color-mix() in ${rel}`);
      assert.equal(/[^-]\bcolor\(/.test(css), false, `color() in ${rel}`);
      assert.equal(/\b(?:oklch|oklab|lab|lch|rgb|hsl)\(\s*from\b/.test(css), false,
        `relative colour syntax in ${rel}`);
    }
  });
});

describe('what would block the second skin', () => {
  const componentCss = ['button', 'toggle', 'tabs', 'dialog', 'slider', 'badge', 'lcd']
    .map((n) => [`css/components/${n}.css`, read(`css/components/${n}.css`)]);

  test('no component writes box-shadow; they assign the slot', () => {
    /* --pw-elev is role neutral on purpose. The second skin puts an outer
       glow in that slot, and a component saying --pw-shadow-raised out loud
       would force it to either fake a bevel or edit seven files. */
    for (const [rel, css] of componentCss) {
      const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
      assert.equal(/box-shadow\s*:/.test(stripped), false, `${rel} sets box-shadow directly`);
    }
  });

  test('no component sets overflow: hidden on a bevelled surface', () => {
    /* It is the obvious fix for a 1px corner artefact and it would clip the
       second skin's outer glow dead. The gloss clips its own pseudo-elements
       instead. The readout's marquee is the one legitimate use, and it is on
       a wrapper that carries no elevation. */
    for (const [rel, css] of componentCss) {
      if (rel.endsWith('lcd.css')) continue;
      const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
      assert.equal(/overflow\s*:\s*hidden/.test(stripped), false, `${rel} sets overflow: hidden`);
    }
  });

  test('no component declares a literal colour', () => {
    /* The skin split leaks the moment a component knows what colour
       something is. Radii and sizes are structure and stay; colour does not. */
    for (const [rel, css] of componentCss) {
      const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
      const literals = [
        ...stripped.matchAll(/#[0-9a-fA-F]{3,8}\b/g),
        ...stripped.matchAll(/\b(?:rgba?|hsla?|oklch)\((?!\s*255\s+255\s+255\s*\/)[^)]*\)/g),
      ].map((m) => m[0]);
      assert.deepEqual(literals, [], `${rel} declares a literal colour: ${literals.join(', ')}`);
    }
  });
});
