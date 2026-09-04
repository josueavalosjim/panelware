/**
 * WINDOW CHROME.
 *
 * A title bar, its control cluster, and the chassis around them. No Radix
 * primitive, because there is no interaction to own: the buttons are buttons
 * and the rest is structure.
 *
 * The controls are optional and each is a callback. A window with no handlers
 * renders no controls rather than rendering dead ones, which is the same rule
 * the states page had to learn: a control that looks pressable and does
 * nothing is worse than an absent control.
 *
 * The section is named by its own title bar. This shipped without that, and a
 * <section> with no accessible name is not exposed as a region at all: the
 * browser's accessibility tree gave the whole window role="generic" with an
 * empty name, while the prop doc below promised "an unlabelled region". It
 * was not even that. A heading inside an element does not name the element,
 * and axe cannot report the difference, because a nameless section is not a
 * landmark it can find fault with. It is simply not there.
 */
import { useId, type HTMLAttributes, type ReactNode } from 'react';

import { cx } from './classes.js';
import { Icon } from './icon.js';

export interface WindowProps
  /* title is omitted from the passthrough because HTML already has one and it
     is a string. This title is the visible heading in the bar and may be a
     node; sharing the name would silently pass a React element to the
     tooltip attribute. Same collision the dialog has. */
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Required. A window with no name is an unlabelled region. */
  title: ReactNode;
  /**
   * The heading level the title renders at. This was hard-coded to 2, which
   * is right for a window sitting under a page's h1 and wrong everywhere
   * else. A component that can be placed anywhere cannot know the level, so
   * it takes one and keeps 2 as the common case.
   */
  titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  minimizeLabel?: string;
  maximizeLabel?: string;
  closeLabel?: string;
  /** Rendered in the bar between the title and the controls. */
  toolbar?: ReactNode;
}

export function Window({
  title,
  titleLevel = 2,
  onMinimize,
  onMaximize,
  onClose,
  minimizeLabel = 'Minimise',
  maximizeLabel = 'Maximise',
  closeLabel = 'Close',
  toolbar,
  className,
  children,
  ...rest
}: WindowProps) {
  const titleId = useId();
  const Heading = `h${titleLevel}` as const;
  const controls: Array<[string, () => void, 'minimize' | 'maximize' | 'close']> = [];
  if (onMinimize) controls.push([minimizeLabel, onMinimize, 'minimize']);
  if (onMaximize) controls.push([maximizeLabel, onMaximize, 'maximize']);
  if (onClose) controls.push([closeLabel, onClose, 'close']);

  return (
    /* Before the spread, so a caller who names the window some other way
       wins rather than ending up with two names. */
    <section aria-labelledby={titleId} {...rest} className={cx('pw-window', className)}>
      <div className="pw-title-bar" data-gloss="">
        <Heading className="pw-title" id={titleId}>{title}</Heading>
        {toolbar}
        {controls.length > 0 && (
          <div className="pw-title-controls">
            {controls.map(([label, onClick, icon]) => (
              <button
                key={icon}
                type="button"
                className="pw-title-button"
                aria-label={label}
                onClick={onClick}
              >
                {/* Decorative: the button's own aria-label is its name, and a
                    screen reader reading both would say it twice. */}
                <Icon name={icon} decorative />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="pw-window-body">{children}</div>
    </section>
  );
}
