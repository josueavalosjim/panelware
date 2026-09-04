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
import { luminance, parseColor } from '@josueavalosjim/taste-check';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { exportedPaths, missingFromPack, packedFiles } from '../scripts/check-exports.mjs';
import { disagreements, scannedLine } from '../scripts/check-parity.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

/**
 * Comments removed. Every file here explains its own selectors in prose, and
 * those prose selectors are matchable text.
 *
 * A function declaration, not a const: describe() bodies run at collection
 * time, so a suite defined above a const helper hits its temporal dead zone.
 */
function bare(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Every `--name: value;` inside the first rule whose selector list begins at
 * the start of a line with `selector`.
 *
 * The line anchor is not decoration. Searching for the bare string found
 * `:root[data-theme="dark"]` inside the header comment that explains why the
 * dark block is written the way it is, and every one of these tests then
 * measured the light block against itself and passed.
 */
function block_(css, selector) {
  const source = bare(css);
  /* Leading whitespace allowed: theme-auto's block is indented inside its
     media query. */
  const at = source.search(new RegExp(`^[ \t]*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm'));
  assert.notEqual(at, -1, `no block found for ${selector}`);
  return declarations(source, at);
}
const block = block_;

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

  const light = block(semantic, ':root,\n[data-skin="chrome"]');
  const dark = block(semantic, '[data-theme="dark"],');

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
    const darkAll = new Map([...dark, ...block(skin, '[data-theme="dark"],')]);
    for (const [name, value] of darkAll) {
      assert.equal(autoBlock.get(name), value, `theme-auto drifted on ${name}`);
    }
    assert.deepEqual([...autoBlock.keys()].sort(), [...darkAll.keys()].sort());
  });
});

describe('the density axis', () => {
  const density = read('css/tokens/density.css');
  const comfortable = block(density, ':root,\n[data-density="comfortable"]');
  const compact = block(density, '[data-density="compact"]');

  test('every density declares the identical token set', () => {
    /* Same rule as the themes, same reason: a block that is only a diff
       inherits whatever the previous one left behind, and the gap is silent. */
    assert.deepEqual([...compact.keys()].sort(), [...comfortable.keys()].sort());
  });

  test('no density ships a target under the WCAG 2.2 AA floor', () => {
    /* 24x24 is 2.5.8, and it is the one thing "user choice over everything"
       does not get to opt out of: a mode that cannot be operated is not an
       option. The references are denser than this and cannot be matched at
       full fidelity, which is a real cost and the reason it is written down.
       An XP command button was 75x23; Winamp's transport buttons were 23x18. */
    const px = (v) => (v.endsWith('rem') ? parseFloat(v) * 16 : parseFloat(v));
    for (const [name, b] of [['comfortable', comfortable], ['compact', compact]]) {
      for (const token of ['--pw-control-h', '--pw-thumb-hit']) {
        const value = b.get(token);
        assert.ok(value, `${name} does not declare ${token}`);
        assert.ok(px(value) >= 24,
          `${name}'s ${token} is ${value}, under the 24px target floor`);
      }
    }
  });

  test('density values are stated, never derived from each other', () => {
    /* A density token computed from another resolves against the element the
       first is declared on, so a subtree override would never re-derive it
       and every control inside would keep the outer density's target. Same
       trap that made --pw-bevel-depth inert. */
    for (const [, b] of [['comfortable', comfortable], ['compact', compact]]) {
      for (const [name, value] of b) {
        if (!name.startsWith('--pw-control-') && !name.startsWith('--pw-thumb')) continue;
        assert.doesNotMatch(value, /var\(--pw-(?:control|thumb)/,
          `${name} derives from another density token`);
      }
    }
  });
});

describe('touch axes', () => {
  test('a vertical slider hands the horizontal axis back to the browser', () => {
    /* touch-action: none takes both axes. On a vertical slider the horizontal
       one is not needed, and ten of these is wider than a phone, so the group
       has to scroll sideways and cannot if every band swallows the gesture.
       The mirror of the trap on a horizontal rail, where pan-y kills the
       sideways drag: give the browser the axis the control does not use. */
    const css = bare(read('css/components/slider.css'));
    assert.match(css, /\[data-orientation="vertical"\][\s\S]{0,900}?touch-action: pan-x/);
  });

  test('a group wider than a phone can scroll', () => {
    /* Ten bands at a 44px target is 476px. Narrowing the columns to fit
       would put them under the target floor, and an equaliser that wraps is
       not an equaliser. */
    const css = bare(read('css/components/equalizer.css'));
    assert.match(css, /\.pw-eq \{[^}]*overflow-x: auto/);
  });
});

describe('the focus ring', () => {
  test('is two rings in opposite values, not one', () => {
    /* A single ring is only as visible as the surface behind it allows, and
       this kit puts controls on a title bar painted in the very accent the
       ring is drawn with. --pw-color-focus on --pw-color-primary measured
       1.00:1: a ring that was not there at all, in both themes. */
    const reset = bare(read('css/reset.css'));
    assert.match(reset, /--pw-focus-halo:/, 'no inner ring is set on focus');
    assert.match(reset, /outline:[^;]*var\(--pw-color-focus\)/);
    const bevel = bare(read('css/treatment/bevel.css'));
    assert.match(bevel, /box-shadow: var\(--pw-elev\), var\(--pw-focus-halo\)/,
      'the elevation slot does not compose the focus halo, so controls inside it show one ring');
  });

  test('nothing draws it without asking whether focus is visible', () => {
    /* The rule this catches: .pw-list-item[data-active] drew the focus
       outline with no condition at all, and List seeds its active row in the
       state initialiser so aria-activedescendant has somewhere to point from
       the first render. Every list on the page therefore painted a 2px focus
       ring on a row before anyone had touched anything, three files away from
       reset.css stating the opposite as this kit's own rule.

       Nothing else could see it. axe does not mind a ring, the contrast gate
       measures it happily, and both demo pages were wrong in the same way so
       parity agreed with itself.

       The bundle rather than the sources, because it is what a browser gets
       and one scan covers every component file. */
    const css = bare(read('css/panelware.css'));
    const unconditioned = [];
    for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/outline:[^;]*var\(--pw-color-focus/.test(body)) continue;
      if (!/:focus-visible/.test(selector)) unconditioned.push(selector.trim().replace(/\s+/g, ' '));
    }
    assert.deepEqual(unconditioned, []);
  });

  test('the two halves are declared in every theme', () => {
    /* Both, in both. A theme that declared only --pw-color-focus would fall
       back to inheriting the other theme's companion and could land the same
       value on the same accent again. */
    const semantic = read('css/tokens/semantic.chrome.css');
    for (const [name, selector] of [
      ['light', ':root,\n[data-skin="chrome"]'],
      ['dark', '[data-theme="dark"],'],
    ]) {
      const b = block(semantic, selector);
      assert.ok(b.get('--pw-color-focus'), `${name} has no --pw-color-focus`);
      assert.ok(b.get('--pw-color-focus-contrast'), `${name} has no --pw-color-focus-contrast`);
      assert.notEqual(b.get('--pw-color-focus'), b.get('--pw-color-focus-contrast'),
        `${name}'s two focus rings are the same colour`);
    }
  });
});

describe('the axes nest', () => {
  test('no axis block is anchored to :root', () => {
    /* Anchored, an axis only works on <html>: a consumer writing
       <div data-theme="dark"> around one panel gets nothing, because
       :root[data-theme="dark"] matches one element and it is not that div.
       Scoped theming is table stakes for a design system. */
    for (const rel of ['css/tokens/semantic.chrome.css', 'css/tokens/skin.chrome.css',
                       'css/tokens/density.css']) {
      const css = bare(read(rel));
      const anchored = [...css.matchAll(/:root\[data-(?:theme|skin|density)=/g)];
      assert.deepEqual(anchored.map((m) => m[0]), [],
        `${rel} anchors an axis to :root, so it will not work on a subtree`);
    }
  });

  test('an explicit light subtree can win back from a dark ancestor', () => {
    /* The light values used to live on a bare :root only, so a light subtree
       inside a dark page matched nothing and stayed dark. One direction
       worked and the other did not, which is worse than neither. */
    const css = bare(read('css/tokens/semantic.chrome.css'));
    assert.match(css, /\[data-theme="light"\]/);
  });
});

describe('where the light comes from', () => {
  const primitive = read('css/tokens/primitive.chrome.css');
  const semantic = read('css/tokens/semantic.chrome.css');

  /** The ramp, as luma. Semantic tokens are one var() hop off a primitive. */
  const ramp = new Map(
    [...bare(primitive).matchAll(/(--pw-[\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)]
      .map(([, name, hex]) => [name, luminance(parseColor(hex).rgba)]));

  const lumaOf = (block, token) => {
    const value = block.get(token);
    assert.ok(value, `${token} is not declared in this theme`);
    const hop = value.match(/^var\((--[\w-]+)\)$/);
    assert.ok(hop, `${token} is ${value}, not a single var() off a primitive`);
    const l = ramp.get(hop[1]);
    assert.notEqual(l, undefined, `${hop[1]} is not a primitive`);
    return l;
  };

  for (const [name, selector] of [
    ['light', ':root,\n[data-skin="chrome"]'],
    ['dark', '[data-theme="dark"],'],
  ]) {
    test(`${name} is lit from above and to the left`, () => {
      /* The four bevel inks plus the face have to run monotonically from the
         bottom-right outer edge up to the top-left outer edge. That is what
         "there is a light source, and it is above" means as a number.

         The dark theme failed this and it was the most serious defect in the
         kit. --pw-bevel-frame had been pointed at a light rung so the outer
         line would clear 3:1 against a dark page, which fixed the contrast
         and inverted the physics: the bottom-right shadow came out brighter
         than every other part of the control, so the light source sat below
         the object in dark and above it in light. A raised control in dark
         and a sunken one in light then shared a signature.

         Contrast is checked by the gate and cannot see this, because every
         individual pair still passed. Only the ordering says it. */
      const block = block_(semantic, selector);
      const order = ['--pw-bevel-frame', '--pw-bevel-shade', '__face',
                     '--pw-bevel-face', '--pw-bevel-light'];
      const values = order.map((t) =>
        t === '__face' ? lumaOf(block, '--pw-color-base-200') : lumaOf(block, t));
      for (let i = 1; i < values.length; i += 1) {
        assert.ok(values[i] > values[i - 1],
          `${order[i]} (${values[i].toFixed(3)}) is not lighter than ` +
          `${order[i - 1]} (${values[i - 1].toFixed(3)}); the bevel is lit from the wrong side`);
      }
    });
  }

  const cr = (a, b) => {
    const [hi, lo] = a > b ? [a, b] : [b, a];
    return (hi + 0.05) / (lo + 0.05);
  };

  for (const [name, selector] of [
    ['light', ':root,\n[data-skin="chrome"]'],
    ['dark', '[data-theme="dark"],'],
  ]) {
    test(`the ${name} divider is its own tier, between the face and the boundary`, () => {
      /* The role exists because a painted-pixel audit found a gap in the set,
         so the thing worth guarding is the gap staying filled rather than the
         token merely existing. Pointed at a face value it goes invisible,
         which is the bug it was added to fix. Pointed at the boundary it
         collapses into the control edge and the gap reopens with an extra
         name standing in front of it.

         Both directions, both themes, measured against the page. The gate
         holds the 2:1 floor; only this says the tier is distinct. */
      const b = block_(semantic, selector);
      const page = lumaOf(b, '--pw-color-base-100');
      const face = cr(lumaOf(b, '--pw-color-base-200'), page);
      const divider = cr(lumaOf(b, '--pw-color-divider'), page);
      const boundary = cr(lumaOf(b, '--pw-bevel-boundary'), page);
      assert.ok(divider > face,
        `divider ${divider.toFixed(2)}:1 is no stronger than a control face ${face.toFixed(2)}:1`);
      assert.ok(divider < boundary,
        `divider ${divider.toFixed(2)}:1 is as strong as the boundary ${boundary.toFixed(2)}:1`);
    });
  }
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

describe('visual state and ARIA state', () => {
  test('every data-state rule has its aria twin', () => {
    /* The CSS keyed off data-state and the accessibility tree keyed off
       aria-pressed / aria-selected, with nothing binding them. Radix emits
       both so it held under Radix, but the kit also ships as standalone CSS,
       and a consumer wiring it by hand got a control announced as pressed
       that rendered completely unpressed. */
    /* Three spellings for the toggle, not two. A standalone toggle is a
       button that is pressed; the same toggle inside a ToggleGroup is a radio
       that is checked. The skin has no business knowing which, so every rule
       that styles one styles all of them. */
    const pairs = [
      ['css/components/toggle.css', 'data-state="on"',
        ['aria-pressed="true"', 'aria-checked="true"']],
      ['css/components/tabs.css', 'data-state="active"', ['aria-selected="true"']],
    ];
    for (const [rel, dataAttr, ariaAttrs] of pairs) {
      const css = bare(read(rel));
      const dataCount = css.split(`[${dataAttr}]`).length - 1;
      for (const ariaAttr of ariaAttrs) {
        const ariaCount = css.split(`[${ariaAttr}]`).length - 1;
        assert.equal(ariaCount, dataCount,
          `${rel} styles [${dataAttr}] ${dataCount} times but [${ariaAttr}] ${ariaCount} times`);
      }
    }
  });
});

describe('what Radix positions, the kit must not', () => {
  test('the slider thumb does not position itself', () => {
    /* Radix does not move the thumb. It wraps it in its own absolutely
       positioned span and moves that. An absolute on the thumb as well
       collapses the wrapper to 0x0, so the wrapper's translateX(-50%) has a
       zero-width box to offset and the grip lands exactly half a thumb width
       off the value it points at. Measured at 11px on a 22px thumb, and it
       looked plausible: the thumb still moved with the value, just wrong.

       position: relative is fine and is what is there, so the hit expander
       has something to anchor to. absolute is the one that breaks it. */
    const css = bare(read('css/components/slider.css'));
    const rule = css.match(/\.pw-slider-thumb\s*\{[^}]*\}/);
    assert.ok(rule, '.pw-slider-thumb rule not found');
    assert.doesNotMatch(rule[0], /position:\s*absolute/,
      '.pw-slider-thumb positions itself, which fights the wrapper Radix moves');
  });

  test('the readout tracks three scroll states, not two', () => {
    /* A boolean cannot express "the viewer has not decided", so hover could
       never be overridden and the resume button could not resume while the
       pointer sat on the readout, which is where it is when you press it. */
    const css = bare(read('css/components/lcd.css'));
    assert.match(css, /\[data-scroll="paused"\]/);
    assert.match(css, /\[data-scroll="running"\]/);
    /* And the focus trap that made resume impossible must stay gone: the
       pause control lives inside the marquee, so :focus-within held the
       animation paused for as long as the button that resumes it had focus. */
    assert.doesNotMatch(css, /\.pw-lcd-marquee:focus-within/);
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
    const unscoped = [...bare(gloss).matchAll(/([^{}]*):active[^{}]*\{/g)]
      .map((m) => m[0].trim())
      .filter((rule) => !/\b(?:button|a\[href\]|\[role=)/.test(rule));
    assert.deepEqual(unscoped, [],
      `a gloss :active rule does not restrict to a control, so it fires on ancestors too:\n${unscoped.join('\n')}`);
  });
});

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
describe('the release', () => {
  test('the changelog leads with the version being shipped', () => {
    /* publish.yml already refuses a tag that disagrees with package.json, so
       the version cannot ship untraceable. What it cannot see is a changelog
       whose top entry describes the version before it, which publishes real
       code under somebody else's notes and fails no check anywhere. */
    const pkg = JSON.parse(read('package.json'));
    const top = read('CHANGELOG.md').match(/^## (.+)$/m);
    assert.ok(top, 'CHANGELOG.md has no version heading');
    assert.equal(top[1].trim(), pkg.version,
      `the changelog leads with ${top[1].trim()} and package.json says ${pkg.version}`);
  });

  test('the exports map is walked into, not over', () => {
    /* The bug this replaces: publish.yml did v.replace() over the values of
       the exports map, and "." is a conditional object rather than a string,
       so it threw a TypeError on the very first entry. It failed the first
       real release having never checked a single path, and no test could have
       caught it, because it lived as an inline script in a YAML file.

       So the assertion is not only "nothing is missing", which an empty list
       satisfies. It is that the conditional entry is descended into and its
       leaves come back. */
    const pkg = JSON.parse(read('package.json'));
    const paths = exportedPaths(pkg);
    assert.ok(paths.length >= Object.keys(pkg.exports).length,
      'fewer paths than entries, so a conditional export was skipped rather than walked');
    assert.ok(paths.some(([name, path]) => name === '.' && path === 'dist/index.js'),
      'the conditional "." entry did not yield its import target');
    assert.ok(paths.every(([, path]) => !path.startsWith('./')),
      'a path kept its leading ./ and would never match a packed file');
  });

  test('every exported path is a file that ships', () => {
    /* A stylesheet left out of the files array publishes a package whose own
       documented import throws on install. This asks npm what it would pack
       rather than reading the files array, because the two are not the same
       question: files is a pattern list and the tarball is the answer. */
    const pkg = JSON.parse(read('package.json'));
    assert.deepEqual(missingFromPack(pkg, packedFiles()).map(([n]) => n), []);
  });
  test('the README describes the module system the package actually has', () => {
    /* The README now documents two errors a consumer will hit: a CommonJS
       require gets ERR_PACKAGE_PATH_NOT_EXPORTED, and importing without the
       optional peers gets ERR_MODULE_NOT_FOUND for react. Both are true
       because of three lines in package.json, and if any of them changes the
       documentation becomes a lie that nothing else would notice.

       This does not assert the package SHOULD be ESM only. It asserts that
       the README and package.json still agree about whether it is. */
    const pkg = JSON.parse(read('package.json'));
    const doc = read('README.md');
    const esmOnly = pkg.type === 'module' && !('require' in (pkg.exports['.'] ?? {}));
    assert.equal(esmOnly, doc.includes('The package is ESM only'),
      esmOnly
        ? 'the package is ESM only and the README no longer says so'
        : 'the package now has a require condition and the README still says ESM only');
    const optional = Object.keys(pkg.peerDependenciesMeta ?? {})
      .filter((k) => pkg.peerDependenciesMeta[k].optional);
    assert.deepEqual(optional.sort(), ['radix-ui', 'react'],
      'the README explains a missing-peer error that depends on these being optional');
  });
});
describe('the names this kit ships', () => {
  test('no trademark is used as an identifier', () => {
    /* HANDOFF.md set this rule before the first commit and a preset broke it
       anyway: the winamp palette shipped under that name for four commits.
       Citing a trademark as prior art is what everybody in this genre does and
       is fine, and NES.css referencing Nintendo is the precedent. Using one as
       the thing a consumer types is not.

       So the test is about identifiers, not about prose. A skin name, a preset
       name, an attribute value, a file name, a token name. The README may say
       whatever it likes about where the look came from. */
    const MARKS = ['winamp', 'aqua', 'aero', 'luna', 'nintendo', 'playstation'];
    const offenders = [];

    const files = [];
    const walk = (dir) => {
      for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
        if (e.isDirectory()) { walk(join(dir, e.name)); continue; }
        files.push(join(dir, e.name));
      }
    };
    walk('css');
    walk('src');
    for (const f of files) {
      for (const mark of MARKS) {
        if (f.toLowerCase().includes(mark)) offenders.push(`${f} is named after ${mark}`);
      }
      if (!f.endsWith('.css') && !f.endsWith('.ts') && !f.endsWith('.tsx')) continue;
      const bare = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      for (const mark of MARKS) {
        /* an attribute value, a token name, or a class */
        const re = new RegExp(`(--pw-[\\w-]*${mark}|["'=]${mark}["']|\\.pw-[\\w-]*${mark})`, 'i');
        if (re.test(bare)) offenders.push(`${f} uses "${mark}" as an identifier`);
      }
    }
    assert.deepEqual(offenders, []);
  });
});

describe('what the parity check calls a disagreement', () => {
  /* The hole this closes: box() returned null for an element that is not on
     the page, and the comparison was JSON.stringify(a) !== JSON.stringify(b),
     so a shape missing from BOTH demo pages compared "null" against "null"
     and agreed. Deleting the badge from both pages left the check green while
     it claimed to be comparing the badge.

     Testing the comparison rather than the run is the whole point. Driving
     two pages in a browser to prove a string equality is slow and would not
     have caught this anyway: the bug was in the pure part. */
  const page = (shapes, probes = { hitAt15: true }) => ({ controls: 8, shapes, probes });

  test('a shape on neither page fails rather than matching itself', () => {
    const got = disagreements(page({ badge: null }), page({ badge: null }));
    assert.deepEqual(got, ['badge is on neither page, so nothing compared it']);
  });

  test('a shape on one page names the page it is missing from', () => {
    assert.deepEqual(disagreements(page({ badge: '90x22' }), page({ badge: null })),
      ['badge is missing from index.html']);
    assert.deepEqual(disagreements(page({ badge: null }), page({ badge: '90x22' })),
      ['badge is missing from states.html']);
  });

  test('shapes that differ still report both sides', () => {
    assert.deepEqual(disagreements(page({ badge: '90x22' }), page({ badge: '90x24' })),
      ['badge: states.html "90x22", index.html "90x24"']);
  });

  test('probes are compared, not only sizes', () => {
    const a = { controls: 8, shapes: { badge: '90x22' }, probes: { hitAt15: true } };
    const b = { controls: 8, shapes: { badge: '90x22' }, probes: { hitAt15: false } };
    assert.deepEqual(disagreements(a, b), ['hitAt15: states.html true, index.html false']);
  });

  test('a page that never rendered says so once, not seventeen times', () => {
    /* index.html boots React from esm.sh. With no network it loads, throws in
       a module nobody is listening to, and leaves an empty <main> behind:
       every shape then reads as missing, which is a true statement that hides
       the one useful one. */
    const dead = { controls: 0, shapes: { badge: null, button: null }, probes: null };
    const got = disagreements(page({ badge: '90x22', button: '80x24' }), dead);
    assert.equal(got.length, 1);
    assert.match(got[0], /^index\.html rendered 0 controls/);
  });

  test('a green run reports how many shapes it compared', () => {
    /* The old line was Object.keys(JSON.parse('{}')).length || 'all', which
       always evaluated to 'all' and had never reported a count. */
    assert.equal(scannedLine(page({ badge: '90x22', button: '80x24' })),
      '3 shared shapes across 2 pages');
  });
});
