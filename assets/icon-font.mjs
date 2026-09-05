/**
 * The icon set, as data.
 *
 * Drawn rather than imported, and the pipeline already existed: this is the
 * same bitmap-rows-to-SVG-rects generator the readout's sprite font uses, and
 * the same mask-image application, so the ink is --pw-color-* rather than
 * baked into the file. A set like Lucide would have been quicker and wrong
 * for the same reason a webfont would be: 24px stroked vectors drawn for a
 * flat modern UI read as a different product bolted onto this chassis.
 *
 * ── The cell is 16x16, and that is a choice with a source ─────────────────
 * 16x16 is the Windows toolbar and menu icon size through 95, 2000 and XP,
 * so it is the period-correct grid for the chrome this kit is citing.
 *
 * It is NOT Winamp's. Strider's 1998 spec records Winamp's transport buttons
 * at 23x18, stacked in one bitmap with the pressed state directly below the
 * normal one at (23,18). That geometry is recorded in assets/README.md and
 * deliberately not used: a second grid would mean a second set of size
 * tokens, a second scale knob and a second sheet, to place five glyphs. One
 * square grid is worth more than one cell size being exactly right.
 *
 * ── Rows, not vectors ─────────────────────────────────────────────────────
 * Every icon is sixteen strings of sixteen characters. That is more typing
 * than a path, and it is the point: a pixel icon has no sub-pixel truth to
 * lose, a change shows up in a diff as the pixels that changed, and nothing
 * here can drift half a pixel off the grid under a transform.
 */

export const ICON_W = 16;
export const ICON_H = 16;
export const ICON_COLS = 8;

const I = {
  /* Transport. The triangles carry a two-pixel apex, which needs an EVEN
     height to be possible at all: a shape symmetric about the middle of an
     odd number of rows has exactly one middle row, so its point is one pixel.
     play was 13 rows tall while this comment claimed a two-pixel apex, which
     is the kind of thing a comment can say for months.

     play is also deliberately taller than the 12x12 live area every other
     glyph keeps. A triangle filling the same box as a square reads lighter
     than it, which is the same reason Material's keyshapes give a circle 20
     units against a square's 18 on a 24 grid. The overshoot is the
     correction, not a violation of the grid. */
  play: [
    '................',
    '.....#..........',
    '.....##.........',
    '.....###........',
    '.....####.......',
    '.....#####......',
    '.....######.....',
    '.....#######....',
    '.....#######....',
    '.....######.....',
    '.....#####......',
    '.....####.......',
    '.....###........',
    '.....##.........',
    '.....#..........',
    '................',
  ],
  pause: [
    '................',
    '................',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '....###..###....',
    '................',
    '................',
  ],
  stop: [
    '................',
    '................',
    '................',
    '................',
    '....########....',
    '....########....',
    '....########....',
    '....########....',
    '....########....',
    '....########....',
    '....########....',
    '....########....',
    '................',
    '................',
    '................',
    '................',
  ],
  previous: [
    '................',
    '................',
    '..##.......#....',
    '..##......##....',
    '..##.....###....',
    '..##....####....',
    '..##...#####....',
    '..##..######....',
    '..##..######....',
    '..##...#####....',
    '..##....####....',
    '..##.....###....',
    '..##......##....',
    '..##.......#....',
    '................',
    '................',
  ],
  /* Two above the triangle and four below the bar, which is one row high of
     geometric centre and deliberate. The mark is a light tapering triangle
     over a solid bar, so its visual mass sits low and centring it by the box
     makes it look like it is sinking. Checked at 4x against stop, which is a
     solid square and is centred 4/4 because it has nothing to correct for.

     Worth stating because the numbers argue the other way and will again:
     eject and minimize are the only even-height glyphs in the set that are
     off centre, and minimize has its own reason a few glyphs down. */
  eject: [
    '................',
    '................',
    '.......##.......',
    '......####......',
    '.....######.....',
    '....########....',
    '...##########...',
    '..############..',
    '................',
    '................',
    '..############..',
    '..############..',
    '................',
    '................',
    '................',
    '................',
  ],

  /* Window chrome. Deliberately thinner than the transport glyphs: these sit
     in a 32px titlebar button, not a 44px transport control, and a heavy
     close mark next to a light title reads as a warning rather than a
     control. */
  close: [
    '................',
    '................',
    '................',
    '...##......##...',
    '...###....###...',
    '....###..###....',
    '.....######.....',
    '......####......',
    '......####......',
    '.....######.....',
    '....###..###....',
    '...###....###...',
    '...##......##...',
    '................',
    '................',
    '................',
  ],
  /* Twenty ink against restore's sixty-eight, in a row where the four render
     side by side. That spread is the shapes rather than an inconsistency: a
     minimize mark is a bar and a bar is two rows, so matching the boxes would
     mean drawing something that is not a bar. Checked at 1x in a real title
     bar, where the four read as one cluster.

     It also sits low rather than centred, at 10 above and 4 below, because
     the mark is a title bar dropping to the taskbar. minus explains the same
     thing from the other side, where a low dash in a checkbox would read as a
     mistake. */
  minimize: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...##########...',
    '...##########...',
    '................',
    '................',
    '................',
    '................',
  ],
  maximize: [
    '................',
    '................',
    '................',
    '...##########...',
    '...##########...',
    '...##......##...',
    '...##......##...',
    '...##......##...',
    '...##......##...',
    '...##......##...',
    '...##......##...',
    '...##########...',
    '...##########...',
    '................',
    '................',
    '................',
  ],
  /* Two 7x7 windows at offset 3, which puts restore on maximize's exact
     10x10 footprint with the same 3px margins. It was 8x8 windows at offset
     4, so the mark grew two pixels on every side and gained twenty ink the
     moment you clicked the button: the same control, toggled, changing size.

     The cost is the back window's reveal, which is one row now rather than
     two. It still reads as two windows at 1x, which was the thing to protect.

     The occluded parts of the back window are removed rather than drawn
     under the front one. That is what keeps the front window's interior
     open: a back edge crossing it would read as a line through the window
     rather than as a window behind. */
  restore: [
    '................',
    '................',
    '................',
    '......#######...',
    '......#######...',
    '......##...##...',
    '...#######.##...',
    '...#######.##...',
    '...##...#####...',
    '...##...#####...',
    '...##...##......',
    '...#######......',
    '...#######......',
    '................',
    '................',
    '................',
  ],

  /* Direction. One shape, and the other three ARE rotations of it, derived
     at the bottom of this file rather than drawn.

     They used to be drawn four times, and the comment here used to claim
     they were rotations, and they were not: the vertical pair measured 12x7
     and the horizontal pair 6x10, when a 90 degree turn of 12x7 is 7x12. A
     hand copy of a rotation is a rotation with a mistake in it.

     The old comment also justified drawing them by hand on the grounds that
     a rotated bitmap lands between pixels. That is simply wrong. A 90 degree
     rotation of a square lattice is exact; it is a symmetry of the grid. */
  'chevron-down': [
    '................',
    '................',
    '................',
    '................',
    '..##........##..',
    '..###......###..',
    '...###....###...',
    '....###..###....',
    '.....######.....',
    '......####......',
    '.......##.......',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],

  /* Form marks.

     minus is the indeterminate checkbox, and it is a separate glyph from
     minimize rather than a reuse: minimize sits low in its cell because a
     window's minimize glyph is a title bar dropping to the taskbar, and a
     low dash in a checkbox reads as a mistake rather than as a third state.

     caret-down is a filled triangle, not the chevron. Windows drew its
     dropdown arrows as solid triangles, from Marlett onward, and a stroked
     chevron in a combo box is the one detail that would date this kit
     forward by fifteen years. Both marks exist in the set: the chevron is
     for disclosure and navigation, the caret is for "this opens a list". */

  /* Status. These replace the text glyphs the badge shipped with, which were
     a check, a exclamation and a multiplication sign borrowed from the font: they
     changed shape with the reader's font stack and had no pixel grid at all. */
  check: [
    '................',
    '................',
    '................',
    '................',
    '...........###..',
    '..........###...',
    '.........###....',
    '..###...###.....',
    '...###.###......',
    '....#####.......',
    '.....###........',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  exclamation: [
    '................',
    '................',
    '.......##.......',
    '.......##.......',
    '.......##.......',
    '.......##.......',
    '.......##.......',
    '.......##.......',
    '.......##.......',
    '................',
    '................',
    '.......##.......',
    '.......##.......',
    '................',
    '................',
    '................',
  ],
  minus: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...##########...',
    '...##########...',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  'caret-down': [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...##########...',
    '....########....',
    '.....######.....',
    '......####......',
    '.......##.......',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  /* ── The four marks the set was missing ─────────────────────────────────
     search, question and info are the three affordances a component kit is
     asked for that no existing glyph covered, and ellipsis is the overflow
     mark a menu bar needs. */
  /* The lens is 9x9 (x3-x11, y2-y10) rather than the wider oval two earlier
     drafts produced, and the handle takes the remaining three rows, so the
     whole mark is 11x12: it fills the live area's height and stops a column
     short of its width.

     The ring is two pixels at the sides and one at the poles, which is the
     only place in the set a stroke is not two, and the lens is nine columns
     wide, which is odd and so cannot centre on the cell. Both are the live
     area's budget rather than oversights: a two-pixel pole needs a ten-row
     lens, and the lens plus a three-step handle already fills rows 2 to 13
     exactly. Widening the lens buys a uniform ring and pays for it with a
     two-step handle, which is the part of the mark that says magnifier. This said "fills the 12x12 live area exactly", which
     was not true and was the kind of claim that stops anyone measuring. Ink 45 against close's 52:
     a ring is lighter than a filled X and matching them would fatten the
     stroke past the set's 2px.

     The bottom of the ring runs one column further right than the top, and
     that pixel is the handle's join. Without it the handle met the ring at a
     single corner, diagonally, which is the only place in the whole set where
     two parts of a glyph touched without sharing an edge. A corner join has
     no width: at 1x it can render as a break, and a mark whose handle looks
     detached from its lens is not a magnifier. test/icons.test.mjs holds the
     set to this now. */
  search: [
    '................',
    '................',
    '.....#####......',
    '....##...##.....',
    '...##.....##....',
    '...##.....##....',
    '...##.....##....',
    '...##.....##....',
    '...##.....##....',
    '....##...##.....',
    '.....######.....',
    '..........##....',
    '...........##...',
    '............##..',
    '................',
    '................',
  ],
  /* The left side of the bowl is one row deep, so row 3 carries both shoulders
     and row 4 carries only the right. That is a question mark rather than a
     defect: the bowl is open at the lower left and the stroke has to stop
     somewhere. The two pixels share an edge with the crown above them, so it
     is a terminal and not the floating fragment it measures as.

     The bowl is six wide and centred on the stem, which the first draft was
     not: a bowl centred on itself sits half a pixel left of the stem below
     it and reads as a leaning glyph. The dot is at y11-y12, the same rows as
     exclamation's, so the two line up in a row. */
  question: [
    '................',
    '................',
    '.....######.....',
    '....##....##....',
    '..........##....',
    '.........##.....',
    '........##......',
    '.......##.......',
    '.......##.......',
    '................',
    '................',
    '.......##.......',
    '.......##.......',
    '................',
    '................',
    '................',
  ],
  /* Ink 18, exactly exclamation's, because it IS exclamation upside down.
     Drawn rather than derived so neither glyph owns the other's placement,
     and there is a test that they mirror. */
  info: [
    '................',
    '................',
    '.......##.......',
    '.......##.......',
    '................',
    '................',
    '.......##.......',
    '.......##.......',
    '.......##.......',
    '.......##.......',
    '.......##.......',
    '.......##.......',
    '.......##.......',
    '................',
    '................',
    '................',
  ],
  /* Deliberately lighter than minus: ink 12 against 20. Three separated dots
     cannot carry a bar's ink inside a 12x12 live area without either closing
     the gaps or spilling past it, and both are worse than being light. What
     they DO share is the extent, x3 to x12 on rows y7 and y8, so the two sit
     in a row looking like siblings rather than two unrelated marks. */
  ellipsis: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...##..##..##...',
    '...##..##..##...',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],

  /* ── The spinner, as eight frames ───────────────────────────────────────
     Not one glyph rotated by CSS. Only a 90 degree turn is exact on a square
     lattice; 45 degrees resamples, and resampled pixel art tears rather than
     softens. So the rotation is drawn: eight 2x2 markers on a
     ring, five of them lit, and the animation steps between cells the same
     way the readout steps between glyphs.

     Five and not three, which is what this was drawn with first. Three lit
     markers is a comet, and a comet is legible only while it is moving: a
     still frame reads as scattered specks rather than as a ring, and the
     component renders one still frame before anything animates. Five leaves
     a three-position gap, which is the C that every spinner in every set
     is, so the shape is finished at rest and the gap's position is what
     carries the rotation. Ink is 20 a frame, the same as minus.

     Only frames 1 to 4 are here. Frame k+4 is frame k turned 180 degrees,
     which is two exact quarter turns, so the other four are derived below
     and cannot drift from these. */
  /* Every dot sits at exactly radius 5 and the diagonals land at 36.9 degrees
     from vertical rather than 45, so the step from one frame to the next
     alternates 36.9 and 53.1 and the spin pulses about 18 percent either side
     of its mean rather than turning evenly.

     Left alone, because the alternative is worse. A true 45 degree diagonal
     at radius 5 lands on 3.54, which is not a pixel, so an even cadence means
     moving the diagonals to radius 4 or 6 and giving up the round ring. The
     ring being exactly round is the thing being paid for here, and at eight
     frames on a constant timer the cadence is not what anyone sees. */
  'spinner-1': [
    '................',
    '................',
    '.......##.......',
    '.......##.##....',
    '..........##....',
    '................',
    '................',
    '............##..',
    '............##..',
    '................',
    '................',
    '..........##....',
    '.......##.##....',
    '.......##.......',
    '................',
    '................',
  ],
  'spinner-2': [
    '................',
    '................',
    '................',
    '..........##....',
    '..........##....',
    '................',
    '................',
    '............##..',
    '............##..',
    '................',
    '................',
    '....##....##....',
    '....##.##.##....',
    '.......##.......',
    '................',
    '................',
  ],
  'spinner-3': [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '..##........##..',
    '..##........##..',
    '................',
    '................',
    '....##....##....',
    '....##.##.##....',
    '.......##.......',
    '................',
    '................',
  ],
  'spinner-4': [
    '................',
    '................',
    '................',
    '....##..........',
    '....##..........',
    '................',
    '................',
    '..##............',
    '..##............',
    '................',
    '................',
    '....##....##....',
    '....##.##.##....',
    '.......##.......',
    '................',
    '................',
  ],
  /* dot is rounded rather than square, and it is the only mark in the set
     that is. It serves the radio's bullet, the menu's radio item and the
     neutral badge, and a square bullet inside a round radio reads as a
     mistake: the roundness of a radio is the thing that says choose-one, so
     the mark inside it cannot argue with the box around it.

     Six pixels cannot be a circle. Knocking the corners off is what every
     bitmap radio bullet since Windows 3.1 has done. */
  dot: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '......####......',
    '.....######.....',
    '.....######.....',
    '.....######.....',
    '.....######.....',
    '......####......',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
};

/** Sheet order, left to right then top to bottom. */
export const ICON_ORDER = [
  'play', 'pause', 'stop', 'previous', 'next', 'eject', 'close', 'minimize',
  'maximize', 'restore', 'chevron-down', 'chevron-up', 'chevron-right',
  'chevron-left', 'check', 'exclamation', 'dot', 'minus', 'plus',
  'caret-down', 'search', 'info', 'question', 'ellipsis',
  'spinner-1', 'spinner-2', 'spinner-3', 'spinner-4',
  'spinner-5', 'spinner-6', 'spinner-7', 'spinner-8',
];

export const ICON_ROWS = Math.ceil(ICON_ORDER.length / ICON_COLS);

/* ── Derived glyphs ───────────────────────────────────────────────────────
   Rotations and mirrors, computed rather than copied. A 90 degree rotation
   and a horizontal flip are both exact on a square lattice, so there is
   nothing to lose by deriving them and one obvious thing to lose by not:
   these three chevrons and this `next` were all hand copies that had quietly
   drifted from the shape they claimed to be. */
const rot90 = (r) => r[0].split('').map((_, x) => r.map((row) => row[x]).reverse().join(''));
const flipX = (r) => r.map((row) => [...row].reverse().join(''));

/* rot90 here turns clockwise, so the first turn of a down chevron points
   LEFT. Assigning it to chevron-right produced four glyphs that were exact
   rotations of each other and two of which were labelled the wrong way
   round, which the rotation test above cannot see: consistent and
   mislabelled is still consistent. There is a separate test for which way
   each one actually points. */
I['chevron-left'] = rot90(I['chevron-down']);
I['chevron-up'] = rot90(I['chevron-left']);
I['chevron-right'] = rot90(I['chevron-up']);
I.next = flipX(I.previous);

/* A plus is a minus and its own quarter turn, so it cannot end up with a
   different stroke width or a different extent from the glyph it pairs with
   in a tree view. */
const union = (a, b) => a.map((row, y) => [...row]
  .map((c, x) => (c === '#' || b[y][x] === '#' ? '#' : '.')).join(''));
I.plus = union(I.minus, rot90(I.minus));

/* Two quarter turns is 180 degrees, exact, and it is what makes the second
   half of the spin the first half's opposite by construction rather than by
   a careful hand. */
const rot180 = (r) => rot90(rot90(r));
for (const k of [1, 2, 3, 4]) I[`spinner-${k + 4}`] = rot180(I[`spinner-${k}`]);

/** The rectangles an icon paints, in cell-local pixels, runs merged per row. */
export function iconRects(name) {
  const rows = I[name];
  if (!rows) throw new Error(`no icon named ${JSON.stringify(name)}`);
  const out = [];
  rows.forEach((row, y) => {
    let run = 0;
    for (let x = 0; x <= ICON_W; x += 1) {
      if (row[x] === '#') { run += 1; continue; }
      if (run) out.push({ x: x - run, y, w: run, h: 1 });
      run = 0;
    }
  });
  return out;
}

/** Every declared icon, so a test can catch one drawn but never listed. */
export const ICON_NAMES = Object.keys(I);
