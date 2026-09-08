/**
 * Accessibility measured in a browser: axe, plus the two questions axe
 * cannot ask.
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

import { ROOT, counted, present, rendered, report, withDemo } from './browser.mjs';

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

/* The same run, minus two rules that describe the demo page's document
   outline rather than the kit. A modal correctly hides the page behind it, so
   the page's own <main> and <h1> stop being visible to axe and both rules
   fire: that is the modal working, reported as a defect. Everything else,
   including every rule that could say something about the surface actually
   on screen, stays on. */
const RUN_OPEN = RUN.replace('region: { enabled: false },',
  `region: { enabled: false },
    'landmark-one-main': { enabled: false },
    'page-has-heading-one': { enabled: false },`);

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
      if (!(await p.ready(rendered()))) {
        failures.push(`${page} (${skin}-${theme}) rendered ${await p.evaluate(counted())} controls ` +
          'before the wait ran out, so axe scanned nothing');
        continue;
      }
      await p.evaluate(`document.documentElement.dataset.theme = ${JSON.stringify(theme)}`);
      await p.evaluate(`document.documentElement.dataset.skin = ${JSON.stringify(look.skin)}`);
      if (look.preset) await p.evaluate(`document.documentElement.dataset.preset = ${JSON.stringify(look.preset)}`);
      else await p.evaluate('delete document.documentElement.dataset.preset');
      /* A style recalc, not a network wait. Nothing polls for this because
         reading a computed style forces it. */
      await p.settle(300);
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
    /* Waited for, not timed, and the result is deliberately not branched on:
       if one of these never arrives the loop below names which one, and that
       is a better message than a timeout that says only that something was
       missing. */
    await p.ready(present(NAMED.map((n) => n.selector)));
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

/**
 * axe over the surfaces that only exist once you open them.
 *
 * Everything above scans a page at rest, and a menu, a select listbox and a
 * dialog are not on a page at rest. Ten classes the kit ships styling for
 * therefore never rendered in any browser check here: the whole menu popup,
 * the whole select list, and the dialog's own overlay and panel. This file's
 * first line said "in every state".
 *
 * demo/index.html only. states.html renders the components with no JavaScript
 * at all, which is what makes it the proof the CSS stands alone and the wrong
 * page to ask what happens when you open something.
 *
 * Each opener is checked for having actually opened, by name, because a click
 * that lands on nothing leaves axe scanning the page it was already scanning
 * and reporting the same clean result.
 *
 * At 820 rather than the default 1100, and the width is load-bearing. This
 * pass first ran at 1100, passed on a Mac, and failed on CI, which is the
 * exact shape of green-for-the-wrong-reason this repo keeps finding. The
 * reason: Radix locks scrolling while a menu is open and pads the body to
 * compensate for the scrollbar it just removed. macOS overlay scrollbars are
 * zero wide so the padding is zero and nothing moves; Linux scrollbars are
 * real, so the content narrowed and the demo's contrast tables tipped into
 * horizontal overflow, where axe correctly reported seven scrollable regions
 * a keyboard could not reach.
 *
 * A width where the tables overflow on any platform makes the result the
 * same everywhere. Measured: at 820 they scroll before anything opens.
 */
/**
 * Upstream behaviour, recorded rather than switched off.
 *
 * Radix's Select hides the rest of the page with aria-hidden and does not
 * also make it inert, so every focusable control behind the open listbox is
 * inside an aria-hidden subtree, which is exactly what this rule is for. The
 * Dialog does it properly and is clean, so this is a difference between two
 * Radix primitives rather than something the skin does or can fix.
 *
 * Listed with `seen`, and asserted below to have actually occurred, because
 * an exemption nobody checks is how a fixed upstream bug stays permanently
 * excused. If Radix changes this, the entry goes stale and says so.
 */
const KNOWN = [
  { surface: 'select listbox', rule: 'aria-hidden-focus', seen: false,
    why: 'Radix Select sets aria-hidden on the page without inert' },
];

/* Which Radix this actually measured. The demo boots it from esm.sh through
   an import map, so node_modules is not the answer and the HTML is. It goes
   in the green line beside the axe version for the same reason: an exemption
   recorded against upstream is worth the version it was recorded against, and
   a run that does not say which one leaves the next reader guessing at how
   stale it is. A test holds this pin to the package's own peer range. */
const RADIX = readFileSync(new URL('../demo/index.html', import.meta.url), 'utf8')
  .match(/esm\.sh\/radix-ui@([0-9.]+)/)?.[1] ?? 'an unreadable version';

const SURFACES = [
  { name: 'menu', open: '#menubar .pw-menubar-trigger', reveals: ['pw-menu', 'pw-menu-item'] },
  { name: 'select listbox', open: '#field .pw-select', reveals: ['pw-select-list', 'pw-select-item'] },
  { name: 'dialog', open: '#dialog .pw-button', reveals: ['pw-panel', 'pw-overlay'] },
  /* A tooltip does not open on a press, which is the point of it. Radix opens
     this one on focus, and focus is also the only way a keyboard user ever
     sees it, so it is the interaction worth scanning. */
  { name: 'tooltip', open: '#tooltip-trigger', reveals: ['pw-tooltip'], by: 'focus' },
];

let opened = 0;
await withDemo(async (p, base) => {
  for (const theme of ['light', 'dark']) {
    for (const { name, open, reveals, by } of SURFACES) {
      await p.goto(`${base}/demo/index.html`);
      if (!(await p.ready(present(open)))) {
        failures.push(`${name} (${theme}): ${open} never appeared, so axe scanned the page at rest`);
        continue;
      }
      await p.evaluate(`document.documentElement.dataset.theme = ${JSON.stringify(theme)}`);
      await p.settle(200);

      if (by === 'focus') {
        await p.evaluate(`document.querySelector(${JSON.stringify(open)}).focus()`);
        /* Radix waits out its own delay before it mounts anything. */
        if (!(await p.ready(`!!document.querySelector('.${reveals[0]}')`, { timeout: 4000 }))) {
          failures.push(`${name} (${theme}): focusing ${open} opened nothing, so axe scanned ` +
            'the page at rest');
          continue;
        }
      } else if (!(await p.click(open))) {
        failures.push(`${name} (${theme}): nothing matched ${open}, so axe scanned the page at rest`);
        continue;
      }
      const missing = await p.evaluate(`${JSON.stringify(reveals)}
        .filter((c) => !document.querySelector('.' + c))`);
      if (missing.length) {
        failures.push(`${name} (${theme}): clicked ${open} and ${missing.join(', ')} did not appear, ` +
          'so it never opened and axe scanned the page at rest');
        continue;
      }

      await p.evaluate(AXE);
      const violations = await p.evaluate(RUN_OPEN);
      opened += 1;
      for (const v of violations) {
        const known = KNOWN.find((k) => k.surface === name && k.rule === v.id);
        if (known) { known.seen = true; continue; }
        failures.push(`${v.impact}: ${v.id} — ${v.help}  [open ${name}, ${theme}]`);
        for (const n of v.nodes) failures.push(`      ${n.target}`);
      }
    }
  }
}, { width: 820, height: 900 });

for (const k of KNOWN) {
  if (!k.seen) {
    failures.push(`the ${k.rule} exemption for the open ${k.surface} did not occur, so ` +
      `"${k.why}" is no longer true and the exemption should go`);
  }
}

/**
 * The hit targets have to survive the hooks a skin is invited to set.
 *
 * --pw-clip-control is documented in "Writing a skin" and a skin is meant to
 * put a notched corner in it. clip-path clips an element's outline and its
 * pseudo-elements along with its corners, and three controls in this kit draw
 * their hit area as a centred ::after and their focus ring as an outline. So
 * setting the documented hook silently collapsed each target back to its ink:
 * the checkbox and the radio to their 20x20 boxes, under WCAG 2.5.8's 24x24
 * and well under this kit's own 44 floor. The slider thumb had already been
 * given the opt-out and the other two had the identical construction.
 *
 * axe cannot find this. Its target-size rule reads the layout it is handed,
 * and the layout it is handed is the default one, where every target is fine.
 * The bug only exists in a skin nobody has written yet, which is exactly the
 * kind a token contract is supposed to make impossible rather than likely.
 *
 * So this sets the hook the way a skin would and hit-tests from each
 * control's centre, which is the same probe check-parity uses on the thumb.
 */
const NOTCH = 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)';

/** Controls whose hit area is bigger than their ink, and by how much. */
const TARGETS = [
  { selector: '#structure .pw-switch', reach: 15 },
  { selector: '#field .pw-checkbox', reach: 15 },
  { selector: '#field .pw-radio', reach: 15 },
  { selector: '#slider .pw-slider-thumb', reach: 15 },
];

const probe = (selector, reach) => `(() => {
  const e = document.querySelector(${JSON.stringify(selector)});
  if (!e) return null;
  e.scrollIntoView({ block: 'center' });
  const b = e.getBoundingClientRect();
  const at = (dx) => {
    const t = document.elementFromPoint(b.x + b.width / 2 + dx, b.y + b.height / 2);
    return t === e || e.contains(t);
  };
  const s = getComputedStyle(e);
  return { reaches: at(${reach}), radius: s.borderRadius, clip: s.clipPath };
})()`;

let targets = 0;
await withDemo(async (p, base) => {
  await p.goto(`${base}/demo/index.html`);
  /* Not branched on, for the reason the names sweep gives: the loop below
     reports the missing control by name. */
  await p.ready(present(TARGETS.map((t) => t.selector)));

  for (const { selector, reach } of TARGETS) {
    const before = await p.evaluate(probe(selector, reach));
    if (!before) {
      failures.push(`${selector}: not on the page, so its target was never measured`);
      continue;
    }
    if (!before.reaches) {
      failures.push(`${selector}: the target does not reach ${reach}px from centre with no skin ` +
        'set at all, so the rest of this proves nothing');
      continue;
    }

    await p.evaluate(`document.documentElement.style.setProperty('--pw-clip-control', ${JSON.stringify(NOTCH)})`);
    await p.settle(120);
    const after = await p.evaluate(probe(selector, reach));
    await p.evaluate(`document.documentElement.style.removeProperty('--pw-clip-control')`);
    await p.settle(60);
    targets += 1;

    if (!after.reaches) {
      failures.push(`${selector}: a skin setting --pw-clip-control collapses the target to its ` +
        `ink, ${reach}px from centre no longer lands on it (WCAG 2.5.8 wants 24x24, this kit ` +
        'wants 44)');
    }
    /* Not "the radius changed": a clip paints over a radius without altering
       the computed value, so that assertion reads well and can never fail.
       The falsifiable form of the same concern is that the hook did not reach
       these controls at all. It also covers the radio's roundness, which the
       README calls semantic and a notched polygon squares off. */
    if (after.clip !== 'none') {
      failures.push(`${selector}: the corner clip reached it as ${after.clip}, so the hook ` +
        'is clipping a control whose hit area and focus ring live outside its box');
    }
  }
});

/**
 * The corner clip must not reach anything that draws a focus ring.
 *
 * bevel.css opts those controls out of --pw-clip-control, and a test in
 * test/css.test.mjs holds that opt-out list to reset.css's ring list verbatim.
 * Both lists were correct and three controls were clipped anyway.
 *
 * dialog.css, list.css and field.css each re-declared clip-path for .pw-panel,
 * .pw-list and .pw-select. Those files are in @layer pw.components, the opt-out
 * is in @layer pw.treatment, and components sorts later, so the component won
 * and the opt-out lost. All three were shipping clipped under the cyber skin,
 * which is the only skin that sets the hook, and all three declarations were
 * redundant anyway: the shared slot already applies the clip to everything in
 * it, and the opt-out is what takes it back off.
 *
 * Comparing the two lists could never have seen this, because the defect was in
 * neither list. It was in a third file that neither list knows about. So this
 * asks the browser what the cascade settled on, which is the only thing that
 * knows.
 *
 * Both hooks are set, not just --pw-clip-control. The panel was clipped through
 * --pw-clip-box, and a probe that only set the other one would have found two
 * of the three and reported a clean run for the third.
 */
const RINGED = [...readFileSync(new URL('../css/reset.css', import.meta.url), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .matchAll(/:where\(([^)]*)\):focus-visible/g)]
  .flatMap((m) => m[1].split(',').map((x) => x.trim()))
  .filter(Boolean);

let clipped = 0;
const seen = new Set();
await withDemo(async (p, base) => {
  for (const page of PAGES) {
    await p.goto(`${base}/${page}`);
    await p.ready(rendered());
    await p.evaluate(`(() => {
      const s = document.documentElement.style;
      s.setProperty('--pw-clip-control', ${JSON.stringify(NOTCH)});
      s.setProperty('--pw-clip-box', ${JSON.stringify(NOTCH)});
    })()`);
    await p.settle(120);

    const got = await p.evaluate(`${JSON.stringify(RINGED)}.map((sel) => {
      const e = document.querySelector(sel);
      return e ? { sel, clip: getComputedStyle(e).clipPath } : null;
    }).filter(Boolean)`);

    for (const { sel, clip } of got) {
      seen.add(sel);
      clipped += 1;
      if (clip !== 'none') {
        failures.push(`${page}: ${sel} draws a focus ring and the corner clip reaches it as ` +
          `${clip}, so a notched skin paints no ring on it at all`);
      }
    }
  }
});

/* A probe that finds nothing reports a clean run, so absence is a failure. */
const unseen = RINGED.filter((sel) => !seen.has(sel));
if (unseen.length) {
  failures.push(`neither demo page renders ${unseen.join(', ')}, so the corner clip was never ` +
    `measured on ${unseen.length === 1 ? 'it' : 'them'}`);
}

report('a11y', failures, `${checked} page/look/theme combinations scanned by axe ${
  JSON.parse(readFileSync(new URL('../node_modules/axe-core/package.json', import.meta.url), 'utf8')).version
}, ${opened} opened surfaces against radix-ui ${RADIX}, ${named} accessible names the browser computed, ` +
  `and ${targets} hit targets plus ${clipped} focus rings under a skin's clip`);
