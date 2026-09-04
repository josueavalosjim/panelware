/**
 * What the components actually emit.
 *
 * Server rendering, which covers seven of the eight. The dialog is a portal
 * and produces nothing without a DOM, so it is verified in a real browser
 * against demo/index.html instead; that is a real gap in this file and worth
 * knowing about rather than papering over with a DOM shim.
 *
 * The assertions are mostly about attributes rather than about markup shape,
 * because the attributes are the contract the CSS reads. A class name that
 * stops being emitted is a component that silently loses its whole treatment.
 */
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { describe, test } from 'node:test';

import {
  Badge, Button, Readout, Slider, Tab, TabList, TabPanel, Tabs, Toggle, Window,
} from '../dist/index.js';

describe('button', () => {
  test('emits one class, and the caller\'s alongside it', () => {
    const html = render(h(Button, { className: 'mine' }, 'Save'));
    assert.match(html, /class="pw-button mine"/);
    assert.match(html, />Save</);
  });

  test('gloss is an attribute that is present or absent, never "false"', () => {
    /* [data-gloss] matches on presence, so data-gloss="false" would turn the
       gloss ON. This is the reason flag() returns undefined rather than the
       boolean. */
    assert.match(render(h(Button, { gloss: true }, 'x')), /data-gloss=""/);
    assert.doesNotMatch(render(h(Button, { gloss: false }, 'x')), /data-gloss/);
    assert.doesNotMatch(render(h(Button, null, 'x')), /data-gloss/);
  });

  test('asChild renders the caller\'s element and keeps the styling', () => {
    const html = render(h(Button, { asChild: true }, h('a', { href: '/x' }, 'Go')));
    assert.match(html, /^<a /);
    assert.match(html, /class="pw-button"/);
    assert.match(html, /href="\/x"/);
  });

  test('the label is not wrapped', () => {
    /* It used to be, to lift it above the gloss. The gloss now paints behind
       the content instead, so the wrapper is gone and the button's own flex
       gap works between an icon and a label again. */
    assert.equal(render(h(Button, null, 'Save')),
      '<button class="pw-button">Save</button>');
  });
});

describe('toggle', () => {
  test('emits both the data state and the ARIA state', () => {
    /* The CSS keys off both, because a consumer wiring this by hand from the
       stylesheet alone would otherwise get a control announced as pressed
       that renders unpressed. Radix emitting both is what makes that pairing
       hold rather than merely defensive. */
    const on = render(h(Toggle, { pressed: true }, 'Shuffle'));
    assert.match(on, /data-state="on"/);
    assert.match(on, /aria-pressed="true"/);
    const off = render(h(Toggle, { pressed: false }, 'Shuffle'));
    assert.match(off, /data-state="off"/);
    assert.match(off, /aria-pressed="false"/);
  });
});

describe('badge', () => {
  test('a status always renders a mark AND a word', () => {
    /* The single rule this component exists to enforce. A caller cannot
       reduce a status to a coloured dot, because the mark has a default per
       status and the children carry the word. There is no prop that removes
       it. */
    const html = render(h(Badge, { status: 'success' }, 'Connected'));
    assert.match(html, /data-status="success"/);
    assert.match(html, /class="pw-icon"/);
    assert.match(html, /Connected/);
  });

  test('each status gets a different mark, not just a different colour', () => {
    /* Four badges that differed only in background would be colour carrying
       the whole meaning, which is the failure this component exists to
       avoid. The cells have to actually differ. */
    const cell = (status) => {
      const m = render(h(Badge, { status }, 'x')).match(/--pw-icon-x:(\d+);--pw-icon-y:(\d+)/);
      return `${m[1]},${m[2]}`;
    };
    const cells = ['success', 'warning', 'error', 'neutral'].map(cell);
    assert.equal(new Set(cells).size, 4, `marks repeat: ${cells.join(' ')}`);
  });

  test('the mark is hidden from assistive tech', () => {
    /* The word beside it already says this. "check Connected" is worse. */
    assert.match(render(h(Badge, { status: 'error' }, 'No device')),
      /aria-hidden="true"/);
  });

  test('the mark is a sheet cell, not a character from the reader\'s font', () => {
    /* It used to be '✓', '!', '×' and '•' pulled from whatever font the
       consumer's page was using, so the mark changed shape per platform and
       had no pixel grid at all. */
    const html = render(h(Badge, { status: 'success' }, 'Connected'));
    assert.doesNotMatch(html, /[✓×•]/);
    assert.match(html, /--pw-icon-x:/);
  });
});

describe('readout', () => {
  test('carries its string as a name, and is not a live region', () => {
    /* <output> was the obvious element and the wrong one: its implicit role
       is status, which is polite-live and atomic, so a clock announces its
       whole value every second. role="img" says what it is, once. */
    const html = render(h(Readout, { value: '04:21' }));
    assert.match(html, /role="img"/);
    assert.match(html, /aria-label="04:21"/);
    assert.doesNotMatch(html, /<output/);
    assert.doesNotMatch(html, /aria-live/);
  });

  test('cell indices are unitless integers in the markup', () => {
    /* Never "-27px 0". Every pixel dimension belongs in the stylesheet, and
       taste-check's treatments check flags a px literal in markup as the
       one-off value it would be. */
    const html = render(h(Readout, { value: '4:2' }));
    assert.match(html, /--pw-cell-x:4/);
    assert.doesNotMatch(html, /px/);
  });

  test('one cell per character, on the sheet that was asked for', () => {
    const html = render(h(Readout, { value: '12:34', mode: 'digits' }));
    assert.equal(html.match(/pw-lcd-cell/g).length, 5);
    assert.match(html, /data-sheet="digits"/);
    assert.match(render(h(Readout, { value: 'AB', mode: 'glyphs' })),
      /data-sheet="glyphs"/);
  });

  test('a marquee ships a real pause control and a second copy', () => {
    /* WCAG 2.2.2 asks for a mechanism to pause anything moving for more than
       five seconds. Pausing on hover is not one: a keyboard, switch or touch
       user has no way to trigger it. The second copy is what makes the -50%
       translate loop instead of snapping back through an empty box. */
    const html = render(h(Readout, { value: 'AB', mode: 'glyphs', marquee: true }));
    assert.match(html, /<button[^>]*class="pw-lcd-pause"/);
    assert.match(html, /aria-label="Pause scrolling"/);
    assert.match(html, /class="pw-lcd-window"/);
    assert.equal(html.match(/pw-lcd-cell/g).length, 4, 'two characters, twice');
  });

  test('a still readout has no pause control and no second copy', () => {
    const html = render(h(Readout, { value: 'AB', mode: 'glyphs' }));
    assert.doesNotMatch(html, /pw-lcd-pause/);
    assert.equal(html.match(/pw-lcd-cell/g).length, 2);
  });
});

describe('slider', () => {
  test('is named, and Radix supplies the value semantics', () => {
    const html = render(h(Slider, { label: 'Volume', defaultValue: [40], max: 100 }));
    assert.match(html, /class="pw-slider"/);
    assert.match(html, /class="pw-slider-track"/);
    assert.match(html, /class="pw-slider-range"/);
    assert.match(html, /role="slider"/);
    assert.match(html, /aria-label="Volume"/);
    assert.match(html, /aria-valuemin="0"/);
    assert.match(html, /aria-valuemax="100"/);
    /* aria-valuenow is deliberately NOT asserted here. Radix does not emit it
       server-side, and the thumb comes back with display:none until it has
       measured, so this render is not what a user gets. The value semantics
       that only exist after hydration are checked in the browser instead, on
       demo/index.html. Asserting them here would either fail or, worse, get
       relaxed until it passed and stopped meaning anything. */
  });

  test('format becomes aria-valuetext', () => {
    /* aria-valuenow alone is adequate only for a bare number. A screen reader
       reading "70" for a gain in decibels has said nothing. */
    const html = render(h(Slider, {
      label: 'Gain', defaultValue: [70], max: 100, format: (v) => `${v} decibels`,
    }));
    assert.match(html, /aria-valuetext="70 decibels"/);
  });

  test('no valuetext when none was asked for, rather than a duplicate number', () => {
    const html = render(h(Slider, { label: 'Volume', defaultValue: [40], max: 100 }));
    assert.doesNotMatch(html, /aria-valuetext/);
  });
});

describe('tabs', () => {
  test('Radix wires the pattern; the kit only adds classes', () => {
    /* Roving tabindex, aria-controls and aria-labelledby are the parts the
       APG requires and the parts nobody should hand-roll. Asserted here so a
       refactor that drops Radix cannot do it quietly. */
    const html = render(h(Tabs, { defaultValue: 'a' },
      h(TabList, null, h(Tab, { value: 'a' }, 'A'), h(Tab, { value: 'b' }, 'B')),
      h(TabPanel, { value: 'a' }, 'panel a')));
    assert.match(html, /class="pw-tab-list"/);
    assert.match(html, /role="tablist"/);
    assert.match(html, /class="pw-tab"/);
    assert.match(html, /aria-selected="true"/);
    assert.match(html, /data-state="active"/);
    assert.match(html, /aria-controls="/);
    assert.match(html, /role="tabpanel"/);
    assert.match(html, /aria-labelledby="/);
  });

  test('the inactive trigger is out of the tab sequence', () => {
    /* Roving tabindex. Without it, Tab steps through every trigger instead of
       entering the strip once and moving with the arrow keys. */
    const html = render(h(Tabs, { defaultValue: 'a' },
      h(TabList, null, h(Tab, { value: 'a' }, 'A'), h(Tab, { value: 'b' }, 'B')),
      h(TabPanel, { value: 'a' }, 'panel a')));
    assert.match(html, /tabindex="-1"/);
  });
});

describe('window', () => {
  /* The name of the region is the whole point of these. A <section> with no
     accessible name is not an unlabelled region, it is not a region: the
     browser drops it to role="generic". check-a11y measures the computed name
     in a real browser, which is the assertion that matters; these are the
     cheap half that runs without one, and they check the wiring that name
     depends on. */
  const idOf = (html) => html.match(/aria-labelledby="([^"]+)"/)?.[1];

  test('the section is named by its own title', () => {
    const html = render(h(Window, { title: 'Playlist' }, 'body'));
    const id = idOf(html);
    assert.ok(id, 'no aria-labelledby, so the section is not a region at all');
    assert.match(html, new RegExp(`<h2 class="pw-title" id="${id}">Playlist</h2>`));
  });

  test('the id it points at is on the page', () => {
    /* aria-labelledby pointing at nothing reads as correct markup and
       resolves to no name, which is the failure this cannot be allowed to
       pass. */
    const html = render(h(Window, { title: 'Playlist' }, 'body'));
    assert.ok(html.includes(`id="${idOf(html)}"`));
  });

  test('two windows on a page do not share one id', () => {
    const html = render(h('div', null,
      h(Window, { title: 'One' }, 'a'),
      h(Window, { title: 'Two' }, 'b')));
    const ids = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(ids.length, 2);
    assert.notEqual(ids[0], ids[1], 'both sections point at the same heading');
  });

  test('a caller who names it another way is not overridden', () => {
    /* aria-labelledby sits before the spread for this. A component that
       insisted on its own name would make a window inside a labelled dialog
       announce the wrong one. */
    const html = render(h(Window, { title: 'Playlist', 'aria-labelledby': 'mine' }, 'b'));
    assert.match(html, /aria-labelledby="mine"/);
  });

  test('the heading level is the caller\'s, and 2 when they do not say', () => {
    /* Hard-coded h2 is right under a page h1 and wrong everywhere else, and a
       component that can be placed anywhere cannot know. */
    assert.match(render(h(Window, { title: 'x' }, 'b')), /<h2 class="pw-title"/);
    assert.match(render(h(Window, { title: 'x', titleLevel: 4 }, 'b')), /<h4 class="pw-title"/);
  });

  test('a control renders only when it has somewhere to go', () => {
    const bare = render(h(Window, { title: 'x' }, 'b'));
    assert.doesNotMatch(bare, /pw-title-button/);
    const full = render(h(Window, { title: 'x', onClose: () => {} }, 'b'));
    assert.match(full, /aria-label="Close"/);
    assert.doesNotMatch(full, /aria-label="Minimise"/);
  });
});
