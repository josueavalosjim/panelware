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
 *
 * An absent shape is a failure, not a match. The first version of this
 * compared JSON.stringify of each value, and an element missing from a page
 * measured as null, so a shape deleted from BOTH pages compared "null"
 * against "null" and the check agreed with itself that nothing was wrong.
 * Deleting the badge, or the list, from both demo pages left it green. The
 * shape list below is the claim this file makes about what it compares, so
 * absence has to break it.
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
  const thumb = slider && slider.querySelector('.pw-slider-thumb');
  /* elementFromPoint is viewport-relative and returns null off-screen, so the
     thumb has to be on screen before any of this means anything */
  if (thumb) thumb.scrollIntoView({ block: 'center' });
  const hit = (dx, dy) => {
    const r = thumb.getBoundingClientRect();
    const e = document.elementFromPoint(r.x + r.width / 2 + dx, r.y + r.height / 2 + dy);
    return e === thumb || thumb.contains(e);
  };
  return {
    /* A page that never rendered has no shapes to disagree about, and would
       otherwise report every one of them as missing from one side rather than
       as the one thing that actually went wrong. */
    controls: document.querySelectorAll('.pw-button, .pw-toggle').length,
    shapes: {
      thumb: slider && box('.pw-slider-thumb', slider),
      track: slider && box('.pw-slider-track', slider),
      /* Cross-axis only. The range's LENGTH is the value, and the pages
         deliberately show different ones: states.html parks Volume at zero so
         that state is rendered. Its thickness is structure. */
      rangeThickness: (() => {
        const e = slider && slider.querySelector('.pw-slider-range');
        return e ? Math.round(e.getBoundingClientRect().height) : null;
      })(),
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
      /* Scoped to the section. The live page's switcher is built from the
         kit's own ToggleGroup and Select, so a bare '.pw-select' matched the
         Skin picker there and the form's combo box here, and reported a real
         disagreement between two controls that were never the same control. */
      checkbox: box('#field .pw-checkbox'),
      radio: box('#field .pw-radio'),
      select: box('#field .pw-select'),
    },
    /* Not sizes: what the pointer actually lands on. Null rather than absent
       when there is no thumb, because 'thumb' above already reports that and
       one missing slider should read as one failure. */
    probes: thumb ? { hitAt15: hit(15, 0), hitAt20: hit(0, 20), missesAt30: !hit(30, 0) } : null,
  };
})()`;

/** How few controls means the page never rendered rather than measured clean. */
export const FLOOR = 4;

/**
 * Every way the two readings can disagree, as lines.
 *
 * Pure, and exported, because this is where the hole was: the comparison is
 * the part of this file with a bug in it and an inline script cannot have a
 * test on it. test/contract.test.mjs drives it.
 */
export function disagreements(stat, live) {
  const failures = [];
  const pages = [['states.html', stat], ['index.html', live]];

  /* A page that never rendered agrees with nothing, and saying so once beats
     naming all seventeen shapes it is missing. */
  for (const [name, got] of pages) {
    if (got.controls < FLOOR) {
      failures.push(`${name} rendered ${got.controls} controls, so nothing was measured` +
        (name === 'index.html' ? ' (it boots React from esm.sh and needs a network)' : ''));
    }
  }
  if (failures.length) return failures;

  /* Absence first, and separately, so it can never be mistaken for a match.
     Both pages missing the same shape is the case that used to pass. */
  for (const key of Object.keys(stat.shapes)) {
    const absent = pages.filter(([, got]) => got.shapes[key] == null).map(([name]) => name);
    if (absent.length === pages.length) failures.push(`${key} is on neither page, so nothing compared it`);
    else if (absent.length) failures.push(`${key} is missing from ${absent[0]}`);
  }
  if (failures.length) return failures;

  const compare = (label, a, b) => {
    const x = JSON.stringify(a);
    const y = JSON.stringify(b);
    if (x !== y) failures.push(`${label}: states.html ${x}, index.html ${y}`);
  };
  for (const key of Object.keys(stat.shapes)) compare(key, stat.shapes[key], live.shapes[key]);
  for (const key of Object.keys(stat.probes)) compare(key, stat.probes[key], live.probes[key]);
  return failures;
}

/** What a green run is claiming to have looked at. */
export const scannedLine = (stat) =>
  `${Object.keys(stat.shapes).length + Object.keys(stat.probes ?? {}).length} shared shapes across 2 pages`;

/* Guarded, so importing this for the comparison test does not drive a
   browser. Same reason check-exports.mjs is shaped this way. */
if (import.meta.url === `file://${process.argv[1]}`) {
  let failures = [];
  let scanned = 'nothing, the pages never loaded';
  await withDemo(async (p, base) => {
    const read = async (page, settle) => {
      await p.goto(`${base}/${page}`);
      await p.settle(settle);
      return p.evaluate(GEOM);
    };
    const stat = await read('demo/states.html', 900);
    const live = await read('demo/index.html', 1800);

    scanned = scannedLine(stat);
    failures = disagreements(stat, live);
    console.log(`  static ${JSON.stringify(stat)}`);
    console.log(`  live   ${JSON.stringify(live)}`);
  }, { width: 1000, height: 900 });

  report('parity', failures, scanned);
}
