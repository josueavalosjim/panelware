/**
 * VISUALISER — the spectrum analyser.
 *
 * The last piece of the console this skin is drawing, and the one everybody
 * pictures first.
 *
 * ── It does not listen to anything ───────────────────────────────────────
 * No Web Audio, no AnalyserNode, no requestAnimationFrame. It takes an array
 * of levels and draws them. That is a real boundary rather than a shortcut: an
 * audio graph is the consumer's, it needs a user gesture to start, it needs
 * cleaning up, and a skin that opened one would be making a decision about
 * somebody else's application on their behalf. `AnalyserNode.getByteFrequency
 * Data` into a state array is about six lines at the call site and it belongs
 * there.
 *
 * It also means this component never animates on its own, which is what keeps
 * WCAG 2.2.2 where the motion is. The marquee is the opposite case: it moves
 * whether or not anyone asked, so it ships a pause control. If a timer ever
 * appears in here, that obligation moves with it.
 *
 * ── Peaks are held, and the hold is not a timer ──────────────────────────
 * The falling peak marker is the detail that makes an analyser look like one,
 * and it needs memory: the highest level a band has reached lately. That is
 * held here rather than pushed to the caller, because it is a property of the
 * drawing rather than of the audio, and a caller computing it would be
 * reimplementing the same decay in every application.
 *
 * It decays per update rather than per second. A peak that fell on a timer
 * would be motion this component owns, with everything that follows; a peak
 * that falls one step each time new values arrive is drawing, and it is the
 * same behaviour at any frame rate the consumer chooses.
 *
 * ── What a screen reader gets ────────────────────────────────────────────
 * role="img" and the label, which is the same answer the readout gives for the
 * same reason: it is a picture of something, the bands are not sixteen
 * separate facts anybody wants read out, and there is no ARIA pattern for a
 * spectrum. The bands are hidden inside it.
 *
 * The honest part is that a visualiser carries no information a user needs. It
 * is decoration over audio that is already playing, and the label should say
 * so rather than pretending to report a value.
 */
import { useEffect, useRef, useState } from 'react';
import type { HTMLAttributes } from 'react';

import { cx } from './classes.js';

export interface VisualiserProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * One level per band, 0 to 1. Values outside that are clamped rather than
   * rejected: an analyser fed a hot signal should peg, not throw.
   */
  values: number[];
  /**
   * Required. What the picture is of, not what it currently reads: "spectrum
   * analyser" is a better name here than any number.
   */
  label: string;
  /**
   * How far a held peak falls per update, as a fraction. 0 holds forever,
   * which is a meter rather than an analyser. `false` draws no peaks.
   */
  peakDecay?: number | false;
}

const clamp = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

export function Visualiser({
  values, label, peakDecay = 0.04, className, ...rest
}: VisualiserProps) {
  const levels = values.map(clamp);
  const [peaks, setPeaks] = useState<number[]>(levels);
  /* The levels this effect last ran against, so a re-render for any other
     reason does not decay a peak. The decay is per value change, not per
     render, and those are not the same thing in React. */
  const seen = useRef<number[]>(levels);

  useEffect(() => {
    if (peakDecay === false) return;
    const previous = seen.current;
    if (previous.length === levels.length && previous.every((v, i) => v === levels[i])) return;
    seen.current = levels;
    setPeaks((held) => levels.map((level, i) => {
      const fell = (held[i] ?? 0) - peakDecay;
      return Math.max(level, fell > 0 ? fell : 0);
    }));
  });

  return (
    <div {...rest} className={cx('pw-visualiser', className)} role="img" aria-label={label}>
      {levels.map((level, i) => (
        <span
          /* Index, deliberately. A band IS its position in the spectrum: band
             three is 3kHz whatever the array around it does, and there is no
             identity here to preserve the way the equaliser's bands have one. */
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          className="pw-visualiser-band"
          aria-hidden="true"
        >
          <span className="pw-visualiser-bar" style={{ ['--pw-vis-level' as string]: level }} />
          {peakDecay === false ? null : (
            <span
              className="pw-visualiser-peak"
              style={{ ['--pw-vis-hold' as string]: peaks[i] ?? level }}
            />
          )}
        </span>
      ))}
    </div>
  );
}
