/**
 * The form controls.
 *
 * The kit had none of these, which is the largest single gap it had: they are
 * the first thing anyone evaluating a design system looks for.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  Checkbox, Field, Input, Radio, RadioGroup, Select, SelectItem, Textarea,
} from '../dist/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const bare = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('the label is part of the control', () => {
  test('Field wraps the pair in a real label', () => {
    /* A 20px box is a 20px box however large the hit area around it is.
       Native checkboxes let you click the words and hand-rolled ones
       routinely lose that. */
    const html = render(h(Field, { label: 'Always on top' }, h(Checkbox, {})));
    assert.match(html, /^<label class="pw-field"/);
    assert.match(html, /class="pw-label">Always on top</);
  });
});

describe('text field', () => {
  test('is a plain input carrying one class, and types default to text', () => {
    /* There is no primitive under this and there is not meant to be. If this
       ever grows a wrapper element, the CSS-only half of the kit stops getting
       the same control from the same markup. */
    const html = render(h(Input, {}));
    assert.equal(html, '<input type="text" class="pw-input"/>');
  });

  test('the type prop still reaches the element', () => {
    assert.match(render(h(Input, { type: 'password' })), /type="password"/);
  });

  test('a textarea is its own component, not a prop on the input', () => {
    /* Collapsing them would mean a props type that sometimes accepts rows and
       sometimes accepts type, with the union unrepresentable. */
    assert.match(render(h(Textarea, { rows: 3 })), /^<textarea rows="3" class="pw-textarea"/);
  });

  test('both are wells, and the same well the combo box field is', () => {
    /* A raised text field beside a sunken select is two vocabularies in one
       row, and they appear in one row in every form anybody builds. */
    const css = bare(read('css/components/field.css'));
    const block = css.match(/\.pw-input,\s*\.pw-textarea \{([^}]*)\}/);
    assert.ok(block, 'no shared .pw-input/.pw-textarea rule');
    assert.match(block[1], /--pw-elev:\s*var\(--pw-shadow-sunken\)/);
  });

  test('neither takes the corner clip, because both draw a focus ring', () => {
    /* clip-path clips an outline and this kit's focus ring is an outline.
       bevel.css opts the ringed controls out in an earlier layer, so a
       clip-path here would win it straight back. Three components were doing
       exactly that, silently, under the only skin that sets the hook. */
    const css = bare(read('css/components/field.css'));
    const block = css.match(/\.pw-input,\s*\.pw-textarea \{([^}]*)\}/)[1];
    assert.doesNotMatch(block, /clip-path/);
    const ringed = bare(read('css/reset.css'))
      .match(/:where\(([^)]*)\):focus-visible/)[1];
    for (const cls of ['.pw-input', '.pw-textarea']) {
      assert.ok(ringed.includes(cls), `${cls} takes no focus ring at all`);
    }
  });

  test('the placeholder is the body ink, quieted by shape rather than by value', () => {
    /* Measured, not chosen: --pw-color-disabled-content against a field's own
       ground clears 4.5 in three of the six palettes here and misses in the
       other three, and a placeholder is text in an enabled control so 1.4.3
       reaches it. The select was using opacity, which the contrast gate reads
       straight through, so its real ratio was never measured at all.

       Asserted rather than commented, because "it uses the body ink" is
       exactly the kind of claim that stops being true quietly. Same shape as
       the assertion meta.css carries. */
    const css = bare(read('css/components/field.css'));
    const block = css.match(/::placeholder[^{]*\{([^}]*)\}/);
    assert.ok(block, 'no ::placeholder rule');
    assert.match(block[1], /color:\s*var\(--pw-color-base-content\)/);
    assert.match(block[1], /font-style:\s*italic/);
    assert.doesNotMatch(css, /opacity:\s*0\.7/,
      'a placeholder dimmed with opacity is one the contrast gate cannot measure');
  });

  test('invalid is carried by weight, not only by colour', () => {
    /* The cyber skin resolves error, success and warning to one cyan pair on
       purpose. Under that skin a tinted invalid field says nothing at all, so
       the ring has to be thicker than the resting edge. --pw-border would make
       it exactly the resting edge. */
    const css = bare(read('css/components/field.css'));
    const block = css.match(/\[aria-invalid="true"\][^{]*\{([^}]*)\}/);
    assert.ok(block, 'nothing styles an invalid field');
    assert.match(block[1], /var\(--pw-invalid-ring\)/);
    assert.doesNotMatch(block[1], /var\(--pw-border\)/);
    /* First in the list, because box-shadow paints the first entry on top. */
    assert.match(block[1], /--pw-elev:\s*\n?\s*inset[^;]*--pw-color-error-content[^;]*,\s*\n?\s*var\(--pw-shadow-sunken\)/);
  });
});

describe('checkbox', () => {
  test('has checkbox semantics and a state the CSS can read', () => {
    const html = render(h(Checkbox, { checked: true }));
    assert.match(html, /role="checkbox"/);
    assert.match(html, /aria-checked="true"/);
    assert.match(html, /data-state="checked"/);
  });

  test('indeterminate gets its own mark, not a dimmer tick', () => {
    /* A third state drawn as a faded second state is a state nobody can
       name. Both marks render and CSS shows one. */
    const html = render(h(Checkbox, { checked: 'indeterminate' }));
    assert.match(html, /data-state="indeterminate"/);
    assert.match(html, /data-mark="check"/);
    assert.match(html, /data-mark="minus"/);
  });

  test('which mark shows is decided by CSS, not by the checked prop', () => {
    /* Choosing in JS from `checked` only works for a controlled checkbox. An
       uncontrolled one started at defaultChecked="indeterminate" would have
       shown a tick, which is a wrong answer rather than a missing one. */
    const src = read('src/field.tsx');
    assert.doesNotMatch(src, /checked === 'indeterminate'/);
    const css = bare(read('css/components/field.css'));
    assert.match(css, /\[data-state="indeterminate"\] \[data-mark="check"\]/);
  });

  test('the mark is not the minimize glyph', () => {
    /* minimize sits low in its cell because it means a window dropping to
       the taskbar. A low dash in a checkbox reads as a mistake. */
    const src = read('src/field.tsx');
    assert.match(src, /name="minus"/);
    assert.doesNotMatch(src, /name="minimize"/);
  });
});

describe('radio', () => {
  test('is round, and it is the only round thing in the kit', () => {
    /* The shape IS the meaning: it is the only thing distinguishing choose
       one from choose any before you have read a word or clicked twice. The
       house rule is square at 2px everywhere else, and this is the one place
       a convention doing semantic work outranks it. */
    const css = bare(read('css/components/field.css'));
    assert.match(css, /\.pw-radio \{ border-radius: 50%; \}/);
    assert.match(css, /\.pw-checkbox \{ border-radius: var\(--pw-radius-control\); \}/);
    const others = ['button', 'toggle', 'tabs', 'badge', 'list']
      .map((n) => bare(read(`css/components/${n}.css`))).join('');
    assert.doesNotMatch(others, /border-radius:\s*50%/,
      'something else in the kit went round');
  });

  test('its bullet is round too', () => {
    /* A square bullet inside a round box argues with the box around it. */
    const src = read('src/field.tsx');
    assert.match(src, /RadixRadioGroup\.Indicator[\s\S]{0,120}name="dot"/);
  });

  test('is a radiogroup of radios', () => {
    const html = render(h(RadioGroup, { value: 'a' },
      h(Radio, { value: 'a' }), h(Radio, { value: 'b' })));
    assert.match(html, /role="radiogroup"/);
    assert.equal(html.match(/role="radio"/g).length, 2);
    assert.match(html, /aria-checked="true"/);
  });
});

describe('select', () => {
  test('is a named combobox', () => {
    const html = render(h(Select, { label: 'Output device' },
      h(SelectItem, { value: 'a' }, 'A')));
    assert.match(html, /role="combobox"/);
    assert.match(html, /aria-label="Output device"/);
    assert.match(html, /aria-expanded="false"/);
  });

  test('the value has its own element to truncate in', () => {
    /* Select.Value does not forward className, so styling it directly
       rendered a span with no class and the value column never got its
       ellipsis. */
    const html = render(h(Select, { label: 'S' }, h(SelectItem, { value: 'a' }, 'A')));
    assert.match(html, /class="pw-select-value"/);
  });

  test('the drop arrow is a filled caret, not the chevron', () => {
    /* Windows drew dropdown arrows as solid triangles from Marlett onward. A
       stroked chevron in a combo box is the one detail that would date this
       kit forward by fifteen years. Both marks exist: the chevron discloses,
       the caret opens a list. */
    const src = read('src/field.tsx');
    assert.match(src, /name="caret-down"/);
    assert.doesNotMatch(src, /name="chevron-down"/);
  });

  test('the field is sunken and its button is raised', () => {
    /* The two treatments together are what make it read as a control you can
       open rather than a label with a decoration drawn on it. */
    const css = bare(read('css/components/field.css'));
    assert.match(css, /\.pw-select \{[^}]*--pw-elev: var\(--pw-shadow-sunken\)/);
    assert.match(css, /\.pw-select-button \{[^}]*--pw-elev: var\(--pw-shadow-raised\)/);
  });
});
