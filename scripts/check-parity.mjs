/**
 * The static page and the live page must render the same shapes.
 *
 * demo/states.html exists so the CSS can be proved to work without React, and
 * it is what the runtime palette gate measures. That only means something
 * while the two pages agree: a static page that positioned things more simply
 * than the real component would be verifying a shape that never ships, and
 * the gate would be reading a palette off geometry nobody gets.
 *
 * Both drifted at once, before this was a check. A scoping change took the
 * tracks off the static sliders, and the static badges kept a text glyph the
 * component had already stopped emitting. Neither showed up in a test,
 * because each page was correct on its own terms.
 *
 * Sizes and hit targets, not positions: the two pages lay their sections out
 * differently on purpose, and the value a control is parked at is content
 * rather than structure.
 */
import { report, withDemo } from './browser.mjs';

const GEOM = `(() => {
  const box = (sel, root = document) => {
    const e = root.querySelector(sel);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return Math.round(r.width) + 'x' + Math.round(r.height);
  };
  const slider = document.querySelector('#slider .pw-slider') ?? document.querySelector('.pw-slider');
  if (!slider) return { __dead: 'no slider on the page' };
  const thumb = slider.querySelector('.pw-slider-thumb');
  const tb = thumb.getBoundingClientRect();
  const cx = tb.x + tb.width / 2;
  const cy = tb.y + tb.height / 2;
  /* elementFromPoint is viewport-relative and returns null off-screen, so the
     thumb has to be on screen before any of this means anything */
  thumb.scrollIntoView({ block: 'center' });
  const hit = (dx, dy) => {
    const r = thumb.getBoundingClientRect();
    const e = document.elementFromPoint(r.x + r.width / 2 + dx, r.y + r.height / 2 + dy);
    return e === thumb || thumb.contains(e);
  };
  return {
    thumb: box('.pw-slider-thumb', slider),
    track: box('.pw-slider-track', slider),
    /* Cross-axis only. The range's LENGTH is the value, and the pages
       deliberately show different ones: states.html parks Volume at zero so
       that state is rendered. Its thickness is structure. */
    rangeThickness: (() => {
      const e = slider.querySelector('.pw-slider-range');
      return e ? Math.round(e.getBoundingClientRect().height) : null;
    })(),
    hitAt15: hit(15, 0), hitAt20: hit(0, 20), missesAt30: !hit(30, 0),
    button: box('.pw-button'),
    badge: box('.pw-badge'),
    badgeMark: box('.pw-badge .pw-icon'),
    pause: box('.pw-lcd-pause'),
    titleButton: box('.pw-title-button'),
    transportButton: box('.pw-transport-button'),
    eqFader: box('.pw-eq .pw-slider-thumb'),
    listRow: box('.pw-list-item'),
    listMarker: box('.pw-list-marker .pw-icon'),
    spinner: box('.pw-spinner .pw-icon'),
    /* Scoped to the section. The live page's switcher is built from the kit's
       own ToggleGroup and Select, so a bare '.pw-select' matched the Skin
       picker there and the form's combo box here, and reported a real
       disagreement between two controls that were never the same control. */
    checkbox: box('#field .pw-checkbox'),
    radio: box('#field .pw-radio'),
    select: box('#field .pw-select'),
  };
})()`;

const failures = [];
await withDemo(async (p, base) => {
  const read = async (page, settle) => {
    await p.goto(`${base}/${page}`);
    await p.settle(settle);
    return p.evaluate(GEOM);
  };
  const stat = await read('demo/states.html', 900);
  const live = await read('demo/index.html', 1800);

  /* A page that never rendered agrees with nothing and would report every key
     as a disagreement, or, if both were dead, as none at all. */
  for (const [name, got] of [['states.html', stat], ['index.html', live]]) {
    if (got.__dead) failures.push(`${name} did not render: ${got.__dead}`);
  }
  if (failures.length) return;

  for (const key of Object.keys(stat)) {
    const a = JSON.stringify(stat[key]);
    const b = JSON.stringify(live[key]);
    if (a !== b) failures.push(`${key}: states.html ${a}, index.html ${b}`);
  }
  console.log(`  static ${JSON.stringify(stat)}`);
  console.log(`  live   ${JSON.stringify(live)}`);
}, { width: 1000, height: 900 });

report('parity', failures, `${Object.keys(JSON.parse('{}')).length || 'all'} shared shapes across 2 pages`);
