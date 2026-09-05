/**
 * SPINNER.
 *
 * No Radix primitive, because there is no interaction. It is a busy
 * indicator: a sheet cell stepped through eight frames by CSS, and a word.
 *
 * The word is not optional and it is not decoration. A spinner alone says
 * "something is happening" to anyone who can see it and nothing at all to
 * anyone who cannot, so this renders role="status" with a visually hidden
 * label, which is announced when it appears. The default is "Loading", and a
 * caller who knows what is loading should say so.
 *
 * It stays a live region because the text is fixed. The readout deliberately
 * defaults its live region OFF, and the difference is that a clock changes
 * every second and floods a screen reader, while this string is written once
 * and never rewritten.
 *
 * The bearings are the subtle part. Every icon declares how much blank sits
 * inside its cell on each side, and a badge multiplies those into negative
 * margins so the optical gap beside a word is even. This element names one
 * cell and paints eight, because the CSS walks the whole row, so the cell's
 * own bearings describe a frame that is on screen an eighth of the time. It
 * named spinner-1, whose ink starts 7 in, while the frames it actually paints
 * mostly start 2 in: a spinner in a badge was pulled 5px into the word beside
 * it, for seven frames out of eight.
 *
 * Animating the bearings frame by frame is the wrong repair. The dots rotate
 * and their extremes move, so a per-frame bearing would shuffle the whole
 * element left and right eight times a second next to fixed text. A busy
 * indicator has to sit still. So it declares the one bearing that is true of
 * every frame, which is the tightest common to all eight, and the pull is
 * then correct for the frames that have it and conservative for the rest.
 * Erring tight is the safe direction: too small a bearing leaves a hair of
 * extra gap, too large a one puts the ink through the text.
 */
import type { HTMLAttributes } from 'react';

import { cx } from './classes.js';
import { Icon } from './icon.js';
import { ICON_INDEX, ICON_NAMES, type IconName } from './icons.js';

const FRAMES = ICON_NAMES.filter((n): n is IconName => n.startsWith('spinner-'));

/** The blank every frame has, so the badge's pull is never more than the ink allows. */
const shared = (side: 'l' | 'r') => Math.min(...FRAMES.map((n) => ICON_INDEX[n][side]));

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Announced when the spinner appears. Say what is loading, if you know. */
  label?: string;
}

export function Spinner({ label = 'Loading', className, ...rest }: SpinnerProps) {
  return (
    <span {...rest} className={cx('pw-spinner', className)} role="status">
      {/* The frame the animation starts from. Which one it is does not
          matter to the CSS, which walks the whole row from column 0, but it
          has to be a spinner cell so the row is right. Its bearings do not
          survive that walk, so they are replaced with the ones every frame
          shares rather than left describing the cell this happens to name. */}
      <Icon
        name="spinner-1"
        decorative
        style={{
          ['--pw-icon-ink-l' as string]: shared('l'),
          ['--pw-icon-ink-r' as string]: shared('r'),
        }}
      />
      <span className="pw-sr-only">{label}</span>
    </span>
  );
}
