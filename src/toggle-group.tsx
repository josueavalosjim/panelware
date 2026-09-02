/**
 * TOGGLE GROUP.
 *
 * Several toggles that are one choice: a segmented control.
 *
 * Radix ToggleGroup with type="single" renders role="radiogroup" and its
 * items as role="radio" with aria-checked, plus a roving tabindex, so the
 * group is one tab stop and the arrow keys move within it. That is the
 * correct pattern and it is not the one that is usually reached for.
 *
 * The obvious wrong answer is Tabs, and it was the first thing this kit's own
 * documentation used for its theme switcher. A tablist whose tabs control no
 * tabpanel is an orphaned pattern: every trigger carries aria-controls
 * pointing at nothing, which is a defect an audit flags and a screen reader
 * announces as a broken relationship. Tabs show one of several panels. A
 * segmented control chooses one of several values. They look identical and
 * mean different things.
 */
import { ToggleGroup as RadixToggleGroup } from 'radix-ui';
import type { ComponentPropsWithoutRef, HTMLAttributes } from 'react';

import { cx } from './classes.js';

export interface ToggleGroupProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'dir'> {
  /** Required. A group of controls needs a name. */
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  /** Whether the arrow keys wrap at the ends. */
  loop?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

/* The props are declared rather than inherited from Radix's Root, whose type
   is a union of the single and multiple variants. Spreading through that
   union loses the discriminant and TypeScript rejects the result. Writing the
   surface out is also the better shape for a consumer: this component is
   always single-select, and a type that admits `type="multiple"` in its
   signature while ignoring it would be lying. */
export function ToggleGroup({ label, className, ...rest }: ToggleGroupProps) {
  return (
    <RadixToggleGroup.Root
      {...rest}
      type="single"
      className={cx('pw-toggle-group', className)}
      aria-label={label}
    />
  );
}

export type ToggleGroupItemProps =
  ComponentPropsWithoutRef<typeof RadixToggleGroup.Item>;

export function ToggleGroupItem({ className, ...rest }: ToggleGroupItemProps) {
  /* The same class as a standalone toggle. A segmented item and a lone
     toggle are the same control wearing the same skin; only the semantics
     differ, and those come from Radix. */
  return <RadixToggleGroup.Item {...rest} className={cx('pw-toggle', className)} />;
}
