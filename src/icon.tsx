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
      }}
    />
  );
}
