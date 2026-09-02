/**
 * The list.
 *
 * The one component with no Radix primitive behind it, so the keyboard model
 * is hand-rolled and the assertions carry more weight than usual.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { List } from '../dist/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

const ROWS = [
  { id: 'a', primary: 'First', secondary: '0:05' },
  { id: 'b', primary: 'Second', secondary: '3:15' },
  { id: 'c', primary: 'Third', secondary: '3:24' },
];
const list = (props = {}) => render(h(List, { label: 'Playlist', rows: ROWS, ...props }));

describe('the list', () => {
  test('is a listbox that is one tab stop', () => {
    /* A row per tab stop would put fifty stops in a playlist. */
    const html = list();
    assert.match(html, /role="listbox"/);
    assert.match(html, /aria-label="Playlist"/);
    assert.equal(html.match(/tabindex="0"/g).length, 1);
    assert.equal(html.match(/role="option"/g).length, ROWS.length);
  });

  test('points at its active row with aria-activedescendant', () => {
    /* Chosen over a roving tabindex because the list scrolls and its length
       is unbounded: roving means N tabindex writes per arrow press, this
       means one attribute. */
    const html = list({ selected: 'b' });
    const active = html.match(/aria-activedescendant="([^"]+)"/);
    assert.ok(active, 'no active row is pointed at');
    assert.ok(html.includes(`id="${active[1]}"`), 'points at an id that is not on the page');
  });

  test('selected and playing are separate states on separate rows', () => {
    /* You scroll a selection past the playing track constantly. Collapsing
       them into one highlight is the bug this component exists to avoid. */
    const html = list({ selected: 'a', current: 'c' });
    assert.match(html, /aria-selected="true"/);
    assert.match(html, /aria-current="true"/);
    const selectedRow = html.match(/<li[^>]*aria-selected="true"[^>]*>/)[0];
    assert.doesNotMatch(selectedRow, /aria-current/, 'the two states landed on one row');
  });

  test('one row can be both at once', () => {
    const html = list({ selected: 'b', current: 'b' });
    const row = html.match(/<li[^>]*aria-selected="true"[^>]*>/)[0];
    assert.match(row, /aria-current="true"/);
  });

  test('the playing row is marked and spoken, not only coloured', () => {
    /* Winamp colour-codes its rows and that is the one thing here not taken
       from it. Colour says nothing to a reader who cannot see it and nothing
       at all in forced colors, so the row carries a mark and the words.
       aria-current alone is not enough: it is announced inconsistently. */
    const html = list({ current: 'a' });
    assert.match(html, /class="pw-list-marker"/);
    assert.match(html, /class="pw-icon"/);
    assert.match(html, /class="pw-sr-only">, now playing</);
  });

  test('the gutter is reserved on every row, playing or not', () => {
    /* A list whose text shifts sideways when the track changes is a list
       that moves while you are reading it. */
    const css = read('css/components/list.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const item = css.match(/\.pw-list-item \{[^}]*\}/)[0];
    assert.match(item, /padding: 0 var\(--pw-control-pad-x\) 0 var\(--pw-menu-gutter\)/);
  });

  test('the keyboard row is drawn separately from the selected one', () => {
    /* With activedescendant the active row is not the focused element, so
       :focus-visible never fires on it and the ring has to come from an
       attribute. Without this rule, arrowing through a list shows nothing
       moving at all. */
    const css = read('css/components/list.css').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.match(css, /\.pw-list-item\[data-active\]/);
    assert.match(list(), /data-active=""/);
  });

  test('the arrow keys move the active row without selecting it', () => {
    /* Verified live in a browser as well; this pins that the handler does not
       call onSelect from a movement key, which would make every arrow press a
       selection change and fire a consumer's callback on navigation. */
    const src = read('src/list.tsx');
    const arrows = src.match(/case 'ArrowDown':[\s\S]*?case ' ':/)[0];
    assert.doesNotMatch(arrows, /onSelect/, 'a movement key selects');
  });

  test('the scroll follows the active row without reading offsetTop', () => {
    /* offsetTop is measured from the nearest POSITIONED ancestor, and
       .pw-list is static, so it returned the row's distance from the top of
       the document instead of from the scroller: three thousand pixels
       against a scroller two hundred and fifty-six tall. Every bounds check
       was therefore true, the first keypress slammed the scroll to its
       maximum and it never moved again, and the highlight walked off the top
       edge. Measured in a browser at the time: Home, then four ArrowDowns,
       scrollTop pinned at 96 throughout.

       Reading the two rects instead is what makes this independent of a
       property in another file that nothing stops a skin from changing. */
    const src = read('src/list.tsx');
    const scroll = src.match(/const el = ref\.current\?\.querySelector[\s\S]*?\n    \}/)[0];
    assert.doesNotMatch(scroll, /offsetTop/, 'the scroll maths reads offsetTop');
    assert.match(scroll, /getBoundingClientRect/);
  });

  test('the list wears the kit focus ring, not the browser default', () => {
    /* It is one tab stop and the only place the keyboard lands, so a missing
       entry in the shared list is not cosmetic. It shipped showing Chrome's
       own 1px auto ring, which the two-tone rule exists to replace. */
    const reset = read('css/reset.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const ring = reset.match(/:where\([^)]*\):focus-visible \{/)[0];
    assert.match(ring, /\.pw-list[,)]/);
  });
});
