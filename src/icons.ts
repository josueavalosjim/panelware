/**
 * Icon name to sheet cell.
 *
 * GENERATED from assets/icon-font.mjs by scripts/build-icons-index.mjs.
 * Do not edit by hand: edit the font data and run `npm run sprites`.
 * test/icons.test.mjs fails if this file has drifted from that source.
 */

export type IconName =
  | 'play' | 'pause' | 'stop' | 'previous' | 'next' | 'eject' | 'close' | 'minimize' | 'maximize' | 'restore' | 'chevron-down' | 'chevron-up' | 'chevron-right' | 'chevron-left' | 'check' | 'exclamation' | 'dot' | 'minus' | 'plus' | 'caret-down' | 'search' | 'info' | 'question' | 'ellipsis' | 'spinner-1' | 'spinner-2' | 'spinner-3' | 'spinner-4' | 'spinner-5' | 'spinner-6' | 'spinner-7' | 'spinner-8';

export interface IconCell {
  x: number;
  y: number;
  /** Empty cell columns to the left of the ink, and to the right. */
  l: number;
  r: number;
}

export const ICON_INDEX: Record<IconName, IconCell> = {
  'play': { x: 0, y: 0, l: 5, r: 4 },
  'pause': { x: 1, y: 0, l: 4, r: 4 },
  'stop': { x: 2, y: 0, l: 4, r: 4 },
  'previous': { x: 3, y: 0, l: 2, r: 4 },
  'next': { x: 4, y: 0, l: 4, r: 2 },
  'eject': { x: 5, y: 0, l: 2, r: 2 },
  'close': { x: 6, y: 0, l: 3, r: 3 },
  'minimize': { x: 7, y: 0, l: 3, r: 3 },
  'maximize': { x: 0, y: 1, l: 3, r: 3 },
  'restore': { x: 1, y: 1, l: 2, r: 2 },
  'chevron-down': { x: 2, y: 1, l: 2, r: 2 },
  'chevron-up': { x: 3, y: 1, l: 2, r: 2 },
  'chevron-right': { x: 4, y: 1, l: 4, r: 5 },
  'chevron-left': { x: 5, y: 1, l: 5, r: 4 },
  'check': { x: 6, y: 1, l: 2, r: 2 },
  'exclamation': { x: 7, y: 1, l: 7, r: 7 },
  'dot': { x: 0, y: 2, l: 5, r: 5 },
  'minus': { x: 1, y: 2, l: 3, r: 3 },
  'plus': { x: 2, y: 2, l: 3, r: 3 },
  'caret-down': { x: 3, y: 2, l: 3, r: 3 },
  'search': { x: 4, y: 2, l: 3, r: 2 },
  'info': { x: 5, y: 2, l: 7, r: 7 },
  'question': { x: 6, y: 2, l: 4, r: 4 },
  'ellipsis': { x: 7, y: 2, l: 3, r: 3 },
  'spinner-1': { x: 0, y: 3, l: 7, r: 2 },
  'spinner-2': { x: 1, y: 3, l: 4, r: 2 },
  'spinner-3': { x: 2, y: 3, l: 2, r: 2 },
  'spinner-4': { x: 3, y: 3, l: 2, r: 4 },
  'spinner-5': { x: 4, y: 3, l: 2, r: 7 },
  'spinner-6': { x: 5, y: 3, l: 2, r: 4 },
  'spinner-7': { x: 6, y: 3, l: 2, r: 2 },
  'spinner-8': { x: 7, y: 3, l: 4, r: 2 },
};

export const ICON_NAMES: readonly IconName[] = [
  'play',
  'pause',
  'stop',
  'previous',
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
  'exclamation',
  'dot',
  'minus',
  'plus',
  'caret-down',
  'search',
  'info',
  'question',
  'ellipsis',
  'spinner-1',
  'spinner-2',
  'spinner-3',
  'spinner-4',
  'spinner-5',
  'spinner-6',
  'spinner-7',
  'spinner-8',
];
