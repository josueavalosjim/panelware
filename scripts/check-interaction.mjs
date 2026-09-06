/**
 * What the components say about themselves AFTER you use them.
 *
 * Everything else here measures a component at rest. Server rendering cannot
 * press a key, the static page has no JavaScript to react to one, and axe
 * reads whatever is on screen when it runs. So the whole class of bug where
 * an attribute is correct at mount and wrong from the first interaction had
 * nothing looking at it.
 *
 * One escaped, and it is the reason this file exists. Slider computed its
 * aria-valuetext from `value ?? defaultValue`. For a controlled slider that
 * is right. For an uncontrolled one defaultValue never changes, so Radix
 * moved aria-valuenow on every arrow press while aria-valuetext stayed at the
 * value the slider mounted with, and aria-valuetext WINS over aria-valuenow
 * in every screen reader: the announcement was the same wrong number all the
 * way across the track. Measured before the fix, three presses of ArrowRight
 * took aria-valuenow from 70 to 73 with aria-valuetext frozen at "20
 * decibels".
 *
 * It survived a test suite that asserts on aria-valuetext, because that test
 * renders statically and every formatted slider in the demo was controlled.
 * The kit demonstrated only the arrangement in which the bug cannot appear.
 *
 * The slider rows run against demo/index.html only. states.html is the proof
 * the CSS needs no JavaScript, which makes it the wrong page to ask what
 * happens when you press a key. The focus-ring rows run against both, because
 * that one is a CSS rule and the static page had it wrong too.
 */
import { report, withDemo } from './browser.mjs';

/** Read one thumb's live ARIA by its accessible name. */
const thumb = (label) => `(() => {
  const t = [...document.querySelectorAll('.pw-slider-thumb')]
    .find((e) => e.getAttribute('aria-label') === ${JSON.stringify(label)});
  if (!t) return null;
  return { now: t.getAttribute('aria-valuenow'), text: t.getAttribute('aria-valuetext') };
})()`;

const focus = (label) => `(() => {
  const t = [...document.querySelectorAll('.pw-slider-thumb')]
    .find((e) => e.getAttribute('aria-label') === ${JSON.stringify(label)});
  if (!t) return false;
  t.focus();
  return document.activeElement === t;
})()`;

/**
 * The sliders whose announced text has to follow the thumb.
 *
 * Both control modes, because they take different paths through the component
 * and only one of them was ever wrong. Dropping the uncontrolled row is how
 * this stops being able to fail. The controlled row earns its place too: the
 * fix wraps onValueChange to keep an internal copy of the value, and a
 * controlled slider only moves at all if the caller's handler still runs.
 */
const PAGES = ['demo/states.html', 'demo/index.html'];

const SLIDERS = [
  { label: 'Treble', mode: 'uncontrolled' },
  { label: 'Gain', mode: 'controlled' },
];

const failures = [];
let scanned = 0;
await withDemo(async (p, base) => {
  await p.goto(`${base}/demo/index.html`);

  /* A page that never rendered has no thumbs to press, and every row below
     would report as missing rather than as the one thing that went wrong.

     Waited for rather than slept through. This ran on a fixed 1800ms settle
     and failed once inside a full run of the page checks and never again on
     its own, which is the worst way for a gate to behave: a release gate that
     fails intermittently teaches people to re-run it, and a gate people
     re-run until it goes green is not a gate. */
  const THUMBS = `document.querySelectorAll('.pw-slider-thumb').length`;
  if (!(await p.ready(`(${THUMBS}) >= 4`))) {
    failures.push(`index.html rendered ${await p.evaluate(THUMBS)} slider thumbs before the `
      + 'timeout, so nothing was driven (it boots React from esm.sh and needs a network)');
    return;
  }

  for (const { label, mode } of SLIDERS) {
    if (!(await p.evaluate(focus(label)))) {
      failures.push(`${label} (${mode}): no thumb with that name took focus`);
      continue;
    }
    const before = await p.evaluate(thumb(label));
    if (!before?.text) {
      failures.push(`${label} (${mode}): no aria-valuetext at rest, so there is nothing to keep in step`);
      continue;
    }
    const PRESSES = 3;
    for (let i = 0; i < PRESSES; i++) await p.key('ArrowRight');
    const moved = await p.evaluate(thumb(label));
    scanned += 1;

    if (moved.now === before.now) {
      failures.push(`${label} (${mode}): aria-valuenow did not move off ${before.now}, ` +
        'so the keypress never reached the component');
      continue;
    }

    /* Two invariants, and neither one needs this check to know what format()
       does, which it cannot.

       The text has to move with the value. A frozen aria-valuetext is the bug
       that prompted this file, and because aria-valuetext wins over
       aria-valuenow it is not a degraded announcement but a wrong one. */
    if (moved.text === before.text) {
      failures.push(`${label} (${mode}): aria-valuenow moved ${before.now} to ${moved.now} and ` +
        `aria-valuetext stayed at "${moved.text}", which is what a screen reader announces`);
      continue;
    }

    /* And the text has to be a function of the value rather than of the
       history: come back to where it started and it has to say what it said.
       Text that moves but lags one press behind passes the check above and
       still announces the wrong number every time. */
    for (let i = 0; i < PRESSES; i++) await p.key('ArrowLeft');
    const back = await p.evaluate(thumb(label));
    if (back.now !== before.now) {
      failures.push(`${label} (${mode}): ${PRESSES} left did not undo ${PRESSES} right, ` +
        `${before.now} to ${back.now}, so the rest of this row proves nothing`);
      continue;
    }
    if (back.text !== before.text) {
      failures.push(`${label} (${mode}): back at ${back.now} the text says "${back.text}" ` +
        `and said "${before.text}" the first time, so it is tracking the presses ` +
        'rather than the value');
    }
  }
}, { width: 1100, height: 900 });

/**
 * A focus ring belongs to focus.
 *
 * .pw-list-item[data-active] drew an outline with no condition on it, and
 * List seeds its active row in the state initialiser so aria-activedescendant
 * has somewhere to point from the first render. Between them, every list on
 * the page painted a 2px focus ring on a row before anyone had touched
 * anything. reset.css states the opposite as this kit's own rule three files
 * away, and nothing could see the contradiction: axe does not mind, contrast
 * does not mind, and both demo pages were wrong in the same way so parity
 * agreed with itself.
 *
 * Both directions, because deleting the rule passes the half of this that
 * matters least. The ring has to be absent at rest AND present when the list
 * has keyboard focus, or the fix is just a removed feature.
 *
 * On the modality: :focus-visible is the browser's own judgement about
 * whether focus arrived by keyboard, and it cannot be faked from script. A
 * Tab keystroke puts the page in keyboard modality, and moving focus after
 * that is treated as a keyboard arrival. Tabbing all the way down to the list
 * would work too and would take thirty keystrokes to prove the same thing.
 */
const RING = `(() => {
  const row = document.querySelector('.pw-list-item[data-active]');
  if (!row) return null;
  const s = getComputedStyle(row);
  return { drawn: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0, style: s.outlineStyle };
})()`;

let rings = 0;
await withDemo(async (p, base) => {
  for (const page of PAGES) {
    await p.goto(`${base}/${page}`);
    if (!(await p.ready(`document.querySelectorAll('.pw-list-item').length > 0`))) {
      failures.push(`${page}: no list rendered before the timeout, so no ring was checked`);
      continue;
    }

    const atRest = await p.evaluate(RING);
    if (!atRest) {
      failures.push(`${page}: no .pw-list-item[data-active], so the focus ring was never checked`);
      continue;
    }
    if (atRest.drawn) {
      failures.push(`${page}: the active row paints a ${atRest.style} focus ring at mount, ` +
        'with nothing focused and nobody having touched the page');
    }

    /* Keyboard modality first, then focus. A click would move focus without
       :focus-visible, which is the whole point of the rule. */
    await p.key('Tab');
    const took = await p.evaluate(`(() => {
      const l = document.querySelector('.pw-list');
      if (!l) return false;
      l.focus();
      return document.activeElement === l;
    })()`);
    if (!took) {
      failures.push(`${page}: .pw-list did not take focus, so the rest of this proves nothing`);
      continue;
    }
    await p.settle(80);
    const focused = await p.evaluate(RING);
    rings += 1;
    if (!focused.drawn) {
      failures.push(`${page}: the list has keyboard focus and the active row paints no ring, ` +
        'so there is nothing showing which row the arrow keys are on');
    }
  }
}, { width: 1100, height: 900 });

/**
 * Every focusable thing this kit renders draws the kit's own focus ring.
 *
 * reset.css declares the ring once for a fixed list of classes, and that list
 * is the whole answer to 2.4.7. The obvious check is to read the list and
 * confirm each member rings, and that check cannot fail: delete a control
 * from the list and it leaves the list the check is reading. So the subject
 * is what the page actually renders as focusable, and the list is what is
 * being tested against it.
 *
 * Two assertions, because a bare outline is not evidence. Most of these are
 * <button>, and a browser draws its own focus outline on a button whether or
 * not this kit says anything, so an outline alone survives deleting the rule
 * and proves nothing. The kit's ring is two rings in opposite values, and the
 * second one is --pw-focus-halo, which the reset sets only on the classes it
 * lists and which has no user-agent equivalent. Reading it while the control
 * has focus is what tells a kit ring from a browser one.
 *
 * That is how .pw-lcd-pause was found. The marquee's pause button is
 * focusable, was not in the list, and got the browser's single outline on the
 * readout's dark green face, which is the exact surface the two-ring argument
 * was written about.
 */
let ringed = 0;
await withDemo(async (p, base) => {
  await p.goto(`${base}/demo/index.html`);
  if (!(await p.ready(`document.querySelectorAll('.pw-button').length >= 4`))) {
    failures.push('index.html did not render its controls before the timeout, so no ring was checked');
    return;
  }
  /* Keyboard modality, once. :focus-visible is the browser's own judgement
     about how focus arrived and cannot be set from script. */
  await p.key('Tab');

  const found = await p.evaluate(`(() => {
    const els = [...document.querySelectorAll(
      'a[href],button,input,[tabindex]:not([tabindex="-1"]),[role="slider"]')]
      .filter((e) => !e.hasAttribute('disabled') && e.getAttribute('aria-disabled') !== 'true')
      .filter((e) => [...e.classList].some((c) => c.startsWith('pw-')));
    const out = [];
    const seen = new Set();
    for (const e of els) {
      const name = [...e.classList].filter((c) => c.startsWith('pw-')).join('.');
      if (seen.has(name)) continue;
      seen.add(name);
      e.focus();
      if (document.activeElement !== e) continue;
      const s = getComputedStyle(e);
      const halo = s.getPropertyValue('--pw-focus-halo').trim();
      out.push({ name,
        ring: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0,
        style: s.outlineStyle,
        /* The default is a transparent zero-spread shadow. Anything with a
           spread and a colour is the reset having named this class. */
        halo: /[0-9]+px/.test(halo) && halo.indexOf('#0000') === -1
          && halo.indexOf('transparent') === -1,
        haloValue: halo });
    }
    return out;
  })()`);

  /* A page that rendered nothing has no focusable controls to fail. */
  if (found.length < 8) {
    failures.push(`only ${found.length} focusable controls on index.html, so this measured nothing`);
    return;
  }

  for (const got of found) {
    ringed += 1;
    if (!got.ring) {
      failures.push(`.${got.name} takes keyboard focus and draws no outline ` +
        `(outline-style ${got.style}), which is 2.4.7 missing on one control`);
    } else if (!got.halo) {
      failures.push(`.${got.name} takes keyboard focus and --pw-focus-halo stays at its ` +
        `default (${got.haloValue}), so it is getting the browser's single outline rather than ` +
        'this kit\'s two rings: the class is missing from the list in reset.css');
    }
  }
}, { width: 1100, height: 900 });

report('interaction', failures,
  `${scanned} sliders driven from the keyboard, ${rings} lists focused, `
  + `${ringed} focusable controls checked for the kit's own focus ring`);
