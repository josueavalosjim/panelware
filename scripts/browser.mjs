/**
 * The one page-driving helper the checks share.
 *
 * It borrows taste-check's CDP client rather than taking a browser automation
 * dependency, for the reason that client's own header gives: the part of the
 * protocol these checks need is navigate, evaluate and a viewport, and that
 * part is small enough not to be worth several hundred megabytes. If a check
 * here starts wanting selectors or waiting strategies, that is the point to
 * take the dependency instead.
 *
 * A missing Chromium exits non-zero rather than skipping. A check that skips
 * quietly is worse than one that fails, because only one of the two ever gets
 * fixed, and a skipped check reads as a green one in a CI log.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { connect, findBrowser } from '@josueavalosjim/taste-check';

import { startDemoServer } from './serve.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const fileUrl = (rel) => pathToFileURL(join(ROOT, rel)).href;

export function requireBrowser() {
  if (findBrowser()) return;
  console.error('no Chrome or Chromium found, so this check would skip rather than run');
  console.error('set CHROME_PATH, or install a Chromium');
  process.exit(1);
}

/** Virtual key codes for the keys these checks press. */
const KEYS = {
  ArrowRight: 39, ArrowLeft: 37, ArrowDown: 40, ArrowUp: 38,
  Enter: 13, Escape: 27, Tab: 9, Home: 36, End: 35, ' ': 32,
};

/** A page with a real viewport, torn down whatever the body does. */
export async function withPage(fn, { width = 1100, height = 900, settle = 900 } = {}) {
  requireBrowser();
  const page = await connect({});
  try {
    await page.send('Emulation.setDeviceMetricsOverride', {
      width, height, deviceScaleFactor: 1, mobile: false,
    });
    page.resize = (w, h) => page.send('Emulation.setDeviceMetricsOverride', {
      width: w, height: h, deviceScaleFactor: 1, mobile: false,
    });
    /* A headless page is never the focused window, so document.hasFocus() is
       false and element.focus() moves activeElement without firing a focus
       event. Anything listening for one therefore never hears it, which is not
       a bug in the component: Radix's tooltip opens on focus and simply was
       not being told. Focus emulation makes the page believe it is frontmost,
       which is what a real user's browser would be.

       Harmless where it is not needed. :focus-visible still depends on how
       focus arrived, so this does not fake keyboard modality and the ring
       sweep still presses a real Tab for that. */
    await page.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => {});
    page.settle = (ms = settle) => page.evaluate(`new Promise((r) => setTimeout(r, ${ms}))`);
    /* A real key event, not element.dispatchEvent. Radix listens on the DOM
       and reads the event's key, but a synthetic event from page script does
       not move focus, does not repeat, and is trusted by nothing. Checks that
       want to see a component AFTER an interaction, which is most of the
       states a kit like this has, need the browser to deliver the keystroke. */
    page.key = async (key, code = KEYS[key] ?? 0) => {
      for (const type of ['keyDown', 'keyUp']) {
        await page.send('Input.dispatchKeyEvent', {
          type, key, code: key, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code,
        });
      }
      return page.settle(60);
    };
    /* Wait for the page to be ready rather than for a duration.
       
       demo/index.html boots React from esm.sh, and how long that takes is a
       property of the network, not of the page. A fixed settle is a bet on
       the slowest machine that will ever run the check, and a bet that is
       usually won is exactly the kind that produces a gate people re-run
       until it is green. This polls instead, and fails loudly with what it
       was waiting for rather than continuing against a half-built page. */
    page.ready = async (expression, { timeout = 15000, every = 100 } = {}) => {
      const deadline = Date.now() + timeout;
      for (;;) {
        if (await page.evaluate(expression)) return true;
        if (Date.now() > deadline) return false;
        await page.settle(every);
      }
    };

    /* A real mouse press, for the same reason page.key exists. Radix opens a
       menu on pointerdown rather than on click, so element.click() from page
       script opens nothing and looks like the component is broken. This also
       leaves the page in pointer modality, which is correct: a menu opened
       with the mouse should not paint focus rings. */
    page.click = async (selector) => {
      const at = await page.evaluate(`(() => {
        const e = document.querySelector(${JSON.stringify(selector)});
        if (!e) return null;
        e.scrollIntoView({ block: 'center' });
        const r = e.getBoundingClientRect();
        return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
      })()`);
      if (!at) return false;
      for (const type of ['mousePressed', 'mouseReleased']) {
        await page.send('Input.dispatchMouseEvent', {
          type, x: at.x, y: at.y, button: 'left', clickCount: 1, buttons: type === 'mousePressed' ? 1 : 0,
        });
      }
      await page.settle(250);
      return true;
    };

    /* What the browser itself computed, rather than what the markup implies.
       An accessible name is the end of a long resolution: aria-labelledby to
       an id that has to exist, then aria-label, then content, then nothing.
       Reading the attributes back only proves the attributes are there. This
       is the one measurement that answers whether a screen reader would say
       anything, and it found a <section> the kit believed was a named region
       sitting in the tree as role="generic" with no name at all. */
    page.ax = async (selector) => {
      await page.send('Accessibility.enable');
      const { root } = await page.send('DOM.getDocument', { depth: -1 });
      const { nodeIds } = await page.send('DOM.querySelectorAll', {
        nodeId: root.nodeId, selector,
      });
      const out = [];
      for (const nodeId of nodeIds) {
        const { nodes } = await page.send('Accessibility.getPartialAXTree', {
          nodeId, fetchRelatives: false,
        });
        const n = nodes.find((x) => x.backendDOMNodeId !== undefined) ?? nodes[0];
        out.push({ role: n?.role?.value ?? null, name: n?.name?.value ?? '', ignored: !!n?.ignored });
      }
      return out;
    };
    return await fn(page);
  } finally {
    await page.close();
  }
}

/**
 * The demo over HTTP, on a port nobody else has, torn down after.
 *
 * Not file://. demo/index.html boots React through an import map, ES modules
 * do not load over file://, and the page comes up with an empty <main>. The
 * first version of the overflow check ran there and reported clean at every
 * width, having measured a document with nothing in it.
 */
export async function withDemo(fn, options) {
  const server = await startDemoServer();
  try {
    return await withPage((page) => fn(page, server.url), options);
  } finally {
    await server.close();
  }
}

/**
 * "The demo has rendered", as a condition rather than a duration.
 *
 * Every page check here waited a fixed time for demo/index.html to boot React
 * from esm.sh and then counted controls, and that conflates two different
 * failures under one message. A page that rendered nothing and a page that was
 * merely slow both arrive at the count as zero, and the check calls both a
 * defect. Only the first one is. The second is a bet on the slowest machine
 * that will ever run this, and a bet that is usually won is exactly the kind
 * that produces a gate people re-run until it is green: check:interaction
 * failed once in a full run and never again on its own, which is the worst
 * behaviour a release gate can have.
 *
 * So the count stays and the wait goes. Hand `rendered()` to page.ready, which
 * polls to a deadline, and a slow boot passes while an empty page still fails.
 * `counted()` is the same selector as a number, for saying how few arrived.
 *
 * Both come from one selector rather than being written out at each call site,
 * because the condition and the diagnostic disagreeing about what they are
 * looking for is how a check reports a count for something it never waited on.
 */
export const CONTROLS = '.pw-button, .pw-toggle';

export const counted = (selector = CONTROLS) =>
  `document.querySelectorAll(${JSON.stringify(selector)}).length`;

export const rendered = (min = 4, selector = CONTROLS) => `(${counted(selector)}) >= ${min}`;

/** The same thing for elements there is exactly one of: all of these exist. */
export const present = (...selectors) => selectors.flat()
  .map((s) => `!!document.querySelector(${JSON.stringify(s)})`).join(' && ');

/** Report and exit the way every other gate in this repo does. */
export function report(name, failures, scanned) {
  if (!failures.length) {
    console.log(`${name} ok, ${scanned}`);
    process.exit(0);
  }
  console.error(`${name} FAILED, ${failures.length} of ${scanned}\n`);
  for (const line of failures) console.error(`  ${line}`);
  process.exit(1);
}
