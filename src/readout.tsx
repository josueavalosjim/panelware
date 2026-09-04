/**
 * LCD READOUT.
 *
 * The one component with nothing to borrow. Every other part of this kit
 * takes an interaction from Radix and an ARIA pattern from the APG; a segment
 * display has neither, because it is not a control. It is an image of text.
 *
 * That is also the whole accessibility problem, and the answer is the role
 * rather than a hidden mirror. role="img" with an aria-label gives assistive
 * technology the string in one node and stops there.
 *
 * What it is deliberately NOT is a live region. <output> was the obvious
 * element and it was the wrong one: its implicit role is status, which is
 * polite-live with atomic announcement, so a clock driving one announces its
 * entire string every second over whatever the listener was doing. Put four
 * on a page and it is four at once. A value display that genuinely should
 * announce can be wrapped in an <output> by the caller, which makes liveness
 * a decision somebody took rather than a default nobody noticed.
 *
 * The marquee ships a real pause button, and that is not decoration either.
 * WCAG 2.2.2 asks for a mechanism to pause anything that moves for more than
 * five seconds. Pausing on hover is not a mechanism: a keyboard user, a
 * switch user and a touch user all have no way to trigger it.
 */
import { useState, type HTMLAttributes } from 'react';

import { cx } from './classes.js';
import { digitCell, glyphCell } from './charmap.js';
import { Icon } from './icon.js';

export interface ReadoutProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The string to display. Also its accessible name, unless label says otherwise. */
  value: string;
  /**
   * `digits` is the 9x13 seven-segment sheet: 0-9, blank, minus, colon, stop.
   * `glyphs` is the 5x6 alphanumeric sheet.
   */
  mode?: 'digits' | 'glyphs';
  /** Scrolls the value when it is wider than the box. Adds a pause control. */
  marquee?: boolean;
  /** Overrides the accessible name, for a value that reads badly as written. */
  label?: string;
  /** Text for the pause control. */
  pauseLabel?: string;
  resumeLabel?: string;
}

export function Readout({
  value,
  mode = 'digits',
  marquee,
  label,
  pauseLabel = 'Pause scrolling',
  resumeLabel = 'Resume scrolling',
  className,
  ...rest
}: ReadoutProps) {
  /* null means the viewer has not decided yet, and hover still applies.
     Once they have, their decision outranks hover in both directions. A
     boolean cannot express that: "not paused" and "never touched" have to be
     different states or the resume button cannot beat the pointer sitting on
     top of it. */
  const [paused, setPaused] = useState<boolean | null>(null);

  const cells = (key: string) =>
    Array.from(value, (char, i) => {
      const { x, y } = mode === 'digits' ? digitCell(char) : glyphCell(char);
      return (
        <span
          key={`${key}-${i}`}
          className="pw-lcd-cell"
          data-sheet={mode}
          /* Unitless integers, never "-27px 0". taste-check's treatments
             check flags any px literal in markup as a one-off value, and it
             would be right: every pixel dimension in this kit belongs in the
             stylesheet, where the cell size is already declared. */
          style={{ ['--pw-cell-x' as string]: x, ['--pw-cell-y' as string]: y }}
        />
      );
    });

  return (
    <span
      {...rest}
      className={cx('pw-lcd', marquee && 'pw-lcd-marquee', className)}
      data-scroll={paused === null ? undefined : paused ? 'paused' : 'running'}
    >
      {/* role="img" sits on the thing that IS the image, never on the box that
          also holds the pause control.

          It was on the host, and axe was right to call it: role="img" makes an
          element a leaf for assistive technology, its whole subtree replaced by
          the label. The pause button was inside that subtree, so a keyboard
          user could Tab to a control a screen reader user could not find at
          all. demo/states.html hid it, because the button is disabled there
          and a disabled button is not focusable. */}
      {marquee ? (
        /* The scrolling copy gets its own clipping box. Clipping on the host
           instead would swallow the pause control standing beside it. */
        <span className="pw-lcd-window" role="img" aria-label={label ?? value}>
          <span className="pw-lcd-render" aria-hidden="true">
            {cells('a')}
            {/* A second copy, so the -50% translate loops seamlessly rather
                than snapping back through an empty box. */}
            {cells('b')}
          </span>
        </span>
      ) : (
        <span className="pw-lcd-render" role="img" aria-label={label ?? value}>
          {cells('a')}
        </span>
      )}
      {marquee ? (
        <button
          type="button"
          className="pw-lcd-pause"
          aria-pressed={paused === true}
          aria-label={paused ? resumeLabel : pauseLabel}
          onClick={() => setPaused((was) => !was)}
        >
          {/* Decorative: the button's own aria-label already says which
              way it goes, and it changes with the state. */}
          <Icon name={paused ? 'play' : 'pause'} decorative />
        </button>
      ) : null}
    </span>
  );
}
