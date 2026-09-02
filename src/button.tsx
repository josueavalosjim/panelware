/**
 * BUTTON.
 *
 * Radix ships no Button primitive, and that is not an oversight: a native
 * <button> already has the role, the keyboard behaviour and the disabled
 * semantics, so there is nothing to own. shadcn reaches for Slot and nothing
 * else, and so does this. Worth saying out loud, because a reader who assumes
 * @radix-ui/react-button exists will spend an afternoon looking for it.
 */
import { Slot } from 'radix-ui';
import type { ButtonHTMLAttributes } from 'react';

import { cx, flag } from './classes.js';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `primary` paints the accent face. There is one accent, on purpose. */
  variant?: 'default' | 'primary';
  /**
   * The Web 2.0 highlight. Off by default, because a highlight on every
   * surface is the 2007 mistake: it stops meaning anything once everything
   * has one. A skin that refuses gloss silences this without a markup edit,
   * by setting --pw-gloss-opacity to 0.
   */
  gloss?: boolean;
  /** Render the caller's child instead of a button, keeping the styling. */
  asChild?: boolean;
}

export function Button({
  variant,
  gloss,
  asChild,
  className,
  children,
  ...rest
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      {...rest}
      className={cx('pw-button', className)}
      data-variant={variant}
      data-gloss={flag(gloss)}
    >
      {children}
    </Comp>
  );
}
