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
import type { IconName } from './icons.js';

export type IconProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  name: IconName;
} & (
  | { label: string; decorative?: false }
  | { label?: never; decorative: true }
);

export function Icon({ name, label, decorative, className, ...rest }: IconProps) {
  return (
    <span
      {...rest}
      className={cx('pw-icon', className)}
      /* The cell and its bearings come from css/components/icon-index.css,
         which is generated from the same font data this component used to
         read. They were pushed inline here, and that had to stop: an inline
         style beats every layer, pw.overrides included, so a skin carrying
         its own sprite sheet could not correct the bearings its glyphs
         needed. The first sheet's numbers were welded into the markup.

         It also means the React path and the CSS-only path are now the same
         path. Hand-written markup has always said data-icon; this says it
         too, matches the same (0,2,0) rule, and there is one place where an
         icon's numbers live. */
      data-icon={name}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? 'true' : undefined}
    />
  );
}
