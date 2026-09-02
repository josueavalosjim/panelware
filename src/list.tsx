/**
 * LIST.
 *
 * A selectable list of rows. The one component in the kit with no Radix
 * primitive behind it, because Radix has no listbox: Select is a dropdown,
 * and neither RadioGroup nor Toolbar means what a playlist means.
 *
 * ── aria-activedescendant, not roving tabindex ───────────────────────────
 * Both are in the APG's listbox pattern and both are correct. This uses the
 * first because the list is the thing that scrolls and the number of rows is
 * unbounded: with a roving tabindex, focus moves between N elements and a
 * long list means N tabindex writes on every arrow press. With
 * activedescendant, focus never leaves the container and one attribute
 * changes. The tradeoff is that the active row is not the focused element,
 * so its ring has to be drawn by an attribute rather than by :focus-visible.
 *
 * ── Selected and playing are different states ────────────────────────────
 * A row can be selected and a row can be the one playing, and you scroll a
 * selection past the playing track constantly. Collapsing them into one
 * highlight is the bug this component exists to avoid, so aria-selected and
 * aria-current are separate and a row can carry both.
 *
 * Winamp's playlist colour-codes rows, and that is the one thing from the
 * reference not taken. Colour alone says nothing to a reader who cannot see
 * it and nothing at all in forced colors, so the playing row gets a mark and
 * a weight and the colour is the third signal rather than the only one.
 */
import { useCallback, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent } from 'react';

import { cx } from './classes.js';
import { Icon } from './icon.js';

export interface ListRow {
  id: string;
  /** The main text. Truncates rather than wrapping. */
  primary: string;
  /** A duration, a size, a right-aligned second column. */
  secondary?: string;
  disabled?: boolean;
}

export interface ListProps extends Omit<HTMLAttributes<HTMLUListElement>, 'onSelect'> {
  /** Required. A listbox with no name is an unnamed region. */
  label: string;
  rows: ListRow[];
  /** The selected row's id, or null. Controlled. */
  selected?: string | null;
  onSelect?: (id: string) => void;
  /** Enter, Space, or a double click. */
  onActivate?: (id: string) => void;
  /** The row that is playing, which is not the same as the selected one. */
  current?: string | null;
  /** Spoken suffix for the playing row, e.g. "now playing". */
  currentLabel?: string;
}

export function List({
  label,
  rows,
  selected = null,
  onSelect,
  onActivate,
  current = null,
  currentLabel = 'now playing',
  className,
  ...rest
}: ListProps) {
  const baseId = useId();
  const rowId = (id: string) => `${baseId}-${id}`;
  const enabled = rows.filter((r) => !r.disabled);
  const [active, setActive] = useState<string | null>(
    () => selected ?? enabled[0]?.id ?? null,
  );
  const ref = useRef<HTMLUListElement>(null);

  const move = useCallback((to: number) => {
    const row = enabled[Math.max(0, Math.min(to, enabled.length - 1))];
    if (!row) return;
    setActive(row.id);
    /* Scroll the row, not the page. scrollIntoView on a row inside a
       scrolling list moves the whole document when the list is near an edge;
       writing to the scroller keeps the movement where the user is looking. */
    const el = ref.current?.querySelector<HTMLElement>(`#${CSS.escape(rowId(row.id))}`);
    const box = ref.current;
    if (el && box) {
      if (el.offsetTop < box.scrollTop) box.scrollTop = el.offsetTop;
      else if (el.offsetTop + el.offsetHeight > box.scrollTop + box.clientHeight) {
        box.scrollTop = el.offsetTop + el.offsetHeight - box.clientHeight;
      }
    }
  }, [enabled, baseId]);

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const at = enabled.findIndex((r) => r.id === active);
    switch (event.key) {
      case 'ArrowDown': event.preventDefault(); move(at + 1); break;
      case 'ArrowUp': event.preventDefault(); move(at - 1); break;
      case 'Home': event.preventDefault(); move(0); break;
      case 'End': event.preventDefault(); move(enabled.length - 1); break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        if (active) { onSelect?.(active); onActivate?.(active); }
        break;
      default: return;
    }
  };

  return (
    <ul
      {...rest}
      ref={ref}
      className={cx('pw-list', className)}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      aria-activedescendant={active ? rowId(active) : undefined}
      onKeyDown={onKeyDown}
    >
      {rows.map((row) => {
        const isCurrent = row.id === current;
        return (
          <li
            key={row.id}
            id={rowId(row.id)}
            className="pw-list-item"
            role="option"
            aria-selected={row.id === selected}
            aria-current={isCurrent ? 'true' : undefined}
            aria-disabled={row.disabled ? 'true' : undefined}
            data-active={row.id === active ? '' : undefined}
            onClick={() => { if (!row.disabled) { setActive(row.id); onSelect?.(row.id); } }}
            onDoubleClick={() => { if (!row.disabled) onActivate?.(row.id); }}
          >
            {isCurrent ? (
              <span className="pw-list-marker">
                <Icon name="play" decorative />
              </span>
            ) : null}
            <span className="pw-list-primary">{row.primary}</span>
            {row.secondary ? (
              <span className="pw-list-secondary">{row.secondary}</span>
            ) : null}
            {/* The playing state has to be spoken, not only drawn. aria-current
                is announced inconsistently across screen readers, so the row
                also carries the words. */}
            {isCurrent ? <span className="pw-sr-only">, {currentLabel}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}
