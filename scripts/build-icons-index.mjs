/**
 * Writes src/icons.ts from assets/icon-font.mjs.
 *
 * The icon set exists twice in this repo: as bitmap rows in assets/, which is
 * plain ESM so the sheet generator and its tests can run with no build, and
 * as a name-to-cell map in src/, which is TypeScript compiled out of rootDir.
 * Importing across that line would pull the whole asset directory into dist.
 *
 * The readout solved the same problem by restating its orders in TypeScript
 * and adding a test that compares them. That works because there are two
 * short strings. Seventeen name-and-coordinate pairs is where a hand-kept
 * copy stops being reasonable: the failure mode is not an error, it is every
 * icon after the changed one rendering as its neighbour.
 *
 * So this one is generated, and the test still compares the output to the
 * source, because a generator that is never run is a hand-kept copy again.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ICON_COLS, ICON_ORDER, ICON_W, iconRects } from '../assets/icon-font.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * How much empty cell sits either side of a glyph's ink.
 *
 * Every icon is a 16x16 cell and almost none of them fill it. The check is 12
 * pixels of ink with 2 either side; the exclamation is 2 with 7. Laid out with
 * one gap value they are mechanically identical and optically nothing alike:
 * measured in the badge row, the same 8px padding and 4px gap produced a 10px
 * inset before the check and 15px before the exclamation, and a 6px gap after
 * one against 11px after the other.
 *
 * The sheet already knows this, so it may as well say it. A component placing
 * a mark beside a word can subtract the bearing and get an even optical gap
 * without hard-coding anything about which mark it was given.
 */
function bearings(name) {
  const rects = iconRects(name);
  if (!rects.length) return { l: 0, r: 0 };
  const left = Math.min(...rects.map((r) => r.x));
  const right = Math.max(...rects.map((r) => r.x + r.w));
  return { l: left, r: ICON_W - right };
}

export function iconsIndex() {
  const union = ICON_ORDER.map((n) => `'${n}'`).join(' | ');
  const entries = ICON_ORDER
    .map((n, i) => {
      const b = bearings(n);
      return `  '${n}': { x: ${i % ICON_COLS}, y: ${Math.floor(i / ICON_COLS)}, l: ${b.l}, r: ${b.r} },`;
    })
    .join('\n');
  const names = ICON_ORDER.map((n) => `  '${n}',`).join('\n');

  return `/**
 * Icon name to sheet cell.
 *
 * GENERATED from assets/icon-font.mjs by scripts/build-icons-index.mjs.
 * Do not edit by hand: edit the font data and run \`npm run sprites\`.
 * test/icons.test.mjs fails if this file has drifted from that source.
 */

export type IconName =
  | ${union};

export interface IconCell {
  x: number;
  y: number;
  /** Empty cell columns to the left of the ink, and to the right. */
  l: number;
  r: number;
}

export const ICON_INDEX: Record<IconName, IconCell> = {
${entries}
};

export const ICON_NAMES: readonly IconName[] = [
${names}
];
`;
}

/**
 * The same index again, as CSS, so an icon can be named from markup.
 *
 * <Icon name="check"> looks the cell up and writes --pw-icon-x and
 * --pw-icon-y as inline style. Hand-written markup had no way to do that: the
 * mapping lived only in src/icons.ts, which is TypeScript, which CSS cannot
 * read. So the CSS-only half of this kit, which is the half the architecture
 * was built for, had to carry sprite coordinates by hand and get them from
 * reading the source of a generated file.
 *
 * <span class="pw-icon" data-icon="check"> now does it. Same numbers, same
 * generator, one source.
 *
 * The bearings come along because the component sets them too, and an icon
 * that positioned correctly and sat wrong beside a word would be a worse bug
 * than the one this fixes: it would look almost right.
 *
 * Specificity is deliberate and the ordering falls out of it. The rule below
 * is (0,2,0) and the .pw-icon defaults are (0,1,0), so a data-icon attribute
 * overrides the defaults.
 *
 * The React component used to push all four numbers inline instead, and that
 * had to stop before a skin could carry its own sheet. An inline style beats
 * every layer, pw.overrides included, so a second sheet whose glyphs have
 * different ink extents could not correct its bearings under React: the first
 * sheet's numbers were welded into the markup. The component now renders
 * data-icon and reads this file, which is also one fewer difference between
 * the React path and the CSS-only one.
 *
 * The spinner is the reason the generator emits a rule of its own below. Its
 * frame names a cell whose bearings do not survive the animation, and it used
 * to replace them inline for the same reason everything else did.
 */
export function iconsCss() {
  const rules = ICON_ORDER.map((n, i) => {
    const b = bearings(n);
    return `  .pw-icon[data-icon="${n}"] {\n` +
      `    --pw-icon-x: ${i % ICON_COLS};\n` +
      `    --pw-icon-y: ${Math.floor(i / ICON_COLS)};\n` +
      `    --pw-icon-ink-l: ${b.l};\n` +
      `    --pw-icon-ink-r: ${b.r};\n` +
      '  }';
  }).join('\n\n');

  /* The spinner walks a whole row from column 0, so the cell it names is not
     the cell it shows and that cell's bearings are wrong for it. The tightest
     bearing common to all eight frames is true of every frame it passes
     through, and erring tight is the safe direction: too small leaves a hair
     of extra gap, too large puts the ink through the text.

     At (0,2,0) this ties with the data-icon rule above and wins on order, so
     it has to stay after it. */
  const frames = ICON_ORDER.filter((n) => n.startsWith('spinner-'));
  const shared = (side) => Math.min(...frames.map((n) => bearings(n)[side]));
  const spinner = `  .pw-spinner .pw-icon {\n` +
    `    --pw-icon-ink-l: ${shared('l')};\n` +
    `    --pw-icon-ink-r: ${shared('r')};\n` +
    '  }';

  return `/**
 * Icon name to sheet cell, as CSS.
 *
 * GENERATED from assets/icon-font.mjs by scripts/build-icons-index.mjs.
 * Do not edit by hand: edit the font data and run \`npm run generate\`.
 * test/icons.test.mjs fails if this file has drifted from that source, and
 * check:cssom asks the browser whether each rule resolves to the cell the
 * index names, because a selector that matches nothing renders cell 0,0
 * rather than an error.
 *
 * This is the CSS-only half of what the Icon component does inline. See the
 * generator for why both exist and how they order against each other.
 */

@layer pw.components {
${rules}

${spinner}
}
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(join(HERE, '..', 'src', 'icons.ts'), iconsIndex());
  writeFileSync(join(HERE, '..', 'css', 'components', 'icon-index.css'), iconsCss());
  console.log(`src/icons.ts    ${ICON_ORDER.length} icons`);
  console.log(`css/components/icon-index.css  ${ICON_ORDER.length} named cells`);
}
