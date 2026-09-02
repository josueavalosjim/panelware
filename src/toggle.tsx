/**
 * TOGGLE.
 *
 * The whole difference from a button is that :active is momentary and
 * [data-state="on"] is not. Radix gives the second for free, along with
 * aria-pressed, which the CSS also keys off so the two can never disagree.
 */
import { Toggle as RadixToggle } from 'radix-ui';
import type { ComponentPropsWithoutRef } from 'react';

import { cx, flag } from './classes.js';

export interface ToggleProps
  extends ComponentPropsWithoutRef<typeof RadixToggle.Root> {
  gloss?: boolean;
}

export function Toggle({ gloss, className, children, ...rest }: ToggleProps) {
  return (
    <RadixToggle.Root
      {...rest}
      className={cx('pw-toggle', className)}
      data-gloss={flag(gloss)}
    >
      {children}
    </RadixToggle.Root>
  );
}
