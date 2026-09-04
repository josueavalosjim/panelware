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
 * This runs against demo/index.html only. states.html is the proof the CSS
 * needs no JavaScript, which makes it the wrong page to ask what happens when
 * you press a key.
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
const SLIDERS = [
  { label: 'Treble', mode: 'uncontrolled' },
  { label: 'Gain', mode: 'controlled' },
];

const failures = [];
let scanned = 0;
await withDemo(async (p, base) => {
  await p.goto(`${base}/demo/index.html`);
  await p.settle(1800);

  /* A page that never rendered has no thumbs to press, and every row below
     would report as missing rather than as the one thing that went wrong. */
  const alive = await p.evaluate(`document.querySelectorAll('.pw-slider-thumb').length`);
  if (alive < 4) {
    failures.push(`index.html rendered ${alive} slider thumbs, so nothing was driven` +
      ' (it boots React from esm.sh and needs a network)');
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

report('interaction', failures, `${scanned} sliders driven from the keyboard`);
