/**
 * Nothing may scroll sideways, at any width the kit claims to support.
 *
 * 320 is the floor, not 375: it is the narrowest viewport the house
 * responsive standard names, and it is where a fixed-width row inside a
 * scroller stops fitting. The equaliser shipped broken here once, at 320 and
 * 375 both, and it was found by looking rather than by a check, which is the
 * reason this file exists.
 *
 * The assertion is documentElement.scrollWidth against clientWidth, plus the
 * element responsible when they disagree, because "the page is 14px too wide"
 * without a culprit is a bug report to yourself.
 */
import { report, withDemo } from './browser.mjs';

const WIDTHS = [320, 375, 768, 1100];

const MEASURE = `(() => {
  const d = document.documentElement;
  if (d.scrollWidth <= d.clientWidth) return null;
  /* the widest thing sticking out past the viewport, named */
  let worst = null;
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.right <= d.clientWidth + 0.5) continue;
    /* Skip anything an ancestor already contains. A scroller doing its job
       is not the page overflowing, and neither is a clip: the marquee's inner
       render is deliberately wider than its window and sits under
       overflow: hidden, and naming it as the offender sent the first run of
       this check after the wrong element entirely. */
    let contained = false;
    for (let p = el.parentElement; p; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') { contained = true; break; }
    }
    if (contained) continue;
    const over = Math.round(r.right - d.clientWidth);
    if (!worst || over > worst.over) {
      worst = { over, id: el.tagName.toLowerCase() +
        (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/).join('.') : '') };
    }
  }
  return { scrollWidth: d.scrollWidth, clientWidth: d.clientWidth, worst };
})()`;

/* A page that never rendered cannot overflow, so it passes. demo/index.html
   boots React from esm.sh, and with no network it loads, throws in a module
   nobody is listening to, and leaves an empty <main> behind. Every width then
   reports clean and the check is measuring an empty document. Counting the
   controls first is what makes the difference between green and green for the
   wrong reason. */
const ALIVE = `document.querySelectorAll('.pw-button, .pw-toggle, .pw-tab').length`;
const FLOOR = 6;

const failures = [];
for (const page of ['demo/states.html', 'demo/index.html']) {
  await withDemo(async (p, base) => {
    for (const width of WIDTHS) {
      await p.resize(width, 900);
      await p.goto(`${base}/${page}`);
      await p.settle(700);
      const alive = await p.evaluate(ALIVE);
      if (alive < FLOOR) {
        failures.push(`${page} at ${width}px rendered ${alive} controls, so nothing was measured` +
          (page.includes('index') ? ' (it boots React from esm.sh and needs a network)' : ''));
        continue;
      }
      const bad = await p.evaluate(MEASURE);
      if (!bad) continue;
      failures.push(`${page} at ${width}px: scrollWidth ${bad.scrollWidth} vs ${bad.clientWidth}` +
        (bad.worst ? `, widest offender ${bad.worst.id} by ${bad.worst.over}px` : ''));
    }
  });
}
report('overflow', failures, `2 pages x ${WIDTHS.length} widths`);
