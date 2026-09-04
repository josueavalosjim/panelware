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
 * The formatted text has to follow the live value, not the initial one. This
 * read rest.value ?? rest.defaultValue, which is correct for a controlled
 * slider and frozen for an uncontrolled one: defaultValue never changes, so
 * Radix moved aria-valuenow on every arrow press while aria-valuetext stayed
 * at the value the slider mounted with. aria-valuetext WINS over
 * aria-valuenow in every screen reader, so an uncontrolled slider with a
 * format announced the same wrong number all the way across the track.
 *
 * It survived because every formatted slider in the demo is controlled and
 * the test rendered one statically, which is the one arrangement where the
 * bug cannot show. Nothing was wrong with the component under test; the test
 * never moved it.
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
import { type ComponentPropsWithoutRef, useState } from 'react';

import { cx, flag } from './classes.js';

export interface SliderProps
  extends Omit<ComponentPropsWithoutRef<typeof RadixSlider.Root>, 'children'> {
  /** Required. An unlabelled slider is an unnamed control. */
  label: string;
  /** Turns the raw value into something worth hearing. */
  format?: (value: number) => string;
  gloss?: boolean;
}

export function Slider({
  label, format, gloss, className, onValueChange, ...rest
}: SliderProps) {
  /* Only ever read when the slider is uncontrolled. A controlled one is told
     its value by the caller, and reading anything else here would let the two
     disagree for a frame. */
  const [uncontrolled, setUncontrolled] = useState(() => rest.defaultValue ?? [0]);
  const current = (rest.value ?? uncontrolled)[0] ?? 0;

  return (
    <RadixSlider.Root
      {...rest}
      onValueChange={(next) => {
        setUncontrolled(next);
        onValueChange?.(next);
      }}
      className={cx('pw-slider', className)}
    >
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
