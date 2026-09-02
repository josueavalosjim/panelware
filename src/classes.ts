/**
 * The one shared helper, and it is deliberately small.
 *
 * A component kit does not need a class-name engine. Every component here
 * emits exactly one class of its own plus whatever the caller passed, which
 * is one join and a filter. Anything more would be the beginning of the
 * utility-class soup the CSS was written to avoid.
 */

/** Joins the kit's own class with the caller's, dropping empties. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * An optional boolean rendered as a data attribute.
 *
 * Attributes rather than modifier classes, because a class in the markup is a
 * treatment the caller has to know the name of, and an attribute reads as a
 * property of the thing. `gloss` becomes `data-gloss`.
 *
 * false becomes undefined so React omits the attribute entirely. Rendering
 * data-gloss="false" would be worse than useless: [data-gloss] matches on
 * presence, so the gloss would be on.
 */
export const flag = (on: boolean | undefined): '' | undefined => (on ? '' : undefined);
