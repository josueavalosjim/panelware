/**
 * DIALOG.
 *
 * Radix owns the parts that are genuinely hard and genuinely invisible when
 * they are missing: aria-modal, the focus trap, returning focus to whatever
 * opened it, Escape, and marking the rest of the page hidden from assistive
 * technology. Owning those from scratch is the multi-month work HANDOFF.md
 * says not to take on, and it is already done twice.
 *
 * Two things this adds on top.
 *
 * The title bar is the one place the gloss is on by default. It is the Luna
 * titlebar and it is the single element in the kit where the highlight is the
 * point rather than an option.
 *
 * The body is a scroll container, so it takes a tabIndex when, and only when,
 * it actually scrolls. Chrome does not make scrollers focusable on its own,
 * so without this a long dialog has content below the fold that a keyboard
 * user cannot reach. An unconditional tabIndex would add a dead tab stop to
 * every short dialog instead, which is why it is measured.
 */
import { Dialog as RadixDialog } from 'radix-ui';
import { useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cx } from './classes.js';
import { useOverflows } from './overflow.js';

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export interface DialogPanelProps
  /* title is omitted from the passthrough because HTML already has one, and
     it is a string. This title is the visible heading in the bar and is
     allowed to be a node. Letting the two share a name would silently pass a
     React element to the tooltip attribute. */
  extends Omit<ComponentPropsWithoutRef<typeof RadixDialog.Content>, 'title'> {
  /** Required. A dialog with no accessible name is an unlabelled region. */
  title: ReactNode;
  /** Text for the close button's accessible name. */
  closeLabel?: string;
  /**
   * Blurs the page behind the scrim. Off, and it stays off unless asked for.
   * backdrop-filter is the documented jank primitive and a fixed
   * full-viewport overlay is its worst case, so this is opt-in and the
   * consumer also has to give --pw-glass-blur a non-zero value.
   */
  glass?: boolean;
}

export function DialogPanel({
  title,
  closeLabel = 'Close',
  glass,
  className,
  children,
  ...rest
}: DialogPanelProps) {
  const body = useRef<HTMLDivElement>(null);
  const scrolls = useOverflows(body);

  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="pw-overlay" data-glass={glass ? '' : undefined} />
      <RadixDialog.Content {...rest} className={cx('pw-panel', className)}>
        <div className="pw-panel-title-bar" data-gloss>
          <RadixDialog.Title className="pw-panel-title">{title}</RadixDialog.Title>
          <RadixDialog.Close className="pw-panel-close" aria-label={closeLabel}>
            {/* aria-hidden: the button's own aria-label says "Close", and a
                screen reader reading the multiplication sign as well would
                announce the control twice. */}
            <span aria-hidden="true">&#215;</span>
          </RadixDialog.Close>
        </div>
        <div
          ref={body}
          className="pw-panel-body"
          tabIndex={scrolls ? 0 : undefined}
          role={scrolls ? 'group' : undefined}
          aria-label={scrolls ? 'Dialog content, scrollable' : undefined}
        >
          {children}
        </div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
