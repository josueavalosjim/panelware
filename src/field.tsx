/**
 * FORM CONTROLS: checkbox, radio group, select, and the label they share.
 *
 * The kit had none of these, which is a larger gap than it sounds. They are
 * the first thing anyone evaluating a design system looks for, every peer
 * leads with them, and all three are in the Radix package this already
 * depends on.
 *
 * ── The label is the target, not the box ─────────────────────────────────
 * A 20px box is a 20px box however large the hit area around it is, and
 * aiming at one is the difference between a control that works and a control
 * that technically works. Field wraps the pair in a <label>, so the words are
 * clickable too, which is native behaviour people expect and hand-rolled
 * checkboxes routinely lose.
 */
import { Checkbox as RadixCheckbox, RadioGroup as RadixRadioGroup, Select as RadixSelect }
  from 'radix-ui';
import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

import { cx } from './classes.js';
import { Icon } from './icon.js';

export interface FieldProps extends HTMLAttributes<HTMLLabelElement> {
  /** The words beside the control. Clicking them operates it. */
  label: ReactNode;
  /** Put the label before the control instead of after. */
  labelFirst?: boolean;
  children: ReactNode;
}

export function Field({ label, labelFirst, className, children, ...rest }: FieldProps) {
  const text = <span className="pw-label">{label}</span>;
  return (
    <label {...rest} className={cx('pw-field', className)}>
      {labelFirst ? text : null}
      {children}
      {labelFirst ? null : text}
    </label>
  );
}

export type CheckboxProps = ComponentPropsWithoutRef<typeof RadixCheckbox.Root>;

export function Checkbox({ className, ...rest }: CheckboxProps) {
  return (
    <RadixCheckbox.Root {...rest} className={cx('pw-checkbox', className)}>
      <RadixCheckbox.Indicator className="pw-box-indicator">
        {/* Both marks render and CSS shows one, keyed off the data-state
            Radix puts on the indicator. Choosing in JS from the `checked`
            prop only works for a controlled checkbox: an uncontrolled one
            started at defaultChecked="indeterminate" would have shown a
            tick, which is a wrong answer rather than a missing one.

            Indeterminate is a third state and gets its own mark. A minus
            rather than minimize, because minimize sits low in its cell to
            mean a window dropping to the taskbar and a low dash in a
            checkbox reads as a mistake. */}
        <Icon name="check" decorative data-mark="check" />
        <Icon name="minus" decorative data-mark="minus" />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}

export type RadioGroupProps = ComponentPropsWithoutRef<typeof RadixRadioGroup.Root>;

export function RadioGroup({ className, ...rest }: RadioGroupProps) {
  return <RadixRadioGroup.Root {...rest} className={cx('pw-radio-group', className)} />;
}

export type RadioProps = ComponentPropsWithoutRef<typeof RadixRadioGroup.Item>;

export function Radio({ className, ...rest }: RadioProps) {
  return (
    <RadixRadioGroup.Item {...rest} className={cx('pw-radio', className)}>
      <RadixRadioGroup.Indicator className="pw-box-indicator">
        <Icon name="dot" decorative />
      </RadixRadioGroup.Indicator>
    </RadixRadioGroup.Item>
  );
}

export interface SelectProps
  extends Omit<ComponentPropsWithoutRef<typeof RadixSelect.Root>, 'children'> {
  /** Required. A combo box with no name is an unnamed control. */
  label: string;
  placeholder?: string;
  className?: string;
  children: ReactNode;
}

export function Select({ label, placeholder, className, children, ...rest }: SelectProps) {
  return (
    <RadixSelect.Root {...rest}>
      <RadixSelect.Trigger className={cx('pw-select', className)} aria-label={label}>
        {/* Wrapped, because Select.Value does not forward className: styling
            it directly rendered a span with no class and the value column
            never got its ellipsis. */}
        <span className="pw-select-value">
          <RadixSelect.Value placeholder={placeholder} />
        </span>
        {/* A filled triangle, not the chevron. Windows drew dropdown arrows
            as solid triangles from Marlett onward, and a stroked chevron in
            a combo box is the one detail that would date this kit forward by
            fifteen years. */}
        <span className="pw-select-button">
          <Icon name="caret-down" decorative />
        </span>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content className="pw-select-list" position="popper" sideOffset={2}>
          <RadixSelect.Viewport>{children}</RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

export type SelectItemProps = ComponentPropsWithoutRef<typeof RadixSelect.Item>;

export function SelectItem({ className, children, ...rest }: SelectItemProps) {
  return (
    <RadixSelect.Item {...rest} className={cx('pw-select-item', className)}>
      <RadixSelect.ItemIndicator className="pw-select-indicator">
        <Icon name="check" decorative />
      </RadixSelect.ItemIndicator>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
}
