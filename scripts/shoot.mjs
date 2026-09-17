/**
 * The comps, as PNGs.
 *
 * Drives demo/showcase/index.html through every combination worth posting and
 * writes 1920x1080 stills. It borrows the same CDP client every other check
 * here uses rather than taking a browser automation dependency, for the reason
 * scripts/browser.mjs gives: navigate, evaluate and a viewport is all this
 * needs.
 *
 * The window is 1920 wide on purpose. The stage is a fixed 1920x1080 that
 * scales to its frame, so at that width the scale lands on exactly 1 and the
 * capture is the composition at native size with no resampling anywhere.
 *
 *   node scripts/shoot.mjs                  every comp
 *   node scripts/shoot.mjs --skin cyber     one skin
 *   node scripts/shoot.mjs --comp hero      one comp
 *   node scripts/shoot.mjs --clip           the player GIF, alone
 *
 * Output goes to shots/, which is gitignored: these are artefacts of the repo
 * rather than part of it, and a directory of PNGs in a CSS kit's history is
 * weight nobody downloading the package asked to carry.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ROOT, withPage } from './browser.mjs';
import { startDemoServer } from './serve.mjs';

const COMPS = ['hero', 'full', 'skins', 'axes', 'icons', 'player'];

/* The 275x116 replica is its own page rather than a comp on the stage, and it
   is shot differently: at its true size and a 4x device pixel ratio, because
   scaling a masked readout in CSS resamples the mask and loses the bottom of
   every digit. demo/player/classic.css carries the diagnosis. */
const CLASSIC = { page: 'demo/player/classic.html', scale: 4, w: 275, h: 116 };

/* Which comps are worth shooting per skin. Only the player takes the skin
   from outside; the others carry their own looks, and shooting them per
   skin writes identical files. */
const PER_SKIN = new Set(['player']);

/* The comps with a player in a frame, pressed play before the shot. */
const LIVE = new Set(['player', 'full']);

const arg = (name, fallback) => {
  const at = process.argv.indexOf(`--${name}`);
  return at > -1 ? process.argv[at + 1] : fallback;
};

/* `classic` is not one of the stage's comps, it is its own page. Naming it
   used to run the comp loop with a name nothing matches, which shot the empty
   stage and named it as if it were the replica. */
const clipOnly = process.argv.includes('--clip');
const comps = clipOnly ? []
  : arg('comp') ? COMPS.filter((c) => c === arg('comp'))
  : COMPS;
const skins = arg('skin') ? [arg('skin')] : ['chrome', 'cyber', 'paper', 'dialup'];
const themes = arg('theme') ? [arg('theme')] : ['light'];

/**
 * Press play inside the player's iframe, with a real click.
 *
 * The comp wants a live analyser rather than twenty bars at zero, and an
 * AudioContext inside an iframe will not start without a gesture: the page
 * asks itself to play on load, the browser declines, and the shot comes back
 * showing a player that says "playing" over a flat display. A synthetic
 * click does not help, because the autoplay policy is specifically about
 * trusted events. So this is a real mouse press at the button's real
 * coordinates, which is also the only way to find out the player actually
 * works from a cold load.
 *
 * Returns whether the analyser produced anything, so a silent shot is a
 * reported fact rather than a picture nobody looked at.
 */
async function startPlayer(page) {
  const at = await page.evaluate(`(() => {
    const frame = document.querySelector('.comp[data-on] iframe');
    if (!frame || !frame.contentDocument) return null;
    const btn = frame.contentDocument.querySelector('.pw-transport-button[aria-label="Play"]');
    if (!btn) return null;
    const f = frame.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    /* The stage is scaled, so the iframe's own coordinates are in its
       unscaled space and have to come back through the same factor. */
    const fit = parseFloat(getComputedStyle(document.getElementById('stage'))
      .getPropertyValue('--fit')) || 1;
    return { x: Math.round(f.x + (b.x + b.width / 2) * fit),
             y: Math.round(f.y + (b.y + b.height / 2) * fit) };
  })()`);
  if (!at) {
    console.warn('    (no play button in the frame, so this shot is of a stopped player)');
    return false;
  }

  for (const type of ['mousePressed', 'mouseReleased']) {
    await page.send('Input.dispatchMouseEvent', {
      type, x: at.x, y: at.y, button: 'left', clickCount: 1,
      buttons: type === 'mousePressed' ? 1 : 0,
    });
  }
  /* Wait for the analyser rather than for a duration: how long an
     AudioContext takes to produce its first frame is a property of the
     machine. */
  const live = await page.ready(`(() => {
    const d = document.querySelector('.comp[data-on] iframe')?.contentDocument;
    if (!d) return false;
    return [...d.querySelectorAll('.pw-visualiser-bar')]
      .some((el) => parseFloat(el.style.getPropertyValue('--pw-vis-level')) > 0.02);
  })()`, { timeout: 4000, every: 120 });
  if (!live) console.warn('    (the analyser stayed flat, so this shot has a dead display)');
  await page.settle(300);
  return live;
}

const out = join(ROOT, 'shots');
mkdirSync(out, { recursive: true });

const server = await startDemoServer();
let wrote = 0;

await withPage(async (page) => {
  await page.goto(`${server.url}/demo/showcase/index.html?mute`);
  /* The stage has to have been measured before anything is captured, or the
     first shot lands at whatever scale the page booted with. */
  if (!(await page.ready('!!window.showcase && getComputedStyle(document.getElementById("stage")).getPropertyValue("--fit").trim() !== ""'))) {
    throw new Error('the showcase never finished booting, so nothing was shot');
  }
  await page.evaluate('window.showcase.capture(true)');

  for (const comp of comps) {
    await page.evaluate(`window.showcase.show(${JSON.stringify(comp)})`);
    for (const skin of PER_SKIN.has(comp) ? skins : [null]) {
      if (skin) await page.evaluate(`window.showcase.skin(${JSON.stringify(skin)})`);
      for (const theme of PER_SKIN.has(comp) ? themes : ['light']) {
        if (skin) await page.evaluate(`window.showcase.theme(${JSON.stringify(theme)})`);
        /* A style recalc and, for the player, a frame of React. Not a
           network wait: everything this page needs is already local. */
        await page.settle(LIVE.has(comp) ? 1200 : 350);
        if (LIVE.has(comp)) await startPlayer(page);
        const { data } = await page.send('Page.captureScreenshot',
          { format: 'png', captureBeyondViewport: false });
        const name = [comp, skin, skin ? theme : null]
          .filter(Boolean).join('-');
        writeFileSync(join(out, `${name}.png`), Buffer.from(data, 'base64'));
        wrote += 1;
        console.log(`  ${name}.png`);
      }
    }
  }
}, { width: 1920, height: 1080, settle: 400 });

/* The replica, on its own terms. A separate withPage because the device
   metrics are different: the window is the window's real size and the pixel
   ratio does the magnifying. */
if (!clipOnly && (!arg('comp') || arg('comp') === 'classic')) {
  await withPage(async (page) => {
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: CLASSIC.w, height: CLASSIC.h, deviceScaleFactor: CLASSIC.scale, mobile: false,
    });
    await page.goto(`${server.url}/${CLASSIC.page}?mute`);
    /* Both readouts, whatever they are spelling. The clock is five cells and
       the title is however long the track's name is, so a fixed floor of
       twenty was a bet on one particular track being first. */
    if (!(await page.ready(`document.querySelectorAll('.pw-lcd-cell').length >= 10
      && document.querySelectorAll('.pw-transport-button').length >= 5`))) {
      throw new Error('the replica never rendered its readout, so nothing was shot');
    }
    /* The prose above the window is for a reader, not for the shot. */
    await page.evaluate(`document.querySelector('.note').style.display = 'none';
      document.body.style.cssText += ';display:block;padding:0;margin:0;background:#000';
      document.querySelector('.classic-stage').style.margin = '0';`);
    /* Press play, for the same reason the other player comp does: an analyser
       at zero is a picture of a dead player. A real mouse event, because the
       autoplay policy is specifically about trusted ones. */
    const at = await page.evaluate(`(() => {
      const b = document.querySelector('.pw-transport-button[aria-label="Play"]');
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    })()`);
    if (at) {
      for (const type of ['mousePressed', 'mouseReleased']) {
        await page.send('Input.dispatchMouseEvent', {
          type, x: at.x, y: at.y, button: 'left', clickCount: 1,
          buttons: type === 'mousePressed' ? 1 : 0,
        });
      }
      const live = await page.ready(`[...document.querySelectorAll('.pw-visualiser-bar')]
        .some((el) => parseFloat(el.style.getPropertyValue('--pw-vis-level')) > 0.02)`,
        { timeout: 4000, every: 120 });
      if (!live) console.warn('    (the analyser stayed flat, so this shot has a dead display)');
    }
    await page.settle(400);
    const { data } = await page.send('Page.captureScreenshot',
      { format: 'png', captureBeyondViewport: false });
    writeFileSync(join(out, 'classic-275x116.png'), Buffer.from(data, 'base64'));
    wrote += 1;
    console.log(`  classic-275x116.png  (${CLASSIC.w}x${CLASSIC.h} at ${CLASSIC.scale}x)`);
  }, { width: CLASSIC.w, height: CLASSIC.h, settle: 300 });
}

/* The clip: the player comp cycling the four skins while the equaliser,
   volume, and balance move, as frames in shots/clip/ and then a GIF. The
   player's ?drive hooks do the moving, so every frame is the same layout
   and only the look changes. */
if (clipOnly || !arg('comp')) {
  const LOOKS = [['chrome', 'light'], ['cyber', 'dark'], ['paper', 'light'], ['dialup', 'light']];
  const FPS = 15;
  const PER = 1.2;
  const N = Math.round(LOOKS.length * PER * FPS);
  const dir = join(out, 'clip');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  await withPage(async (page) => {
    await page.goto(`${server.url}/demo/showcase/index.html?mute`);
    await page.ready('!!window.showcase && getComputedStyle(document.getElementById("stage")).getPropertyValue("--fit").trim() !== ""');
    await page.evaluate(`window.showcase.capture(true); window.showcase.show('player');
      document.getElementById('player-frame').src = '../player/index.html?bare=1&layout=columns&lock&drive&skin=chrome&theme=light';`);
    await page.settle(500);
    if (!(await page.ready(`(() => {
      const w = document.getElementById('player-frame').contentWindow;
      return !!(w.drive && w.drive.look && w.drive.gains);
    })()`, { timeout: 10000 }))) {
      throw new Error('the player never exposed its drive hooks, so no clip was recorded');
    }
    await startPlayer(page);

    let last = -1;
    for (let k = 0; k < N; k += 1) {
      const t = k / FPS;
      const look = Math.floor(t / PER) % LOOKS.length;
      const gains = Array.from({ length: 10 }, (_, i) => Math.round(9 * Math.sin(2 * Math.PI * (t / 2.4 - i / 10))));
      const volume = Math.round(55 + 30 * Math.sin((2 * Math.PI * t) / 4.8));
      const balance = Math.round(40 * Math.sin((2 * Math.PI * t) / 3.2));
      const [skin, theme] = LOOKS[look];
      /* A new look also steps the playlist, so each skin shows a new title. */
      const swap = look === last ? ''
        : `document.documentElement.dataset.skin = '${skin}'; w.drive.look('${skin}', '${theme}');${k ? ' w.drive.step(1);' : ''}`;
      await page.evaluate(`(() => {
        const w = document.getElementById('player-frame').contentWindow;
        ${swap}
        w.drive.gains(${JSON.stringify(gains)}); w.drive.volume(${volume}); w.drive.balance(${balance});
      })()`);
      last = look;
      await page.settle(60);
      const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(join(dir, `${String(k).padStart(3, '0')}.png`), Buffer.from(data, 'base64'));
    }
  }, { width: 1920, height: 1080, settle: 300 });

  /* Node has no GIF encoder without a dependency, and this is the only thing
     that would want one, so the frames go through Pillow when it is there. */
  const gif = join(out, 'player-clip.gif');
  const py = spawnSync('python3', [join(ROOT, 'scripts', 'build-gif.py'), dir, gif, String(FPS)], { stdio: 'inherit' });
  if (py.status === 0) {
    wrote += 1;
    console.log('  player-clip.gif');
  } else {
    console.warn(`    (no GIF: python3 with Pillow is needed. The ${N} frames are in shots/clip/)`);
  }
}

await server.close();
console.log(`\nshot ${wrote} composition${wrote === 1 ? '' : 's'} into shots/`);
