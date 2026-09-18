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
 *
 * Under prefers-reduced-motion the button is gone, not disabled. lcd.css stops
 * the scroll outright there, so the control had nothing left to pause and was
 * shipping as a named, focusable, inert button: a keyboard user could tab to
 * it and press it and watch nothing happen. 2.2.2 is satisfied by the stopped
 * marquee rather than by the control, so the control goes. That is the same
 * rule window.tsx keeps for a window control with no handler, and the reason
 * the hiding lives in CSS is that the media query is where the motion is
 * decided; a matchMedia read here would be a second copy of that decision.
 */
import { useEffect, useRef, useState, type HTMLAttributes } from 'react';

import { cx } from './classes.js';
import { digitCell, glyphCell } from './charmap.js';
import { Icon } from './icon.js';

/* Where one pass of the scroll ends and the next begins. Blank cells rather
   than a CSS gap, because the loop is a -50% translate over two identical
   copies: a separator that belongs to each copy keeps that halfway point
   exact, where a gap only between them would not. Both sheets carry a
   space, so this costs no artwork. */
const MARQUEE_GAP = '   ';

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

  /* Whether the value is longer than the window it sits in, which is the
     only thing that should start it moving. This used to scroll whenever a
     marquee was asked for, and since a marquee always rendered its second
     copy, a value that fitted sat there as two copies chasing each other:
     "GLASS PAD" in a box with room for one and a half of them reads as
     "LASS PADGLASS PA", which is a broken display rather than a loop.

     Measured, not counted off the string: a cell's width is a skin's to
     change, and the box is a consumer's.

     Once it is scrolling the render holds two identical copies, so half of
     it is one copy. Halving is what stops this latching on: a value that
     fits again measures as itself rather than as the pair. */
  const windowRef = useRef<HTMLSpanElement>(null);
  const renderRef = useRef<HTMLSpanElement>(null);
  const [scrolls, setScrolls] = useState(false);

  useEffect(() => {
    const box = windowRef.current;
    const render = renderRef.current;
    if (!marquee || !box || !render || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const copy = scrolls ? render.scrollWidth / 2 : render.scrollWidth;
      setScrolls(copy > box.clientWidth + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(render);
    return () => observer.disconnect();
  }, [marquee, scrolls, value, mode]);

  const cells = (key: string, withGap = false) =>
    Array.from(withGap ? value + MARQUEE_GAP : value, (char, i) => {
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
      /* Distinct from data-scroll above, which is the viewer's own choice.
         This one is the display saying there is more value than window. */
      data-marquee={marquee && scrolls ? 'scrolling' : undefined}
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
        <span className="pw-lcd-window" role="img" aria-label={label ?? value} ref={windowRef}>
          <span className="pw-lcd-render" aria-hidden="true" ref={renderRef}>
            {cells('a', scrolls)}
            {/* A second copy, so the -50% translate loops without a visible
                join rather than snapping back through an empty box. It is
                only here while the value is actually too long: rendered
                unconditionally it is what a short value collided with. */}
            {scrolls ? cells('b', true) : null}
          </span>
        </span>
      ) : (
        <span className="pw-lcd-render" role="img" aria-label={label ?? value}>
          {cells('a')}
        </span>
      )}
      {marquee && scrolls ? (
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
