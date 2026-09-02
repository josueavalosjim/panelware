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
}

export const ICON_INDEX: Record<IconName, IconCell> = {
  'play': { x: 0, y: 0 },
  'pause': { x: 1, y: 0 },
  'stop': { x: 2, y: 0 },
  'previous': { x: 3, y: 0 },
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
  'exclamation': { x: 7, y: 1 },
  'dot': { x: 0, y: 2 },
  'minus': { x: 1, y: 2 },
  'plus': { x: 2, y: 2 },
  'caret-down': { x: 3, y: 2 },
  'search': { x: 4, y: 2 },
  'info': { x: 5, y: 2 },
  'question': { x: 6, y: 2 },
  'ellipsis': { x: 7, y: 2 },
  'spinner-1': { x: 0, y: 3 },
  'spinner-2': { x: 1, y: 3 },
  'spinner-3': { x: 2, y: 3 },
  'spinner-4': { x: 3, y: 3 },
  'spinner-5': { x: 4, y: 3 },
  'spinner-6': { x: 5, y: 3 },
  'spinner-7': { x: 6, y: 3 },
  'spinner-8': { x: 7, y: 3 },
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
