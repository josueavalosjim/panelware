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

import { ICON_COLS, ICON_ORDER } from '../assets/icon-font.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

export function iconsIndex() {
  const union = ICON_ORDER.map((n) => `'${n}'`).join(' | ');
  const entries = ICON_ORDER
    .map((n, i) => `  '${n}': { x: ${i % ICON_COLS}, y: ${Math.floor(i / ICON_COLS)} },`)
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
}

export const ICON_INDEX: Record<IconName, IconCell> = {
${entries}
};

export const ICON_NAMES: readonly IconName[] = [
${names}
];
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(join(HERE, '..', 'src', 'icons.ts'), iconsIndex());
  console.log(`src/icons.ts    ${ICON_ORDER.length} icons`);
}
