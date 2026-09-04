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

const failures = [];
let checked = 0;
await withDemo(async (p, base) => {
  for (const page of ['demo/states.html', 'demo/index.html']) {
    for (const theme of ['light', 'dark']) {
      await p.goto(`${base}/${page}`);
      await p.settle(page.includes('index') ? 1800 : 900);
      await p.evaluate(`document.documentElement.dataset.theme = ${JSON.stringify(theme)}`);
      await p.settle(300);

      const alive = await p.evaluate(`document.querySelectorAll('.pw-button, .pw-toggle').length`);
      if (alive < 4) {
        failures.push(`${page} (${theme}) rendered ${alive} controls, so axe scanned nothing`);
        continue;
      }
      await p.evaluate(AXE);
      const violations = await p.evaluate(RUN);
      checked += 1;
      for (const v of violations) {
        failures.push(`${v.impact}: ${v.id} — ${v.help}  [${page}, ${theme}]`);
        for (const n of v.nodes) failures.push(`      ${n.target}${n.summary ? `\n        ${n.summary}` : ''}`);
      }
    }
  }
});

report('a11y', failures, `${checked} page/theme combinations scanned by axe ${
  JSON.parse(readFileSync(new URL('../node_modules/axe-core/package.json', import.meta.url), 'utf8')).version}`);
