/**
 * EQUALIZER.
 *
 * N independent bands sharing one scale, a zero line and a frame.
 *
 * ── It is not a multi-thumb slider, and that is a correctness call ────────
 * HANDOFF.md deferred multi-thumb because the WAI-ARIA APG flags unresolved
 * gaps in its own reference pattern. Building this meant finding out what
 * that means in practice, and the answer is not an accessibility compromise
 * to accept, it is a different component.
 *
 * A multi-thumb slider is a range: its thumbs are the two ends of one span,
 * and they are ordered. Given three thumbs at 20, 60 and 40, driving the
 * middle one upward with the arrow keys returns 20, 40, 100 from Radix. It
 * re-sorted. The thumb being driven is now at a different index, and the
 * focused element reports aria-valuenow="40", a number belonging to a band
 * the user never touched.
 *
 * For a price filter that is right: "the low end" and "the high end" are what
 * the thumbs mean, and swapping them is the correct outcome. For an equaliser
 * it is unfixable, because 3kHz is 3kHz permanently and driving it up must
 * not silently reassign it to 6kHz.
 *
 * So the bands are separate sliders. Each keeps its own identity, its own
 * name and its own value, and none of them can renumber another.
 *
 * ── What this costs, stated rather than hidden ───────────────────────────
 * Ten bands are ten tab stops. That is the APG's own model, where every
 * slider is its own widget with its own stop, and it is a lot of stops in
 * one component. A roving group would reduce it to one, and would also make
 * ten independent values behave like one control, which they are not.
 *
 * On touch it is worse and it is not solvable. A vertical slider captures
 * vertical drag, and vertical drag is how a page scrolls. Radix sets
 * touch-action: none on each root, so the equaliser is a region a finger
 * cannot scroll through. No arrangement gives both gestures to one area.
 * Keep it narrow and leave scrollable page either side.
 */
import { Slider as RadixSlider } from 'radix-ui';
import { useId, type HTMLAttributes } from 'react';

import { cx } from './classes.js';

export interface EqualizerBand {
  /** Stable identity. Never derived from position in the array. */
  id: string;
  /** The visible column label, e.g. "60" or "3k". */
  label: string;
  /** The spoken name, e.g. "60 hertz". Falls back to the label. */
  name?: string;
  value: number;
}

export interface EqualizerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'children'> {
  /** Required. A group of controls needs a name. */
  label: string;
  bands: EqualizerBand[];
  onBandChange?: (id: string, value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /**
   * Turns a band's value into something worth hearing. Without it a screen
   * reader reads a bare number, and a bare number is exactly what a signed
   * decibel scale cannot afford: "minus 6" and "6" sound alike in a list.
   */
  format?: (value: number, band: EqualizerBand) => string;
  /** Draw the zero rule. Only meaningful when the scale spans zero. */
  showZero?: boolean;
}

export function Equalizer({
  label,
  bands,
  onBandChange,
  min = -12,
  max = 12,
  step = 1,
  format,
  showZero = true,
  className,
  ...rest
}: EqualizerProps) {
  const groupId = useId();
  const spansZero = min < 0 && max > 0;
  /* Where the rule sits, as a percentage from the top of the well. Computed
     here because only this component knows the range. */
  const zeroPercent = spansZero ? ((max - 0) / (max - min)) * 100 : 100;
  /* A value's distance from the top of the well, as a percentage. */
  const pct = (v: number) => ((max - v) / (max - min)) * 100;

  return (
    <div
      {...rest}
      className={cx('pw-eq', className)}
      role="group"
      aria-label={label}
    >
      <div
        className="pw-eq-well"
        data-zero={showZero && spansZero ? '' : undefined}
        style={{ ['--pw-eq-zero' as string]: `${zeroPercent}%` }}
      >
        {bands.map((band) => (
          <div className="pw-eq-band" key={band.id}>
            <RadixSlider.Root
              className="pw-slider"
              orientation="vertical"
              min={min}
              max={max}
              step={step}
              value={[band.value]}
              onValueChange={([next]) => {
                if (next !== undefined) onBandChange?.(band.id, next);
              }}
            >
              <RadixSlider.Track className="pw-slider-track">
                {/* Not Radix's Range. Range fills from the minimum to the
                    value, which on a signed scale draws a cut band as a SHORT
                    bar rising from the floor: it reads as "a little above the
                    quietest possible", when what it means is "six below
                    flat". An equaliser's fill has to leave from zero and
                    travel to the value, in whichever direction that is, or
                    the shape of the curve is a lie. */}
                <span
                  className="pw-eq-fill"
                  style={{
                    top: `${Math.min(zeroPercent, pct(band.value))}%`,
                    height: `${Math.abs(zeroPercent - pct(band.value))}%`,
                  }}
                />
              </RadixSlider.Track>
              <RadixSlider.Thumb
                className="pw-slider-thumb"
                aria-label={band.name ?? band.label}
                aria-valuetext={format ? format(band.value, band) : undefined}
              />
            </RadixSlider.Root>
            {/* aria-hidden: the thumb's own aria-label already carries the
                band's name, and a screen reader reading "60" beside "60
                hertz" says the same thing twice. */}
            <span className="pw-eq-label" aria-hidden="true" id={`${groupId}-${band.id}`}>
              {band.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
