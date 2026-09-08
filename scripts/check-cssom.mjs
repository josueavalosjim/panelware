/**
 * Every class the kit renders has to match a rule the browser actually kept.
 *
 * Brace balance catches the way this broke in 0.1.0, where one extra } closed
 * a layer early and orphaned every rule after it. It cannot catch the other
 * ways a browser drops a rule: an at-rule it does not understand, a selector
 * token it rejects, a declaration block it abandons. Those leave the text in
 * the file, so a check that reads the file sees nothing wrong.
 *
 * So this asks the browser what survived. It is deliberately about coverage
 * rather than about values: a class rendered by a component with no rule
 * anywhere behind it is either a dead class or a stylesheet that did not
 * parse, and both are worth a red build.
 */
import { ICON_COLS, ICON_ORDER } from '../assets/icon-font.mjs';

import { rendered, report, withDemo } from './browser.mjs';

/* The cell each icon name should resolve to, straight from the font data
   rather than from the generated CSS, so this cannot agree with itself. */
const CELLS = Object.fromEntries(ICON_ORDER.map((name, i) => [
  name, { x: i % ICON_COLS, y: Math.floor(i / ICON_COLS) },
]));

const CHECK = `(() => {
  const selectors = [];
  /* Two things, not one branch. CSSStyleRule has a cssRules property of its
     own now that CSS nesting exists, and an empty CSSRuleList is truthy, so
     "if it has cssRules it is a group" skipped past every leaf rule in the
     sheet and this reported zero. Length, not existence. */
  const walk = (rules) => {
    for (const r of rules) {
      if (r.selectorText) selectors.push(r.selectorText);
      if (r.cssRules && r.cssRules.length) walk(r.cssRules);
    }
  };
  for (const sheet of document.styleSheets) {
    try { walk(sheet.cssRules); } catch { return { unreadable: sheet.href }; }
  }
  const styled = new Set();
  for (const list of selectors) {
    for (const m of list.matchAll(/\\.(pw-[a-zA-Z0-9_-]+)/g)) styled.add(m[1]);
  }
  const rendered = new Set();
  for (const el of document.querySelectorAll('[class]')) {
    if (typeof el.className !== 'string') continue;
    for (const c of el.className.trim().split(/\\s+/)) if (c.startsWith('pw-')) rendered.add(c);
  }
  return {
    rules: selectors.length,
    rendered: [...rendered].sort(),
    unstyled: [...rendered].filter((c) => !styled.has(c)).sort(),
  };
})()`;

/* A stylesheet this size cannot legitimately fall under this. When it broke,
   eleven rules reached the CSSOM. */
const FLOOR = 150;

const failures = [];
let seen = 0;
let named = 0;
await withDemo(async (p, base) => {
  for (const page of ['demo/states.html', 'demo/index.html']) {
    await p.goto(`${base}/${page}`);
    /* Not branched on: the "rendered no pw- classes at all" failure below is
       the same finding with a better message, and it is the one this file
       already words for the reader. */
    await p.ready(rendered());
    const r = await p.evaluate(CHECK);
    if (r.unreadable) { failures.push(`${page}: ${r.unreadable} could not be read`); continue; }
    if (!r.rendered.length) {
      failures.push(`${page} rendered no pw- classes at all, so nothing was checked`);
      continue;
    }
    seen += r.rendered.length;
    if (r.rules < FLOOR) {
      failures.push(`${page}: the browser kept only ${r.rules} rules, under the floor of ${FLOOR}`);
    }
    for (const c of r.unstyled) failures.push(`${page}: .${c} is rendered but no rule anywhere matches it`);

    /* data-icon names a sprite cell, and the failure when a rule stops
       matching is the worst kind this file exists for: the element still
       renders, --pw-icon-x falls back to the 0 that .pw-icon declares, and
       the page shows the wrong glyph rather than an error. A whole row of
       icons quietly becoming `play` looks like a design decision.

       The expected cells come from assets/icon-font.mjs, which is what the
       generator reads, rather than from the generated CSS this is checking. */
    for (const [name, want] of Object.entries(CELLS)) {
      const got = await p.evaluate(`(() => {
        const e = document.querySelector(${JSON.stringify(`.pw-icon[data-icon="${name}"]`)});
        if (!e) return null;
        const s = getComputedStyle(e);
        return { x: s.getPropertyValue('--pw-icon-x').trim(),
                 y: s.getPropertyValue('--pw-icon-y').trim() };
      })()`);
      if (!got) continue;
      named += 1;
      if (got.x !== String(want.x) || got.y !== String(want.y)) {
        failures.push(`${page}: data-icon="${name}" resolves to cell ${got.x},${got.y} ` +
          `and the sheet puts it at ${want.x},${want.y}`);
      }
    }
  }
});

/* A probe that matched nothing reports a clean run. Both scales of the demo's
   icon gallery are on states.html, so every name should be found twice. */
if (named < ICON_ORDER.length) {
  failures.push(`only ${named} of ${ICON_ORDER.length} icon names were found on either page, ` +
    'so the data-icon rules were mostly unmeasured');
}

report('cssom', failures, `${seen} rendered classes and ${named} named icon cells across 2 pages`);
