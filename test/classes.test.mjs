/**
 * The class reference against the stylesheet it describes.
 *
 * CLASSES.md exists because the package bet that the stylesheet is the product
 * and React is optional, then wrote the documentation for the React consumer.
 * The README named one class out of seventy-two, and a page written from it
 * plus reasonable inference got three of six class names wrong and rendered
 * anyway, with no error: a window with no title bar.
 *
 * So the reference is generated, and these hold it honest in every direction
 * it could quietly stop being true.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { GROUPS, described, markdown, shipped } from '../scripts/build-class-reference.mjs';
import * as kit from '../dist/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

describe('the class reference', () => {
  test('is what the generator produces', () => {
    /* Same rule the other generated files follow: `npm test` compiles but does
       not regenerate, so a hand edit to CLASSES.md is caught here rather than
       silently overwritten by the next build. */
    assert.equal(read('CLASSES.md'), `${markdown}\n`);
  });

  test('describes every class the stylesheet ships, and no others', () => {
    /* Both directions. A new class fails until somebody writes down what it
       is, and a description outliving its class fails too. The second half is
       the one that found .pw-lcd-caption: glow.css uppercased it, no component
       ever emitted it, and no component file styled it, so the rule could
       never match. It had no honest description, which is how it surfaced. */
    const undescribed = shipped.filter((c) => !described.has(c));
    assert.deepEqual(undescribed, [],
      `the stylesheet ships these and CLASSES.md never names them:\n${
        undescribed.map((c) => `  .${c}`).join('\n')}`);

    const stale = [...described.keys()].filter((c) => !shipped.includes(c));
    assert.deepEqual(stale, [],
      `CLASSES.md describes these and the stylesheet has no rule for them:\n${
        stale.map((c) => `  .${c}`).join('\n')}`);
  });

  test('every class it ships is rendered by a component, or is a documented hook', () => {
    /* A class the stylesheet styles and nothing renders is a rule that can
       never match, and from the outside that is indistinguishable from a
       stylesheet that failed to parse. The exceptions are real and there are
       two, both of them surfaces a consumer builds rather than ones this kit
       renders, so they are listed with a reason rather than exempted by shape. */
    const HOOKS = new Map([
      ['pw-raised', 'a documented escape hatch for a consumer\'s own surface'],
      ['pw-sunken', 'the same, for a well'],
    ]);

    let src = '';
    for (const file of readdirSync(join(ROOT, 'src'))) src += read(join('src', file));

    const dead = shipped.filter((c) => !HOOKS.has(c) && !new RegExp(`['"\`]${c}['"\`\\s]`).test(src));
    assert.deepEqual(dead, [],
      `styled by the bundle and rendered by nothing:\n${dead.map((c) => `  .${c}`).join('\n')}`);

    for (const [name, why] of HOOKS) {
      assert.ok(shipped.includes(name), `${name} is listed as a hook ("${why}") and ships no rule`);
    }
  });

  test('every class named in a markup example is one that ships', () => {
    /* This is the assertion the whole file is really for. The examples are
       hand-written, and a hand-written class name that does not exist is
       exactly the failure the reference was built to stop: the rule simply
       does not match, nothing errors, and the page looks nearly right. */
    const named = new Set();
    for (const g of GROUPS) {
      for (const [, cls] of (g.markup ?? '').matchAll(/class="([^"]*)"/g)) {
        for (const c of cls.split(/\s+/)) if (c.startsWith('pw-')) named.add(c);
      }
    }
    assert.ok(named.size >= 20, `only ${named.size} classes appear in any example`);
    const invented = [...named].filter((c) => !shipped.includes(c)).sort();
    assert.deepEqual(invented, [],
      `an example writes these and no rule matches them:\n${invented.map((c) => `  .${c}`).join('\n')}`);
  });

  test('the element each class claims is the element that renders', () => {
    /* "Goes on a <span>" is the kind of claim that stops being true quietly,
       and it is the half of the reference a consumer cannot check by looking
       at the stylesheet. So the components are rendered and asked.

       Surfaces marked `open` are skipped: a portal renders nothing outside a
       browser, which is also why check:a11y opens each of them there. */
    const page = render(h('div', null,
      h(kit.Button, {}, 'Save'),
      h(kit.Toggle, { pressed: true }, 'Shuffle'),
      h(kit.ToggleGroup, { type: 'single', value: 'l' }, h(kit.ToggleGroupItem, { value: 'l' }, 'L')),
      h(kit.Tabs, { defaultValue: 'a' },
        h(kit.TabList, { label: 'Sections' }, h(kit.Tab, { value: 'a' }, 'A')),
        h(kit.TabPanel, { value: 'a' }, 'body')),
      h(kit.Window, { title: 'Playlist', onClose: () => {} }, 'body'),
      h(kit.Field, { label: 'Server' }, h(kit.Input, {})),
      h(kit.Field, { label: 'Notes' }, h(kit.Textarea, {})),
      h(kit.Field, { label: 'On top' }, h(kit.Checkbox, { checked: true })),
      h(kit.RadioGroup, { value: 'a' }, h(kit.Field, { label: 'A' }, h(kit.Radio, { value: 'a' }))),
      h(kit.Select, { label: 'Device', defaultValue: 'a' }, h(kit.SelectItem, { value: 'a' }, 'A')),
      h(kit.Field, { label: 'Reconnect' }, h(kit.Switch, { checked: true })),
      h(kit.Collapsible, { defaultOpen: true },
        h(kit.CollapsibleTrigger, {}, 'Advanced'),
        h(kit.CollapsibleContent, {}, 'body')),
      h(kit.Toolbar, { label: 'Formatting' },
        h(kit.ToolbarButton, {}, 'Bold'),
        h(kit.ToolbarSeparator, {})),
      h(kit.Separator, {}),
      h(kit.Slider, { label: 'Volume', defaultValue: [70] }),
      h(kit.Equalizer, { label: 'EQ', bands: [{ id: 'b', label: '60', value: 0 }] }),
      h(kit.Transport, { label: 'Playback' }, h(kit.TransportButton, { icon: 'play', label: 'Play' })),
      h(kit.Progress, { value: 40, label: 'Seek' }),
      h(kit.List, { label: 'Playlist', rows: [{ id: 'r', primary: 'Intro', secondary: '2:14' }], current: 'r' }),
      h(kit.Badge, { status: 'success' }, 'Connected'),
      h(kit.Meta, { items: [{ label: 'Session', value: '42 min' }] }),
      h(kit.Icon, { name: 'check', decorative: true }),
      h(kit.Spinner, {}),
      h(kit.Visualiser, { label: 'Spectrum analyser', values: [0.2, 0.6, 0.9] }),
      h(kit.Readout, { value: '01:23', marquee: true }),
      h(kit.Menubar, {}, h(kit.Menu, {}, h(kit.MenuTrigger, {}, 'File'))),
    ));

    /* Which tags each class was found on. A class can legitimately appear on
       more than one; the claim is that the one written down is among them. */
    const tags = new Map();
    for (const [, tag, attrs] of page.matchAll(/<([a-z][a-z0-9]*)([^>]*)>/g)) {
      const cls = attrs.match(/class="([^"]*)"/);
      if (!cls) continue;
      for (const c of cls[1].split(/\s+/)) {
        if (c.startsWith('pw-')) (tags.get(c) ?? tags.set(c, new Set()).get(c)).add(tag);
      }
    }

    const checked = [];
    const wrong = [];
    const absent = [];
    for (const [name, { element, only }] of described) {
      if (only === 'open' || element === null) continue;
      const found = tags.get(name);
      if (!found) { absent.push(name); continue; }
      checked.push(name);
      if (!found.has(element)) {
        wrong.push(`.${name} is documented as <${element}> and renders as ${
          [...found].map((t) => `<${t}>`).join(', ')}`);
      }
    }

    /* A claim nothing rendered is a claim nothing checked, so absence fails
       rather than passing quietly. */
    assert.deepEqual(absent.sort(), [],
      `CLASSES.md names an element for these and nothing above renders them:\n${
        absent.map((c) => `  .${c}`).join('\n')}`);
    assert.ok(checked.length >= 40, `only ${checked.length} elements were checked`);
    assert.deepEqual(wrong, [], wrong.join('\n'));
  });

  test('the package ships the reference and the page it points at', () => {
    /* CLASSES.md tells a consumer to open demo/states.html from inside
       node_modules. That page was framed in the README as the standing proof
       the CSS needs no React, and it was not in the tarball.

       The entry is that page and its stylesheet rather than the whole demo
       directory, and that is deliberate. demo/index.html boots React from
       bundles under demo/vendor/, which are not published: half a megabyte of
       React in a CSS kit's tarball, for a page nobody is told to open from
       node_modules. Shipping the directory and excluding the bundles was
       tried, and it ships a page that 404s on its own import map. */
    const files = JSON.parse(read('package.json')).files;
    for (const entry of ['CLASSES.md', 'demo/states.html', 'demo/demo.css']) {
      assert.ok(files.includes(entry), `${entry} is not in the package's files array`);
    }
    assert.ok(!files.includes('demo'),
      'the whole demo directory is published again, which puts demo/index.html in the '
      + 'tarball pointing at vendor bundles that are not');
    assert.match(read('CLASSES.md'), /demo\/states\.html/);
  });
});
