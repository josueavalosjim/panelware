# panelware (working name — rename before real work starts)

Not "Winamp," "Aqua," "Aero," or "Luna" as the project name — those are real trademarks. Fine to
cite them as inspiration/prior art in docs (everyone in this genre does — NES.css references
Nintendo without being Nintendo), not fine as the product name itself.

## What this is

One accessible component engine, built as a skin on top of Radix UI's primitive layer (not a
from-scratch ARIA/keyboard implementation — see "Why Radix underneath" below). First skin is a
chrome/LCD skeuomorphic aesthetic drawing on real early-2000s technique (Winamp classic skins,
Windows XP Luna, Web 2.0 gloss). A second skin (accessible cyberpunk/HUD, filling the gap left by
ARWES being unmaintained and never-accessible) is planned but not v1.

Thesis: maximalist visual language, real engineering discipline underneath. Most retro/genre UI
kits are decorative-only; most accessible primitive libraries are visually neutral. Nobody
combines both on purpose.

## Why Radix underneath (not from-scratch a11y)

Researched directly, not assumed: owning full ARIA/keyboard/focus-management for ~8 components
including a slider and a fully custom LCD readout is multi-month work even for funded teams —
Radix Primitives took a dedicated team years and a professional audit still found 35 open a11y
defects; React Aria (Adobe) took 385 contributors and ~6 years to cover 50+ components. The
realistic, already-proven path is shadcn's: skin on top of Radix's primitive layer, own only the
visual output. 8bitcn (pixel-art) and RetroUI/neobrutalism.com are real shipped proof this
produces genuinely different visual languages, not palette recolors, on the exact same primitives.

`taste-check` (already built, published, in real use at Pendo) gates every skin's color palette
for contrast. Radix supplies the interaction/ARIA guarantee. Two already-solved things doing the
hard work, not one new thing pretending to solve both.

## v1 scope

**In:** button, toggle, tabs, dialog/panel, single-thumb range slider — thin chrome/LCD skins over
Radix primitives — plus a status badge and the LCD/segment readout (the one genuinely custom
piece, no existing ARIA pattern to borrow).

**Deferred to v1.1+:** ~~multi-thumb EQ-style slider~~. Built, and the deferral turned out to rest on a
wrong premise, so the correction is recorded here rather than the note quietly deleted. An equaliser is
not a multi-thumb slider. A multi-thumb slider is a RANGE: its thumbs are the ends of one span and they
are ordered. Given three thumbs at 20, 60 and 40, driving the middle one upward returns 20, 40, 100 from
Radix — it re-sorts, so the thumb being driven lands at a different index and the focused element reports
a value belonging to a band nobody touched. Correct for a price filter, unfixable for an equaliser where
3kHz is 3kHz permanently. So the APG's unresolved gap does not apply: the component is N independent
sliders sharing a scale, and each keeps its own identity. What IS unresolved, and is documented in the
component, is touch: a vertical slider captures vertical drag and so does page scroll, and no arrangement
gives both gestures to one region. The accessible-cyberpunk second skin is still deferred until the
engine/first-skin split is proven.

**Packaging:** one core package, skins as CSS/`data-theme` swaps in the same bundle (DaisyUI/Radix
Themes pattern), not separate npm installs per skin — that split (Theme UI's model) is only worth
it past 3+ real skins. Plain npm/pnpm workspaces, Changesets for versioning, a plain demo site
that doubles as docs. Skip Storybook/Turborepo/Nx for v1 — real small comparable projects
(Shoelace, Park UI) don't use them either.

**Token contract:** extend DaisyUI v5's structural-token split (semantic color roles *plus*
separate structural tokens — `--radius-*`, `--border`, `--depth`) rather than inventing a new
taxonomy from scratch. Add skin-specific tokens (`--bevel-depth`, `--glow-intensity`) on top.

## Technique, sourced

### Bevels (button/panel chrome)

98.css's real pattern — verified by reading its source, not guessing: 2-3 stacked `inset
box-shadow`s as a raised/sunken state pair, swapped as tokens on press. Whole library is 994
lines. Cheap, no `backdrop-filter`. Example from 98.css itself:

```css
--border-raised-outer: inset -1px -1px var(--window-frame), inset 1px 1px var(--button-highlight);
--border-raised-inner: inset -2px -2px var(--button-shadow), inset 2px 2px var(--button-face);
/* box-shadow: var(--border-raised-outer), var(--border-raised-inner); */
```

NES.css (68 Sass files, ~76KB) does the same idea via a mixin instead of custom-property pairs:
`inset -4px -4px $shadow` normal → `inset -6px -6px` hover → `inset 4px 4px` active (shadow
direction literally flips to fake a press-in).

### Glossy variant (Web 2.0 / Winamp playback-button gloss)

Real dated technique, from actual 2006-07 tutorials (not modern retrospectives):
- Photoshop Star, "Designing Glossy (Web 2.0) Badges," Sept 2006: base shape + Outer/Inner Glow +
  Gradient Overlay → first highlight layer, white fill, **Overlay blend, 70% opacity** → second
  highlight, white-to-transparent diagonal gradient, **Soft Light/Overlay, 30-70% opacity**.
- Isabel Nyo, Feb 2007: white ellipse highlight at **7-15% opacity**.
- makeaero.com's modern generator (real source read, not guessed): 4-layer stack — OKLCH base
  gradient (radial glow + linear dark-to-light), a diagonal glare pseudo-element (`linear-gradient
  (120deg, transparent 30%, rgba(255,255,255,.35) 45%, rgba(255,255,255,.05) 55%, transparent
  70%)`), an inset top-highlight capsule pseudo-element, `box-shadow` depth that deepens on hover
  and flattens + `translateY(1px)` on `:active`.
- No official style guide ever existed for this — confirmed via Smashing Magazine's own 2008
  retrospectives ("Grunge Style In Web Design," "Don't Follow Web Design Trends: Set Them!").
  Purely tutorial/imitation-driven, traced informally back to Mac OS X Aqua's gloss.

### LCD/segment readout

**Corrected mid-research, use this:** Winamp's actual original (verified via Strider's 1998
"Unofficial WinAMP Skin Specifications" PDF, preserved at
github.com/WACUP/Winamp-Skinning-Archive) was a **bitmap sprite font**, not real per-segment
rendering — `numbers.bmp` used 9×13px digit cells (with a hidden minus-sign sprite trick),
`text.bmp` used 5×6px glyph cells for the scrolling title. Multi-state buttons were the same idea:
stacked offsets in one bitmap (Play normal at (23,0) 23×18, pressed directly below at (23,18)).
Build this as a CSS sprite sheet / `background-position` swap, not individually-toggled segment
divs — more period-authentic AND less work. (A pure per-segment `clip-path` approach is the
better call only if a real dim/unlit-ghost-segment look is wanted later, which the original
Winamp display did not actually have.)

`viscolor.txt` (also in Strider's spec) is the real spectrum-analyzer palette if that visualizer
ever gets built. Corrected against the base skin's own self-documenting copy: **24** lines, not 23.
Line 0 is the visualiser background, 1 the dot grid, 2-17 the analyser gradient top to bottom,
18-22 the oscilloscope centre to edge, and 23 the analyser peak marker.

### Real hex values on file, if a Luna-adjacent palette variant is ever wanted

From the actual archived "Windows XP Visual Guidelines" (Microsoft, Aug 2001,
archive.org/details/XPGuidelines): blue anchors `#8CAAE6`, `#6487DC`, `#003399`; accents `#FFCC00`,
`#FF9933`, `#13920D`; control-blue ramp `#2178E0` → `#B7D3FC`; window-frame blues `#081BCB` →
`#0062EA` → `#14A5F4`. Command buttons: 75×23px, 1px-indent curve, disabled text `rgb(161,161,146)`.

### Perf boundary (real, not theoretical)

`backdrop-filter` is the actually-risky primitive — documented jank in a live shadcn-ui issue
(#327) traced to Chromium's GPU-bound blur re-composite, worse on scroll/fixed elements, worse on
iOS Safari. Reserve it for a rare "glass panel" moment, never for the chrome/bevel work above,
which doesn't need it — stacked `box-shadow` is cheap because it never touches the live-sampling
blur path.

## Prior art already checked (don't rebuild what exists)

- **DaisyUI** — the closest real precedent for structural (not just color) multi-theme tokens.
- **8bitcn, RetroUI/neobrutalism.com** — proof genuinely different visual languages already ship
  on Radix's primitive layer.
- **NES.css (21.7k★), 98.css (9.1k★)** — proof the genre-committed-kit format gets real attention,
  and the actual bevel-token source to build on.
- **ARWES** — the cyberpunk incumbent, confirmed unmaintained, zero accessibility anywhere in its
  docs/repo. Real gap for the (deferred) second skin.
- **makeaero.com / Visnalize/makeaero (MIT)** — real, current gloss-generator source, read directly.

## Sources for the design-history material above

- Windows XP Visual Guidelines (MS, Aug 2001): https://archive.org/details/XPGuidelines
- Windows Vista User Experience Guidelines: https://archive.org/details/UXGuide
- Aero DWM glass API, MSDN Magazine Apr 2007: https://learn.microsoft.com/en-us/archive/msdn-magazine/2007/april/aero-glass-create-special-effects-with-the-desktop-window-manager
- Strider, "Unofficial WinAMP Skin Specifications" v1.2.1 (1998), preserved: https://github.com/WACUP/Winamp-Skinning-Archive
- SacRat & Imagine, Winamp Skinning Tutorial, also ran in Hugi #26 (demoscene diskmag, ~2000): https://hugi.scene.org/online/hugi26/hugi%2026%20-%20graphics%20skinning%20sacrat%20winamp%20skinning%20tutorial%20-%202.htm
- Apple, "Inside Mac OS X: Aqua Human Interface Guidelines," June 2002: https://dn721903.ca.archive.org/0/items/apple-hig/MacOSX_HIG_2002_06_01.pdf
- Photoshop Star, "Designing Glossy (Web 2.0) Badges," Sept 2006: https://photoshopstar.com/star-badges/
- Isabel Nyo, "Web 2.0 star burst in Photoshop," Feb 2007: https://eisabainyo.net/weblog/2007/02/19/web-20-star-burst-in-photoshop/
- Smashing Magazine, "Don't Follow Web Design Trends: Set Them!," Nov 2008: https://www.smashingmagazine.com/2008/11/dont-follow-trends-set-them/
- 98.css source: https://github.com/jdan/98.css · NES.css source: https://github.com/nostalgic-css/NES.css
- makeaero button source: https://github.com/Visnalize/makeaero/blob/main/app/button/button-client.tsx

## Kickoff prompt

Paste into a fresh Claude Code session with cwd `~/Documents/PORT/panelware/`:

> Scaffold this design-system project per HANDOFF.md in this directory — read it first, it has the
> full architecture decision, sourced technique, and v1 scope. Summary: a component engine built
> as a Radix UI skin (not from-scratch ARIA), first skin is a chrome/LCD skeuomorphic aesthetic.
> Start with: npm/pnpm workspace scaffold, install Radix primitives for button/toggle/tabs/dialog/
> slider, build the token contract (DaisyUI-style semantic + structural tokens, extended with
> --bevel-depth/--glow-intensity), then the bevel treatment using the 98.css stacked-inset-shadow
> pattern documented in HANDOFF.md. Do the LCD readout as a CSS sprite sheet (background-position
> swap), per the corrected period-accurate approach in HANDOFF.md, not per-segment divs. Every
> palette this produces should be checkable against `taste-check` (a published tool at
> `@josueavalosjim/taste-check` on npm) for contrast before it ships. Skip the multi-thumb EQ
> slider and the second (cyberpunk) skin entirely for v1 — both are explicitly deferred. Skip
> Storybook/Turborepo/Nx — plain workspace + Changesets + a simple demo page is the whole v1
> tooling stack. Rename the project from the "panelware" placeholder to something real before
> publishing (not "Winamp"/"Aqua"/"Aero"/"Luna" — those are trademarks, cite them as inspiration
> only, the way NES.css cites Nintendo).
