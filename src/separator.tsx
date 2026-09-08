/**
 * SEPARATOR.
 *
 * A line between things, and the only component that reads
 * --pw-color-divider, which is the token's whole reason for existing: it was
 * declared in every palette from the beginning and read by nothing.
 *
 * `decorative` is the default and it is the right default. A rule drawn to
 * group things visually is presentation, and announcing "separator" between
 * every pair of sections is noise a screen reader user has to sit through.
 * Pass `decorative={false}` for the case where the line genuinely carries
 * meaning the words do not, which is rare and worth having to ask for.
 */
import { Separator as RadixSeparator } from 'radix-ui';
import type { ComponentPropsWithoutRef } from 'react';

import { cx } from './classes.js';

export type SeparatorProps = ComponentPropsWithoutRef<typeof RadixSeparator.Root>;

export function Separator({ className, decorative = true, ...rest }: SeparatorProps) {
  return (
    <RadixSeparator.Root
      {...rest}
      decorative={decorative}
      className={cx('pw-separator', className)}
    />
  );
}
