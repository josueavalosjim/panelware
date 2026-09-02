/**
 * Icon name to sheet cell.
 *
 * GENERATED from assets/icon-font.mjs by scripts/build-icons-index.mjs.
 * Do not edit by hand: edit the font data and run `npm run sprites`.
 * test/icons.test.mjs fails if this file has drifted from that source.
 */

export type IconName =
  | 'play' | 'pause' | 'stop' | 'prev' | 'next' | 'eject' | 'close' | 'minimize' | 'maximize' | 'restore' | 'chevron-down' | 'chevron-up' | 'chevron-right' | 'chevron-left' | 'check' | 'bang' | 'dot';

export interface IconCell {
  x: number;
  y: number;
}

export const ICON_INDEX: Record<IconName, IconCell> = {
  'play': { x: 0, y: 0 },
  'pause': { x: 1, y: 0 },
  'stop': { x: 2, y: 0 },
  'prev': { x: 3, y: 0 },
  'next': { x: 4, y: 0 },
  'eject': { x: 5, y: 0 },
  'close': { x: 6, y: 0 },
  'minimize': { x: 7, y: 0 },
  'maximize': { x: 0, y: 1 },
  'restore': { x: 1, y: 1 },
  'chevron-down': { x: 2, y: 1 },
  'chevron-up': { x: 3, y: 1 },
  'chevron-right': { x: 4, y: 1 },
  'chevron-left': { x: 5, y: 1 },
  'check': { x: 6, y: 1 },
  'bang': { x: 7, y: 1 },
  'dot': { x: 0, y: 2 },
};

export const ICON_NAMES: readonly IconName[] = [
  'play',
  'pause',
  'stop',
  'prev',
  'next',
  'eject',
  'close',
  'minimize',
  'maximize',
  'restore',
  'chevron-down',
  'chevron-up',
  'chevron-right',
  'chevron-left',
  'check',
  'bang',
  'dot',
];
