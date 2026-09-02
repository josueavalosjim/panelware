/**
 * MENU BAR.
 *
 * Radix Menubar, which is in the same package the rest of the kit already
 * depends on, so the whole keyboard model arrives free: arrow keys between
 * triggers, Enter or Down to open, arrows inside a menu, Escape to close,
 * typeahead, and the roving tabindex that makes the bar one tab stop instead
 * of five. Owning any of that by hand would be weeks and would be worse.
 *
 * What this adds is the parts a menu needs and a primitive cannot supply.
 *
 * The left gutter is reserved on every item, not only checkable ones. A menu
 * whose labels shift sideways because one item happens to have a tick is a
 * menu that moves under the pointer between openings.
 *
 * A shortcut is rendered inside the item, not beside it, and marked
 * aria-hidden. The keystroke is a hint for someone reading the menu; a screen
 * reader announcing "Open Control O" turns the label into a sentence that
 * does not parse. The real binding belongs to the application, not to a span.
 */
import { Menubar as RadixMenubar } from 'radix-ui';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cx } from './classes.js';
import { Icon } from './icon.js';

export type MenubarProps = ComponentPropsWithoutRef<typeof RadixMenubar.Root>;

export function Menubar({ className, ...rest }: MenubarProps) {
  return <RadixMenubar.Root {...rest} className={cx('pw-menubar', className)} />;
}

export const Menu = RadixMenubar.Menu;

export type MenuTriggerProps = ComponentPropsWithoutRef<typeof RadixMenubar.Trigger>;

export function MenuTrigger({ className, ...rest }: MenuTriggerProps) {
  return <RadixMenubar.Trigger {...rest} className={cx('pw-menubar-trigger', className)} />;
}

export type MenuContentProps = ComponentPropsWithoutRef<typeof RadixMenubar.Content>;

export function MenuContent({ className, ...rest }: MenuContentProps) {
  return (
    <RadixMenubar.Portal>
      <RadixMenubar.Content
        {...rest}
        className={cx('pw-menu', className)}
        /* Far enough that the menu clears the trigger's own row rather than
           sitting on its bottom edge, which at a 44px control reads as the
           trigger having grown rather than as a menu having opened. */
        sideOffset={2}
      />
    </RadixMenubar.Portal>
  );
}

export interface MenuItemProps
  extends ComponentPropsWithoutRef<typeof RadixMenubar.Item> {
  /** The keystroke, shown but never announced. */
  shortcut?: string;
}

export function MenuItem({ shortcut, className, children, ...rest }: MenuItemProps) {
  return (
    <RadixMenubar.Item {...rest} className={cx('pw-menu-item', className)}>
      {children}
      {shortcut ? <span className="pw-menu-shortcut" aria-hidden="true">{shortcut}</span> : null}
    </RadixMenubar.Item>
  );
}

export interface MenuCheckboxItemProps
  extends ComponentPropsWithoutRef<typeof RadixMenubar.CheckboxItem> {
  shortcut?: string;
}

export function MenuCheckboxItem({
  shortcut, className, children, ...rest
}: MenuCheckboxItemProps) {
  return (
    <RadixMenubar.CheckboxItem {...rest} className={cx('pw-menu-item', className)}>
      {/* Radix renders the indicator only when checked, which is what keeps
          the gutter empty rather than holding a hidden mark. The gutter's
          width is reserved in CSS regardless. */}
      <RadixMenubar.ItemIndicator className="pw-menu-indicator">
        <Icon name="check" decorative />
      </RadixMenubar.ItemIndicator>
      {children}
      {shortcut ? <span className="pw-menu-shortcut" aria-hidden="true">{shortcut}</span> : null}
    </RadixMenubar.CheckboxItem>
  );
}

export const MenuRadioGroup = RadixMenubar.RadioGroup;

export type MenuRadioItemProps = ComponentPropsWithoutRef<typeof RadixMenubar.RadioItem>;

export function MenuRadioItem({ className, children, ...rest }: MenuRadioItemProps) {
  return (
    <RadixMenubar.RadioItem {...rest} className={cx('pw-menu-item', className)}>
      <RadixMenubar.ItemIndicator className="pw-menu-indicator">
        <Icon name="dot" decorative />
      </RadixMenubar.ItemIndicator>
      {children}
    </RadixMenubar.RadioItem>
  );
}

export type MenuSeparatorProps = ComponentPropsWithoutRef<typeof RadixMenubar.Separator>;

export function MenuSeparator({ className, ...rest }: MenuSeparatorProps) {
  return <RadixMenubar.Separator {...rest} className={cx('pw-menu-separator', className)} />;
}

export type MenuLabelProps = ComponentPropsWithoutRef<typeof RadixMenubar.Label>;

export function MenuLabel({ className, ...rest }: MenuLabelProps) {
  return <RadixMenubar.Label {...rest} className={cx('pw-menu-label', className)} />;
}

export interface MenuSubProps {
  label: ReactNode;
  children: ReactNode;
}

export function MenuSub({ label, children }: MenuSubProps) {
  return (
    <RadixMenubar.Sub>
      <RadixMenubar.SubTrigger className="pw-menu-item">
        {label}
        {/* The chevron is the only reliable sign an item opens rather than
            acts, and it is decorative because Radix already sets
            aria-haspopup on the trigger. */}
        <span className="pw-menu-shortcut" aria-hidden="true">
          <Icon name="chevron-right" decorative />
        </span>
      </RadixMenubar.SubTrigger>
      <RadixMenubar.Portal>
        <RadixMenubar.SubContent className="pw-menu" sideOffset={2} alignOffset={-4}>
          {children}
        </RadixMenubar.SubContent>
      </RadixMenubar.Portal>
    </RadixMenubar.Sub>
  );
}
