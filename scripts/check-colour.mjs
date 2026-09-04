/**
 * Every colour actually painted, against the ground it actually lands on.
 *
 * The contrast block in tastecheck.config.json checks twenty pairs somebody
 * thought to name. This checks every pair that occurs, which is a different
 * question and the one that has caught things: a token is not wrong in
 * isolation, it is wrong on a surface nobody listed. Two bugs of that exact
 * shape shipped before this existed, and a third was found by the audit that
 * produced it, where a comment claimed a floor for --pw-bevel-frame that only
 * held in the light theme and two stylesheets had drawn dividers with it.
 *
 * The ground is composited by walking ancestors until something opaque, which
 * is how a translucent overlay gets counted. What that cannot see is the
 * gloss, because the glare is a sibling pseudo-element rather than an
 * ancestor background; --pw-gloss-lit-base-200 and --pw-gloss-lit-primary are
 * pre-flattened tokens in the contrast block for exactly that reason, and
 * `npm run check:runtime` measures the composited result on the pairs where
 * it matters.
 *
 * Floors, and why they are not all 4.5:
 *   text            4.5, or 3 at large sizes, per 1.4.3
 *   disabled text   3, because 1.4.3 exempts an inactive control and this kit
 *                   holds it to a floor anyway rather than to nothing
 *   a border        3, per 1.4.11, because a control's edge identifies it
 *   --pw-color-divider  2, its own contract. A grouping line is not a control
 *                   boundary: removing it identifies nothing and changes no
 *                   state, so 1.4.11 does not reach it. An earlier version of
 *                   this file floored every border at 3 and reported the
 *                   divider tier as forty failures the day it was added.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ROOT, report, withDemo } from './browser.mjs';

const MEASURE = `(() => {
  const parse = (css) => {
    const m = String(css).match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const n = m[1].split(/[,\\s\\/]+/).filter(Boolean).map(Number);
    return { r: n[0], g: n[1], b: n[2], a: n.length > 3 ? n[3] : 1 };
  };
  const over = (fg, bg) => ({
    r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
    g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
    b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a)),
    a: 1,
  });
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('');
  /* The painted background of an element: its own, composited over whatever
     shows through, up to the first opaque ancestor. */
  const ground = (el) => {
    const stack = [];
    for (let q = el; q; q = q.parentElement) {
      const c = parse(getComputedStyle(q).backgroundColor);
      if (!c || c.a === 0) continue;
      stack.push(c);
      if (c.a === 1) break;
    }
    if (!stack.length) return null;
    let out = stack.pop();
    while (stack.length) out = over(stack.pop(), out);
    return out.a === 1 ? out : null;
  };

  /* The divider's own value, read off the page rather than looked up by name.
     Keyed on the name it only worked for the skin whose token table happens to
     be generated, and every other skin's grouping lines were then held to the
     control-boundary floor they were designed not to meet. The role travels
     with the value; ask the page what the value is. */
  /* Normalised, because the two sides arrive in different notations: a
     computed border colour is rgb(), and a custom property resolves to
     whatever the token file wrote, which here is a hex. Comparing the raw
     strings never matched and every skin's divider was quietly held to the
     control-boundary floor. */
  const norm = (v) => {
    const t = String(v).trim();
    if (t.startsWith('#')) {
      const h = t.length === 4 ? '#' + [...t.slice(1)].map((c) => c + c).join('') : t;
      return h.toLowerCase().slice(0, 7);
    }
    const c = parse(t);
    return c ? hex(c) : '';
  };
  const dividerInk = norm(getComputedStyle(document.documentElement)
    .getPropertyValue('--pw-color-divider'));

  const rows = [];
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const c = getComputedStyle(el);
    if (c.visibility === 'hidden' || c.display === 'none' || Number(c.opacity) === 0) continue;
    const bg = ground(el);
    if (!bg) continue;
    const id = el.tagName.toLowerCase() +
      (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/).join('.') : '');
    /* A label is disabled by the control it labels, which is its SIBLING
       inside .pw-field rather than its ancestor, so closest() never sees it.
       Without this the kit's own disabled field labels read as failures at
       4.29:1 against a 4.5 floor that 1.4.3 does not apply to them. */
    const field = el.closest('label, .pw-field');
    const disabled = el.matches(':disabled, [disabled], [data-disabled], [aria-disabled="true"]') ||
      !!el.closest('[data-disabled], [aria-disabled="true"]') ||
      !!(field && field.querySelector(':disabled, [disabled], [data-disabled], [aria-disabled="true"]'));

    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (ownText) {
      const fg = parse(c.color);
      if (fg && fg.a > 0.05) {
        const size = parseFloat(c.fontSize);
        const large = size >= 24 || (size >= 18.66 && Number(c.fontWeight) >= 700);
        rows.push({ kind: disabled ? 'disabled text' : 'text', id, disabled, large,
          fg: hex(fg.a < 1 ? over(fg, bg) : fg), bg: hex(bg),
          text: el.textContent.trim().slice(0, 24) });
      }
    }
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      if (parseFloat(c['border' + side + 'Width']) === 0) continue;
      if (c['border' + side + 'Style'] === 'none') continue;
      const bc = parse(c['border' + side + 'Color']);
      if (!bc || bc.a < 0.99) continue;
      rows.push({
        kind: 'border', id, disabled, fg: hex(bc), bg: hex(bg), text: '',
        grouping: dividerInk !== '' && hex(bc) === dividerInk,
      });
      break;
    }
  }
  return rows;
})()`;

/* Resolved token values per theme, so a failure names a token rather than a
   hex nobody can grep for. Several tokens share a value inside one theme, so
   this is a list and not a name. */
const docs = JSON.parse(readFileSync(join(ROOT, 'demo', 'docs-data.json'), 'utf8'));
/* The docs table is generated from the chrome files only, so cyber's values
   have no names to map back to. A hex with no token name still reports its
   ratio and its element, which is what a failure needs; the name is a
   convenience and it is honest for it to be missing rather than wrong. */
const namesFor = (theme, skin) => {
  const by = new Map();
  if (skin !== 'chrome') return () => [];
  for (const g of docs.groups) {
    for (const t of g.tokens) {
      const v = t.values?.[theme]?.resolved;
      if (typeof v !== 'string' || !v.startsWith('#')) continue;
      const k = v.toLowerCase();
      if (!by.has(k)) by.set(k, []);
      by.get(k).push(t.name);
    }
  }
  return (h) => by.get(h.toLowerCase()) ?? [];
};

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (c) => {
  const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = c;
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(rgb(a)), lum(rgb(b))].sort((x, y) => y - x);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
};

const floorFor = (row, tokens) => {
  if (row.kind === 'border') {
    return row.grouping || tokens.includes('--pw-color-divider') ? 2 : 3;
  }
  if (row.disabled) return 3;
  return row.large ? 3 : 4.5;
};

/* Every look the kit ships, as a skin and an optional preset. Not a cross
   product: a preset is nested inside its skin, so pairing one with another
   skin is not a combination that exists. */
const LOOKS = [
  { skin: 'chrome' },
  { skin: 'chrome', preset: 'deck' },
  { skin: 'cyber' },
];

const failures = [];
let scanned = 0;
await withDemo(async (p, base) => {
  for (const page of ['demo/states.html', 'demo/index.html']) {
    for (const look of LOOKS) {
      const skin = look.preset ? `${look.skin}+${look.preset}` : look.skin;
      for (const theme of ['light', 'dark']) {
      await p.goto(`${base}/${page}`);
      await p.settle(page.includes('index') ? 1700 : 800);
      await p.evaluate(`document.documentElement.dataset.theme = ${JSON.stringify(theme)}`);
      await p.evaluate(`document.documentElement.dataset.skin = ${JSON.stringify(look.skin)}`);
      if (look.preset) await p.evaluate(`document.documentElement.dataset.preset = ${JSON.stringify(look.preset)}`);
      else await p.evaluate('delete document.documentElement.dataset.preset');
      await p.settle(400);
      const alive = await p.evaluate(`document.querySelectorAll('.pw-button, .pw-toggle').length`);
      if (alive < 4) {
        failures.push(`${page} (${skin}-${theme}) rendered ${alive} controls, so nothing was measured`);
        continue;
      }
      const name = namesFor(theme, skin);
      const rows = await p.evaluate(MEASURE);
      scanned += rows.length;
      const seen = new Set();
      for (const row of rows) {
        const tokens = [...name(row.fg), ...name(row.bg)];
        const min = floorFor(row, name(row.fg));
        const got = ratio(row.fg, row.bg);
        if (got >= min) continue;
        const fgName = name(row.fg)[0] ?? row.fg;
        const bgName = name(row.bg)[0] ?? row.bg;
        const key = `${theme}|${row.kind}|${fgName}|${bgName}`;
        if (seen.has(key)) continue;
        seen.add(key);
        failures.push(`${got}:1 needs ${min}  ${skin}-${theme} ${row.kind}  ${fgName} on ${bgName}\n` +
          `      ${row.id}${row.text ? `  "${row.text}"` : ''}  [${page}]`);
      }
      }
    }
  }
}, { width: 1200, height: 900 });

report('colour', failures, `${scanned} painted pairs across 2 pages x ${LOOKS.length} looks x 2 themes`);
