/**
 * SWITCH.
 *
 * Not a toggle, and the kit now ships both, so the difference is worth
 * stating where somebody choosing between them will read it.
 *
 * A toggle is a button that stays pressed. It answers "is this mode on", it
 * carries a label inside itself, and its own face is the state. A switch is a
 * thing you throw: the label sits beside it, and the state is where the thumb
 * is. In ARIA that is aria-pressed against aria-checked, and a screen reader
 * says "pressed" for one and "on" for the other, which is the same
 * distinction from the other end.
 *
 * The practical rule: if it belongs in a toolbar, it is a toggle. If it
 * belongs in a settings list with words to its left, it is a switch.
 */
import { Switch as RadixSwitch } from 'radix-ui';
import type { ComponentPropsWithoutRef } from 'react';

import { cx } from './classes.js';

export type SwitchProps = ComponentPropsWithoutRef<typeof RadixSwitch.Root>;

export function Switch({ className, ...rest }: SwitchProps) {
  return (
    <RadixSwitch.Root {...rest} className={cx('pw-switch', className)}>
      <RadixSwitch.Thumb className="pw-switch-thumb" />
    </RadixSwitch.Root>
  );
}
