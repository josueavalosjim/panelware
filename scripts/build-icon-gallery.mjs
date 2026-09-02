/**
 * Rewrites the icon gallery in demo/states.html.
 *
 * The gallery is one cell per icon, twice: at scale 1 and at scale 2. It was
 * hand-written, and it had already gone stale before anyone noticed, listing
 * seventeen of the nineteen icons that existed. That is the same failure
 * src/icons.ts is generated to avoid, and the same argument applies harder
 * here: the miss is silent, because a gallery that omits a glyph looks
 * exactly like a gallery that is complete.
 *
 * The page stays zero-JavaScript, which is what the runtime palette gate
 * loads, so this writes real markup into the file rather than rendering at
 * run time. test/icons.test.mjs fails if the committed HTML has drifted.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ICON_COLS, ICON_ORDER } from '../assets/icon-font.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = join(HERE, '..', 'demo', 'states.html');

const START = '<!-- icons:start -->';
const END = '<!-- icons:end -->';

export function gallery() {
  const cells = ICON_ORDER.map((name, i) => `          <span class="demo-icon-cell">
            <span class="pw-icon" style="--pw-icon-x: ${i % ICON_COLS}; --pw-icon-y: ${Math.floor(i / ICON_COLS)}"></span>
            <span class="demo-icon-name">${name}</span>
          </span>`).join('\n');

  return `      <div class="demo-row demo-icons">
${cells}
      </div>
      <div class="demo-row demo-icons" style="--pw-icon-scale: 2">
${cells}
      </div>`;
}

export function withGallery(html) {
  const a = html.indexOf(START);
  const b = html.indexOf(END);
  if (a < 0 || b < 0) throw new Error(`demo/states.html is missing ${START} / ${END}`);
  return `${html.slice(0, a + START.length)}\n${gallery()}\n      ${html.slice(b)}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(PAGE, withGallery(readFileSync(PAGE, 'utf8')));
}
