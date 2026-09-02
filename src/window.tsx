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
 */
import type { HTMLAttributes, ReactNode } from 'react';

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
  const controls: Array<[string, () => void, 'minimize' | 'maximize' | 'close']> = [];
  if (onMinimize) controls.push([minimizeLabel, onMinimize, 'minimize']);
  if (onMaximize) controls.push([maximizeLabel, onMaximize, 'maximize']);
  if (onClose) controls.push([closeLabel, onClose, 'close']);

  return (
    <section {...rest} className={cx('pw-window', className)}>
      <div className="pw-title-bar" data-gloss="">
        <h2 className="pw-title">{title}</h2>
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
