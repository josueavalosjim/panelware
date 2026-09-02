/**
 * STATUS BADGE.
 *
 * No Radix primitive, because there is no interaction to own. It is a span.
 *
 * The one thing this component exists to enforce is that a status is never a
 * coloured dot. Every badge renders a glyph AND a word, and the glyph has a
 * default per status so the easy path is the correct one. A caller who wants
 * a different mark passes one; a caller who wants none cannot have none.
 */
import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from './classes.js';
import { Icon } from './icon.js';
import type { IconName } from './icons.js';

export type BadgeStatus = 'success' | 'warning' | 'error' | 'neutral';

/* Sheet cells, not characters. These were '✓', '!', '×' and '•' taken from
   whatever font the consumer's page happened to be using, which meant the
   mark changed shape per platform, had no pixel grid, and sat on a different
   baseline in every stack. */
const GLYPH: Record<BadgeStatus, IconName> = {
  success: 'check',
  warning: 'bang',
  error: 'close',
  neutral: 'dot',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatus;
  /** Overrides the default mark. Decorative either way: the word carries it. */
  glyph?: ReactNode;
}

export function Badge({ status = 'neutral', glyph, className, children, ...rest }: BadgeProps) {
  return (
    <span {...rest} className={cx('pw-badge', className)} data-status={status}>
      {/* Decorative, because the word beside it already says this. A screen
          reader announcing "check Connected" is worse than "Connected". */}
      {glyph ?? <Icon name={GLYPH[status]} decorative />}
      {children}
    </span>
  );
}
