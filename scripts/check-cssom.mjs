/**
 * Every class the kit renders has to match a rule the browser kept.
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

/* Which skins ship a sheet of their own, and the file each one ships. */
const SKIN_SHEETS = [
  ['cyber', ['icons.cyber.px.svg', 'icons.cyber.svg']],
  ['paper', ['icons.paper.px.svg', 'icons.paper.svg']],
];

/* Every skin, because the zero rule's correction is derived from tokens that
   move per skin. */
const EQ_SKINS = ['chrome', 'cyber', 'paper'];

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
/**
 * THE BADGE'S OPTICAL GAP, MEASURED RATHER THAN GREPPED.
 *
 * Every badge subtracts its mark's own blank margins so the gap from edge to
 * ink reads the same whatever the mark is: the check carries 2 empty columns
 * either side and the exclamation carries 7, so without the correction they
 * measure identically and read nothing alike.
 *
 * This is a browser check and not a lint, and that distinction cost a release.
 * The correction moved behind --pw-icon-bearing, the default was declared on
 * .pw-icon itself, and a custom property declared on an element beats the same
 * property inherited from an ancestor: the badge switched it on and the icon
 * switched it straight back off. A test that read the CSS text passed the
 * whole time, because both declarations were exactly where it expected them.
 * Only the computed margin knew.
 */
const BEARINGS = `(() => {
  const rows = [];
  for (const badge of document.querySelectorAll('.pw-badge')) {
    const icon = badge.querySelector('.pw-icon');
    if (!icon) continue;
    const cs = getComputedStyle(icon);
    const b = badge.getBoundingClientRect();
    const i = icon.getBoundingClientRect();
    const ink = parseFloat(cs.getPropertyValue('--pw-icon-ink-l')) || 0;
    const scale = parseFloat(cs.getPropertyValue('--pw-icon-scale')) || 1;
    rows.push({
      icon: icon.dataset.icon || '?',
      scale,
      /* Edge of the badge to the first lit pixel of the mark. */
      inset: Math.round((i.left + ink * scale - b.left) * 10) / 10,
      margin: Math.round(parseFloat(cs.marginLeft) * 10) / 10,
      bearing: parseFloat(cs.getPropertyValue('--pw-icon-bearing')) || 0,
    });
  }
  return rows;
})()`;

const FLOOR = 150;

const failures = [];
let seen = 0;
let named = 0;
let sheets = 0;
let zeros = 0;
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

    /* A skin may point --pw-icon-sheet at its own drawings, and the way that
       fails is silent in a way nothing else here is. The token spent three
       releases declared inside icon.css, which is pw.components, while every
       skin declares its knobs in pw.tokens. pw.components sorts later, so the
       component file won every time: a skin could set the token, the rule
       parsed, the cascade discarded it, and the skin kept the first sheet.
       The documentation said it was a skin's to set the whole time.

       So this asks the browser what the mask resolved to under each
       skin, rather than whether a declaration exists. */
    for (const [skin, files] of SKIN_SHEETS) {
      const got = await p.evaluate(`(() => {
        const root = document.documentElement;
        const before = root.getAttribute('data-skin');
        root.setAttribute('data-skin', ${JSON.stringify(skin)});
        const e = document.querySelector('.pw-icon');
        const urls = e ? [...getComputedStyle(e).maskImage.matchAll(/url\\("?([^")]+)"?\\)/g)].map((m) => m[1]) : [];
        if (before === null) root.removeAttribute('data-skin');
        else root.setAttribute('data-skin', before);
        return urls.length ? urls : null;
      })()`);
      if (got === null) continue;
      sheets += 1;
      /* Both files, in either order: a skin with a vector sheet resolves to
         an image-set of its pixel and vector files. */
      const names = got.map((u) => u.split('/').pop());
      for (const file of files) {
        if (!names.includes(file)) {
          failures.push(`${page}: under data-skin="${skin}" the mask resolves to ${names.join(', ')} ` +
            `and that skin ships ${file}, so its sheet is being discarded by the cascade`);
        }
      }
    }

    /* The equaliser's zero rule, against the band that is on zero.
       They are drawn by different things against different boxes: Radix
       positions the thumb along the track and .pw-eq-fill lives inside it,
       while the rule is a pseudo-element on the well, which is taller than
       the track by a label row. The rule used to take its fraction of the
       well and drew eight pixels below where the faders put zero, on the one
       component whose whole reason for existing is that you can see which
       bands are cut and which are boosted without reading a number.

       Nothing here could have caught that except measuring it. The markup was
       right, every rule matched, the contrast gate was happy, and the fill and
       the thumb agreed with each other and disagreed with the line drawn
       between them.

       Per skin, because the correction is the band's gap plus the label's own
       height and both move per skin: cyber sets a smaller --pw-text-micro and
       lands half a pixel off chrome, correctly, its thumbs following. */
    for (const skin of EQ_SKINS) {
      const got = await p.evaluate(`(() => {
        const root = document.documentElement;
        const before = root.getAttribute('data-skin');
        root.setAttribute('data-skin', ${JSON.stringify(skin)});
        const well = document.querySelector('.pw-eq-well[data-zero]');
        let out = null;
        if (well) {
          const wr = well.getBoundingClientRect();
          const rule = parseFloat(getComputedStyle(well, '::before').top);
          const thumbs = [...well.querySelectorAll('.pw-slider-thumb')];
          const zero = thumbs.find((t) => t.getAttribute('aria-valuenow') === '0');
          if (zero && Number.isFinite(rule)) {
            const r = zero.getBoundingClientRect();
            out = { rule, thumb: (r.top + r.height / 2) - wr.top };
          }
        }
        if (before === null) root.removeAttribute('data-skin');
        else root.setAttribute('data-skin', before);
        return out;
      })()`);
      if (!got) continue;
      zeros += 1;
      /* One pixel, because the rule is --pw-border tall and positioned from
         its top edge while the thumb is measured at its centre. Eight was the
         bug, and half a pixel is the rule being as centred as an odd number
         of device pixels allows. */
      if (Math.abs(got.rule - got.thumb) > 1) {
        failures.push(`${page}: under data-skin="${skin}" the equaliser's zero rule sits at `
          + `${got.rule}px and the band on zero sits at ${got.thumb}px, so the line every band `
          + 'is read against is not level with them');
      }
    }
  }
});

/* The same precondition the cell probe has, for the same reason. */
if (zeros < EQ_SKINS.length) {
  failures.push(`only ${zeros} of ${EQ_SKINS.length} equaliser zero rules were measured, `
    + 'so the alignment was unchecked');
}

if (sheets < SKIN_SHEETS.length) {
  failures.push(`only ${sheets} of ${SKIN_SHEETS.length} skin sheets were resolved on either page, `
    + 'so the sheet swap was unmeasured');
}

/* A probe that matched nothing reports a clean run. Both scales of the demo's
   icon gallery are on states.html, so every name should be found twice. */
if (named < ICON_ORDER.length) {
  failures.push(`only ${named} of ${ICON_ORDER.length} icon names were found on either page, ` +
    'so the data-icon rules were mostly unmeasured');
}

let badges = 0;
await withDemo(async (p, base) => {
  for (const page of ['demo/states.html', 'demo/index.html']) {
    await p.goto(`${base}/${page}`);
    if (!(await p.ready(`document.querySelectorAll('.pw-badge .pw-icon').length > 1`))) {
      failures.push(`${page}: no badges rendered, so the optical gap was never measured`);
      continue;
    }
    const rows = await p.evaluate(BEARINGS);
    badges += rows.length;
    /* Grouped by scale, because the correction is scaled and a gallery at
       scale 2 legitimately insets twice as far. */
    const byScale = new Map();
    for (const row of rows) {
      if (!row.bearing) {
        failures.push(`${page}: the ${row.icon} badge computes --pw-icon-bearing 0, so its mark `
          + 'is not correcting for its own bearings and the gap is whatever the glyph happened to be');
        continue;
      }
      if (!(byScale.get(row.scale) ?? []).length) byScale.set(row.scale, []);
      byScale.get(row.scale).push(row);
    }
    for (const [scale, group] of byScale) {
      const insets = [...new Set(group.map((r) => r.inset))];
      if (insets.length > 1) {
        failures.push(`${page}: badge marks at scale ${scale} inset to ${insets.join(', ')}px. `
          + 'One number, or the badges measure the same and read differently: '
          + group.map((r) => `${r.icon} ${r.inset}`).join(', '));
      }
    }
  }
}, { width: 1200, height: 900 });

report('cssom', failures, `${seen} rendered classes, ${named} named icon cells and `
  + `${badges} badge marks measured across 2 pages`);
