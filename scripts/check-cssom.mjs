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
import { report, withDemo } from './browser.mjs';

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
await withDemo(async (p, base) => {
  for (const page of ['demo/states.html', 'demo/index.html']) {
    await p.goto(`${base}/${page}`);
    await p.settle(page.includes('index') ? 1700 : 900);
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
  }
});
report('cssom', failures, `${seen} rendered classes across 2 pages`);
