/**
 * Is this element actually scrolling?
 *
 * A scroll container with no focusable content is a keyboard trap in reverse:
 * Firefox makes scrollers focusable on its own, Chrome does not, so a long
 * dialog body in Chrome has content below the fold that a keyboard user
 * cannot reach at all. The fix is tabIndex, and the reason this needs a hook
 * rather than a constant is that an unconditional tabIndex adds a tab stop to
 * every short dialog that does not need one.
 *
 * Measured rather than assumed, and re-measured on resize, because whether a
 * panel overflows is a function of its content and the viewport, both of
 * which move.
 */
import { useEffect, useState, type RefObject } from 'react';

export function useOverflows(ref: RefObject<HTMLElement | null>): boolean {
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    // The content can change height without the box changing, so watch both.
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [ref]);

  return overflows;
}
