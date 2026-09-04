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
