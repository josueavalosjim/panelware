/**
 * ICON.
 *
 * A cell on the 16x16 sheet, painted in `currentColor` through a mask.
 *
 * The only interesting thing this component does is refuse to let an icon be
 * the whole meaning of a control. `decorative` is the default and renders
 * aria-hidden, because the overwhelmingly common case is an icon beside a
 * word, and announcing "check Connected" is worse than "Connected". An icon
 * carrying meaning on its own has to pass a `label`, and then it renders with
 * role="img" and that name.
 *
 * Neither of those is optional or inferrable, which is why the prop is
 * required-by-shape rather than a boolean with a default that would be wrong
 * half the time.
 */
import type { HTMLAttributes } from 'react';

import { cx } from './classes.js';
import { ICON_INDEX, type IconName } from './icons.js';

export type IconProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  name: IconName;
} & (
  | { label: string; decorative?: false }
  | { label?: never; decorative: true }
);

export function Icon({ name, label, decorative, className, ...rest }: IconProps) {
  const cell = ICON_INDEX[name];
  return (
    <span
      {...rest}
      className={cx('pw-icon', className)}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? 'true' : undefined}
      style={{
        ['--pw-icon-x' as string]: cell.x,
        ['--pw-icon-y' as string]: cell.y,
        /* Unitless, because the stylesheet owns every pixel dimension and
           taste-check's treatments check would flag a px literal arriving
           through markup. A component that wants an even optical gap beside
           a word multiplies these; one that does not, ignores them. */
        ['--pw-icon-ink-l' as string]: cell.l,
        ['--pw-icon-ink-r' as string]: cell.r,
        /* The caller last, so these can be overridden rather than silently
           dropped. One caller needs to: an icon the CSS animates is not
           showing the cell it names, so the cell's own bearings are wrong for
           it. See spinner.tsx. Before this, a style prop passed to Icon was
           spread in above and then clobbered here without a word. */
        ...rest.style,
      }}
    />
  );
}
