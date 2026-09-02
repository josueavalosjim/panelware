/**
 * The menu bar.
 *
 * Radix supplies the whole keyboard model, so the assertions here are about
 * the parts a primitive cannot know: what the markup carries, and what the
 * skin refuses to do.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { Menu, MenuTrigger, Menubar } from '../dist/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const bare = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('the menu bar', () => {
  test('is one tab stop with menubar semantics', () => {
    /* Five triggers would otherwise be five stops in a bar that is
       conceptually one control. Radix's roving tabindex is what prevents it,
       and this pins that we are still getting it. */
    const html = render(h(Menubar, null,
      h(Menu, { value: 'file' }, h(MenuTrigger, null, 'File')),
      h(Menu, { value: 'play' }, h(MenuTrigger, null, 'Play'))));
    assert.match(html, /role="menubar"/);
    assert.equal(html.match(/role="menuitem"/g).length, 2);
    assert.match(html, /aria-haspopup="menu"/);
    assert.match(html, /aria-expanded="false"/);
    assert.equal(html.match(/tabindex="-1"/g).length, 3, 'root plus both triggers');
  });

  test('the bar is flat and an open trigger inverts rather than sinking', () => {
    /* A pressed button and an open menu are different states. Giving the
       trigger the sunken bevel would say the first when it means the second,
       and giving every trigger a raised one at rest would turn File, Play and
       Options into five buttons in a row. */
    const css = bare(read('css/components/menubar.css'));
    const trigger = css.match(/\.pw-menubar-trigger \{[^}]*\}/)[0];
    assert.doesNotMatch(trigger, /--pw-elev/, 'the trigger takes an elevation at rest');
    const open = css.match(/\.pw-menubar-trigger\[data-state="open"\] \{[^}]*\}/)[0];
    assert.doesNotMatch(open, /shadow-sunken/, 'an open trigger reads as pressed');
    assert.match(open, /background-color: var\(--pw-color-primary\)/);
  });

  test('the left gutter is reserved on every item, not just checkable ones', () => {
    /* A menu whose labels shift sideways because one item happens to have a
       tick is a menu that moves under the pointer between openings. */
    const css = bare(read('css/components/menubar.css'));
    const item = css.match(/\.pw-menu-item \{[^}]*\}/)[0];
    assert.match(item, /padding: 0 var\(--pw-control-pad-x\) 0 var\(--pw-menu-gutter\)/);
  });

  test('every shortcut is shown and none is announced', () => {
    /* "Open Control O" is not a label, it is two things read as one
       sentence. The real binding belongs to the application.

       EVERY, not any. The first version of this asserted that the string
       appeared somewhere, which three components satisfy between them:
       stripping aria-hidden off one of the three left the other two to keep
       the test green. A guard that passes while the thing it guards is
       broken is worse than no guard, because it is also a claim. */
    const src = read('src/menubar.tsx');
    const uses = [...src.matchAll(/className="pw-menu-shortcut"([^>]*)>/g)];
    assert.ok(uses.length >= 3, `expected every shortcut site, found ${uses.length}`);
    for (const [, attrs] of uses) {
      assert.match(attrs, /aria-hidden="true"/, 'a shortcut is announceable');
    }
  });
});

describe('the reset', () => {
  test('zeroes the native border, not just the native background', () => {
    /* appearance: none removes a button's background in Chrome and leaves
       its 2px outset border alone. Every component built before the menu bar
       was in the shared elevation slot, which sets border: 0 for its own
       reasons, so the gap was invisible until a control was added outside
       it: the menu bar triggers rendered as bevelled boxes on a bar whose
       whole point is being flat. */
    /* Found by content rather than by which selector happens to close the
       list. Anchoring on the last class in the :where() broke the moment the
       form controls were added to it, which is a test that fails when the
       code is fine. */
    const reset = bare(read('css/reset.css'));
    const block = reset.split(/(?=:where\()/)
      .find((b) => b.includes('appearance: none'));
    assert.ok(block, 'no reset block strips native control chrome');
    assert.match(block, /\.pw-menubar-trigger/);
    assert.match(block, /border: 0/);
  });
});
