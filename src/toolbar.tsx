/**
 * TOOLBAR.
 *
 * One tab stop with the arrow keys moving inside it, which is the whole
 * reason to reach for this rather than a <div> of buttons. Eleven buttons in
 * a plain row is eleven tab stops, and eleven tab stops between somebody and
 * the next thing on the page is how a keyboard user learns to route around a
 * toolbar entirely.
 *
 * Transport is this primitive with a fixed set of playback buttons in it, and
 * has been since before this was exported. That is the argument for exporting
 * it: the skin and the behaviour were already built and proved, and the only
 * thing missing was the general shape.
 *
 * ToolbarButton wears .pw-button rather than a class of its own. A button in
 * a toolbar is a button; giving it a second name would mean a second set of
 * rules to keep in step with the first for no visual difference.
 */
import { Toolbar as RadixToolbar } from 'radix-ui';
import type { ComponentPropsWithoutRef } from 'react';

import { cx, flag } from './classes.js';

export interface ToolbarProps
  extends Omit<ComponentPropsWithoutRef<typeof RadixToolbar.Root>, 'aria-label'> {
  /** Required. A toolbar with no name is an unnamed group of controls. */
  label: string;
}

export function Toolbar({ label, className, ...rest }: ToolbarProps) {
  return <RadixToolbar.Root {...rest} aria-label={label} className={cx('pw-toolbar', className)} />;
}

export interface ToolbarButtonProps
  extends ComponentPropsWithoutRef<typeof RadixToolbar.Button> {
  variant?: 'default' | 'primary';
  gloss?: boolean;
}

export function ToolbarButton({ variant, gloss, className, ...rest }: ToolbarButtonProps) {
  return (
    <RadixToolbar.Button
      {...rest}
      className={cx('pw-button', className)}
      data-variant={variant === 'primary' ? 'primary' : undefined}
      data-gloss={flag(gloss)}
    />
  );
}

export type ToolbarSeparatorProps = ComponentPropsWithoutRef<typeof RadixToolbar.Separator>;

/** The same rule the standalone Separator draws, inside the roving tabindex. */
export function ToolbarSeparator({ className, ...rest }: ToolbarSeparatorProps) {
  return <RadixToolbar.Separator {...rest} className={cx('pw-separator', className)} />;
}
