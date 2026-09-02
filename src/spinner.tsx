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
 */
import type { HTMLAttributes } from 'react';

import { cx } from './classes.js';
import { Icon } from './icon.js';

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Announced when the spinner appears. Say what is loading, if you know. */
  label?: string;
}

export function Spinner({ label = 'Loading', className, ...rest }: SpinnerProps) {
  return (
    <span {...rest} className={cx('pw-spinner', className)} role="status">
      {/* The frame the animation starts from. Which one it is does not
          matter to the CSS, which walks the whole row, but it has to be a
          spinner cell so the row is right. */}
      <Icon name="spinner-1" decorative />
      <span className="pw-sr-only">{label}</span>
    </span>
  );
}
