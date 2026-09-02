/**
 * TRANSPORT + SEEK.
 *
 * The transport is a Radix Toolbar, which is what makes the cluster behave
 * like one control rather than five: Tab enters it once and the arrow keys
 * move between buttons. Five separate buttons would put five stops in the tab
 * sequence of a bar that is conceptually a single thing, which is the same
 * mistake the tabs pattern exists to avoid.
 *
 * ── Icon-only is allowed here, and the component makes you pay for it ─────
 * The badge exists partly to enforce that a status is never a mark alone.
 * This is the exception: transport symbols are the most standardised
 * iconography in consumer software and a row of five worded buttons is a menu
 * rather than a transport.
 *
 * The price is that `label` is required on every button and becomes the
 * accessible name. Nothing here is unnamed; it is only unlabelled on screen.
 *
 * ── Seek is two components on purpose ─────────────────────────────────────
 * Scrubbable is a Slider. Watch-only is a Progress. They look nearly
 * identical and their semantics are opposite: role="slider" and focusable
 * versus role="progressbar" and not. One component with an `interactive` prop
 * would either put a focus ring on something a keyboard cannot use or take it
 * off something it can.
 */
import { Toolbar } from 'radix-ui';
import type { ComponentPropsWithoutRef, HTMLAttributes } from 'react';

import { cx } from './classes.js';
import { Icon } from './icon.js';
import type { IconName } from './icons.js';

export interface TransportProps
  extends ComponentPropsWithoutRef<typeof Toolbar.Root> {
  /** Required. The cluster is a group and a group needs a name. */
  label: string;
}

export function Transport({ label, className, ...rest }: TransportProps) {
  return (
    <Toolbar.Root {...rest} className={cx('pw-transport', className)} aria-label={label} />
  );
}

export interface TransportButtonProps
  extends Omit<ComponentPropsWithoutRef<typeof Toolbar.Button>, 'children'> {
  icon: IconName;
  /** Required, and it is the accessible name. See the note above. */
  label: string;
}

export function TransportButton({ icon, label, className, ...rest }: TransportButtonProps) {
  return (
    <Toolbar.Button
      {...rest}
      className={cx('pw-transport-button', className)}
      aria-label={label}
    >
      <Icon name={icon} decorative />
    </Toolbar.Button>
  );
}

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 0 to max. */
  value: number;
  max?: number;
  /** Required. A bar with no name is a decoration. */
  label: string;
  /** Turns the raw value into something worth hearing. */
  format?: (value: number, max: number) => string;
}

export function Progress({ value, max = 100, label, format, className, ...rest }: ProgressProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const ratio = max === 0 ? 0 : clamped / max;

  return (
    <div
      {...rest}
      className={cx('pw-progress', className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
      aria-valuetext={format ? format(clamped, max) : undefined}
    >
      {/* scaleX rather than width: width is a layout property and would drop
          the bar off the compositor on every tick of a playing track. */}
      <span
        className="pw-progress-fill"
        style={{ transform: `scaleX(${ratio})` }}
      />
    </div>
  );
}
