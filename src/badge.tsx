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

export type BadgeStatus = 'success' | 'warning' | 'error' | 'neutral';

const GLYPH: Record<BadgeStatus, string> = {
  success: '✓',
  warning: '!',
  error: '×',
  neutral: '•',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatus;
  /** Overrides the default mark. Decorative either way: the word carries it. */
  glyph?: ReactNode;
}

export function Badge({ status = 'neutral', glyph, className, children, ...rest }: BadgeProps) {
  return (
    <span {...rest} className={cx('pw-badge', className)} data-status={status}>
      {/* aria-hidden, because the word beside it already says this. A screen
          reader announcing "check Connected" is worse than "Connected". */}
      <span className="pw-badge-glyph" aria-hidden="true">
        {glyph ?? GLYPH[status]}
      </span>
      {children}
    </span>
  );
}
