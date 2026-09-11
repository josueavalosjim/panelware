/**
 * EVERY LOOK THE KIT SHIPS, IN ONE PLACE.
 *
 * A look is a skin and an optional preset. Not a cross product: a preset is
 * nested inside the skin it was written for, so pairing one with another skin
 * is not a combination that exists, and the config's own selectors would match
 * nothing if you tried.
 *
 * ── Why this file exists ─────────────────────────────────────────────────
 * This list was written out four times: in check-colour.mjs, in
 * check-a11y.mjs, in tastecheck.config.json's contrast.themes, and in its
 * runtime.states. Nothing compared them, so the cost of adding a skin was four
 * edits and the cost of forgetting one was a check that passed without ever
 * visiting the new skin. That had already happened: runtime.states covered
 * three of the six looks, so paper and two presets were measured from their
 * declared tokens and never from what the browser actually painted.
 *
 * The two JSON copies cannot import this, because they are data read by a
 * tool. So they stay written out, and test/contract.test.mjs compares them to
 * this list instead: adding a skin here fails one test with the names it is
 * missing, rather than passing four checks that never saw it.
 */

/** A skin, and the preset written for it. */
export const LOOKS = [
  { skin: 'chrome' },
  { skin: 'chrome', preset: 'deck' },
  { skin: 'cyber' },
  { skin: 'cyber', preset: 'redline' },
  { skin: 'paper' },
  { skin: 'paper', preset: 'newsprint' },
];

export const THEMES = ['light', 'dark'];

/** `chrome`, `chrome-deck`. The form the config's theme and state names take. */
export const id = (look) => (look.preset ? `${look.skin}-${look.preset}` : look.skin);

/** `chrome+deck`. The form a failure message reads best in. */
export const label = (look) => (look.preset ? `${look.skin}+${look.preset}` : look.skin);

/** Every look in every theme, as the names the config has to carry. */
export const matrix = () =>
  LOOKS.flatMap((look) => THEMES.map((theme) => `${id(look)}-${theme}`));
