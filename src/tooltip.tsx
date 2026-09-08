/**
 * TOOLTIP.
 *
 * ── Read this before using it ────────────────────────────────────────────
 * A tooltip is not a label. A control whose only name is its tooltip has no
 * name at all to a touch user, who cannot hover, and no name to anyone else
 * until focus reaches it. Every icon-only control in this kit carries an
 * aria-label for exactly that reason, and a tooltip on top of one is a
 * convenience rather than the name.
 *
 * The component cannot enforce that, because it cannot tell which case it is
 * in, so it is written here instead. `Tooltip` takes its text as a prop rather
 * than as children to make the shape obvious: the tooltip is a thing attached
 * to a trigger, not a container the trigger lives inside.
 *
 * ── The provider ─────────────────────────────────────────────────────────
 * Radix wants one TooltipProvider above all of them, and it is what makes the
 * delay behave like a delay: once a tooltip has opened, moving to a
 * neighbouring trigger opens the next one immediately rather than waiting
 * again. Without it every tooltip is its own island and the row feels broken.
 * It is exported rather than mounted per tooltip for that reason.
 */
import { Tooltip as RadixTooltip } from 'radix-ui';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cx } from './classes.js';

export type TooltipProviderProps = ComponentPropsWithoutRef<typeof RadixTooltip.Provider>;

export function TooltipProvider(props: TooltipProviderProps) {
  return <RadixTooltip.Provider {...props} />;
}

export interface TooltipProps
  extends Omit<ComponentPropsWithoutRef<typeof RadixTooltip.Content>, 'content'> {
  /** The words in the box. Not the control's name; see the file header. */
  label: ReactNode;
  /** The control the tooltip belongs to. */
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Tooltip({
  label, children, open, defaultOpen, onOpenChange, className, sideOffset = 6, ...rest
}: TooltipProps) {
  return (
    <RadixTooltip.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          {...rest}
          sideOffset={sideOffset}
          className={cx('pw-tooltip', className)}
        >
          {label}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
