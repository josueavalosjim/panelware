/**
 * METADATA.
 *
 * The coordinate readouts and serial strings a screen in this genre carries in
 * its corners. Field and value pairs, set small and quiet.
 *
 * No Radix primitive, because there is no interaction. It is a description
 * list, which is what field and value pairs have been in HTML since 1993, and
 * the reason to render one rather than a stack of divs with a colon in the
 * text is that the two are identical to a sighted reader and only one of them
 * is walkable by a screen reader.
 *
 * Every item takes a label. That is the API refusing to draw the thing the
 * reference screens are full of: an unlabelled string in a readout, which
 * looks like data and communicates nothing. If a caller genuinely wants an
 * unlabelled line they can pass an empty-string label and own that decision
 * out loud.
 */
import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from './classes.js';

export interface MetaEntry {
  /** The field. Announced before its value. */
  label: string;
  value: ReactNode;
}

export interface MetaProps extends Omit<HTMLAttributes<HTMLDListElement>, 'children'> {
  items: MetaEntry[];
  /**
   * A block in a corner, or a strip along a footer. Same pairs and same type
   * either way; only the flow changes.
   */
  layout?: 'block' | 'inline';
}

export function Meta({ items, layout = 'block', className, ...rest }: MetaProps) {
  return (
    <dl
      {...rest}
      className={cx('pw-meta', className)}
      data-layout={layout === 'inline' ? 'inline' : undefined}
    >
      {items.map(({ label, value }, i) => (
        /* The wrapper is what pairs a dt with its dd. A dl without it is a
           flat run of terms and definitions that happen to alternate, which
           is a different thing to say and a harder one to style. */
        <div className="pw-meta-item" key={`${label}-${i}`}>
          <dt className="pw-meta-label">{label}</dt>
          <dd className="pw-meta-value">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
