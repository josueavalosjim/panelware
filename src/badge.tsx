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
  warning: 'exclamation',
  error: 'close',
  neutral: 'dot',
};

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  status?: BadgeStatus;
  /** Overrides the default mark. Decorative either way: the word carries it. */
  glyph?: ReactNode;
  /**
   * Required. The word. A badge with a mark and no word IS the coloured dot
   * this component exists to forbid, and `children` inherited from
   * HTMLAttributes is optional, so `<Badge status="error" />` type-checked and
   * rendered exactly that.
   */
  children: ReactNode;
}

export function Badge({ status = 'neutral', glyph, className, children, ...rest }: BadgeProps) {
  return (
    <span {...rest} className={cx('pw-badge', className)} data-status={status}>
      {/* Decorative, because the word beside it already says this. A screen
          reader announcing "check Connected" is worse than "Connected".

          `||` rather than `??`, and that is not a slip to tidy up. `??` falls
          back on null and undefined only, so glyph={false} passed through as a
          renderable nothing and the badge came out with no mark at all: the
          other half of the rule in the header, and the one a caller reaches by
          accident rather than on purpose. `||` treats false and the empty
          string as "no mark given" too, which is the only answer consistent
          with a caller who wants none not being allowed to have none. */}
      {glyph || <Icon name={GLYPH[status]} decorative />}
      {children}
    </span>
  );
}
