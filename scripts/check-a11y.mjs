/**
 * axe over every component, in every state, in both themes.
 *
 * This kit measures contrast exhaustively and, until this file, measured
 * accessibility not at all. The ARIA coverage was seventeen hand-written
 * string assertions against rendered HTML, which check that a component emits
 * an attribute and cannot check whether the result is usable.
 *
 * Radix supplies the behaviour, and that is the argument for building on it,
 * but it is not a guarantee that the behaviour survives a skin. A name
 * computed from an icon with no text, an aria-hidden wrapped around something
 * focusable, a label whose association the markup breaks: none of those are
 * contrast bugs, and none of the other checks here would see one.
 *
 * demo/states.html is the target that matters, because it renders every
 * component in every state an attribute can reach with no JavaScript at all.
 * demo/index.html is run too, since some states only exist live.
 *
 * Colour rules are OFF. taste-check already measures contrast against the
 * ground each token actually lands on, across three themes and 3280 painted
 * pairs, which is a stricter question than axe asks. Two tools disagreeing
 * about the same pixel is a maintenance argument, not a second opinion.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { ROOT, report, withDemo } from './browser.mjs';

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core'), 'utf8');

const RUN = `axe.run(document, {
  resultTypes: ['violations'],
  rules: {
    'color-contrast': { enabled: false },
    'color-contrast-enhanced': { enabled: false },
    /* The demo pages are documentation, not an application shell. A region
       rule firing on a docs page says nothing about the components. */
    region: { enabled: false },
  },
}).then((r) => r.violations.map((v) => ({
  id: v.id,
  impact: v.impact,
  help: v.help,
  nodes: v.nodes.slice(0, 4).map((n) => ({
    target: n.target.join(' '),
    summary: (n.failureSummary || '').split('\\n').filter(Boolean).slice(1, 3).join(' / '),
  })),
})))`;

/* Every look the kit ships, as a skin and an optional preset. Not a cross
   product: a preset is nested inside its skin, so pairing one with another
   skin is not a combination that exists. */
const PAGES = ['demo/states.html', 'demo/index.html'];

const LOOKS = [
  { skin: 'chrome' },
  { skin: 'chrome', preset: 'deck' },
  { skin: 'cyber' },
];

const failures = [];
let checked = 0;
await withDemo(async (p, base) => {
  for (const page of PAGES) {
    for (const look of LOOKS) {
      const skin = look.preset ? `${look.skin}+${look.preset}` : look.skin;
      for (const theme of ['light', 'dark']) {
      await p.goto(`${base}/${page}`);
      await p.settle(page.includes('index') ? 1800 : 900);
      await p.evaluate(`document.documentElement.dataset.theme = ${JSON.stringify(theme)}`);
      await p.evaluate(`document.documentElement.dataset.skin = ${JSON.stringify(look.skin)}`);
      if (look.preset) await p.evaluate(`document.documentElement.dataset.preset = ${JSON.stringify(look.preset)}`);
      else await p.evaluate('delete document.documentElement.dataset.preset');
      await p.settle(300);

      const alive = await p.evaluate(`document.querySelectorAll('.pw-button, .pw-toggle').length`);
      if (alive < 4) {
        failures.push(`${page} (${skin}-${theme}) rendered ${alive} controls, so axe scanned nothing`);
        continue;
      }
      await p.evaluate(AXE);
      const violations = await p.evaluate(RUN);
      checked += 1;
      for (const v of violations) {
        failures.push(`${v.impact}: ${v.id} — ${v.help}  [${page}, ${skin}-${theme}]`);
        for (const n of v.nodes) failures.push(`      ${n.target}${n.summary ? `\n        ${n.summary}` : ''}`);
      }
      }
    }
  }
});

/**
 * The names axe cannot ask about.
 *
 * A <section> with no accessible name is not a landmark that axe can find
 * fault with. It is not a landmark at all: the browser drops it to
 * role="generic" and there is nothing left to report. So the rule that would
 * catch this does not exist, and the only way to see it is to ask the browser
 * what it computed. <Window> shipped that way while its own prop doc promised
 * "an unlabelled region", and it was not even that.
 *
 * Reading the attributes back would not do. An accessible name is the end of
 * a resolution that can fail at every step, and aria-labelledby pointing at
 * an id that is not on the page looks perfectly correct in the markup.
 *
 * Names do not vary by theme or skin, so this runs once per page rather than
 * twelve times.
 */
const NAMED = [
  { selector: '.pw-window', role: 'region', why: 'a window is a region or it is nothing' },
  { selector: '.pw-eq', role: 'group', why: 'ten bands that belong to each other' },
  { selector: '.pw-list', role: 'listbox', why: 'a listbox with no name is an unnamed choice' },
];

let named = 0;
await withDemo(async (p, base) => {
  for (const page of PAGES) {
    await p.goto(`${base}/${page}`);
    await p.settle(page.includes('index') ? 1800 : 900);
    for (const { selector, role, why } of NAMED) {
      const found = await p.ax(selector);
      if (!found.length) {
        failures.push(`${page}: no ${selector} on the page, so its name was never checked`);
        continue;
      }
      for (const got of found) {
        named += 1;
        if (got.role !== role) {
          failures.push(`${page} ${selector}: the browser computed role="${got.role}", not "${role}" ` +
            `(${why})`);
        } else if (!got.name.trim()) {
          failures.push(`${page} ${selector}: role="${got.role}" with no accessible name, ` +
            `so a screen reader announces nothing for it (${why})`);
        }
      }
    }
  }
});

report('a11y', failures, `${checked} page/look/theme combinations scanned by axe ${
  JSON.parse(readFileSync(new URL('../node_modules/axe-core/package.json', import.meta.url), 'utf8')).version
}, and ${named} accessible names the browser computed`);
