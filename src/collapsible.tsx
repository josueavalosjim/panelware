/**
 * COLLAPSIBLE.
 *
 * A disclosure row and the thing it discloses. Radix owns the aria-expanded
 * and aria-controls pair, which is the part that is easy to write and easy to
 * get subtly wrong: a trigger pointing at an id that is not in the document
 * reads perfectly in the markup and tells a screen reader nothing.
 *
 * The chevron is drawn here rather than left to the caller, because it is the
 * affordance rather than a decoration: it is what says the row can open before
 * anybody has pressed it. It points right when shut and turns a quarter when
 * open, which is what every file tree since Explorer has done.
 *
 * Not an accordion. An accordion is a set of these where opening one closes
 * the others, and that is a behaviour a consumer can build from this in a few
 * lines with state they own. Shipping it would mean choosing for them whether
 * the set can be fully closed, which is a product decision rather than a skin.
 */
import { Collapsible as RadixCollapsible } from 'radix-ui';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cx } from './classes.js';
import { Icon } from './icon.js';

export type CollapsibleProps = ComponentPropsWithoutRef<typeof RadixCollapsible.Root>;

export function Collapsible({ className, ...rest }: CollapsibleProps) {
  return <RadixCollapsible.Root {...rest} className={cx('pw-collapsible', className)} />;
}

export interface CollapsibleTriggerProps
  extends ComponentPropsWithoutRef<typeof RadixCollapsible.Trigger> {
  children: ReactNode;
}

export function CollapsibleTrigger({ className, children, ...rest }: CollapsibleTriggerProps) {
  return (
    <RadixCollapsible.Trigger {...rest} className={cx('pw-collapsible-trigger', className)}>
      {/* One glyph, turned by CSS. Naming chevron-down and rotating to it
          would put the resting state a quarter turn from the drawing, and the
          sheet is pixel art: the CSS turns it exactly 90 degrees, which
          resamples nothing, but only from the orientation the cell holds. */}
      <Icon name="chevron-right" decorative />
      {children}
    </RadixCollapsible.Trigger>
  );
}

export type CollapsibleContentProps =
  ComponentPropsWithoutRef<typeof RadixCollapsible.Content>;

export function CollapsibleContent({ className, ...rest }: CollapsibleContentProps) {
  return <RadixCollapsible.Content {...rest} className={cx('pw-collapsible-content', className)} />;
}
