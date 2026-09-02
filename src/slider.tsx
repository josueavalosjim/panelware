/**
 * SLIDER, single thumb.
 *
 * Multi-thumb is deferred, and the reason is in HANDOFF.md: the WAI-ARIA
 * APG's own reference pattern flags unresolved touch and assistive-technology
 * gaps in the spec's own example. That is not a first-version fight.
 *
 * Radix supplies the arrow keys, Home and End, the value clamping and the
 * aria-valuemin/max/now. This adds a format hook, because aria-valuenow alone
 * is only adequate when the value is a bare number: a screen reader reading
 * "70" for a gain in decibels or a position in a track has told the listener
 * nothing, and aria-valuetext is the attribute that fixes it.
 *
 * A note on disabled, because it is a real trade and not an oversight. Radix
 * follows the platform: a disabled control leaves the tab sequence. That
 * means a screen-reader user tabbing a panel never learns the control is
 * there. The alternative, aria-disabled with a read-only handler, keeps it
 * discoverable and is what an audit will usually ask for. Neither is wrong
 * and WCAG requires neither, so this ships the platform default and says so
 * in the README rather than choosing quietly.
 */
import { Slider as RadixSlider } from 'radix-ui';
import type { ComponentPropsWithoutRef } from 'react';

import { cx, flag } from './classes.js';

export interface SliderProps
  extends Omit<ComponentPropsWithoutRef<typeof RadixSlider.Root>, 'children'> {
  /** Required. An unlabelled slider is an unnamed control. */
  label: string;
  /** Turns the raw value into something worth hearing. */
  format?: (value: number) => string;
  gloss?: boolean;
}

export function Slider({ label, format, gloss, className, ...rest }: SliderProps) {
  const value = rest.value ?? rest.defaultValue ?? [0];
  const current = value[0] ?? 0;

  return (
    <RadixSlider.Root {...rest} className={cx('pw-slider', className)}>
      <RadixSlider.Track className="pw-slider-track">
        <RadixSlider.Range className="pw-slider-range" />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        className="pw-slider-thumb"
        data-gloss={flag(gloss)}
        aria-label={label}
        aria-valuetext={format ? format(current) : undefined}
      />
    </RadixSlider.Root>
  );
}
