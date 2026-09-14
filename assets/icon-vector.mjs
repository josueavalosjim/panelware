/**
 * Vector glyphs, for the sheets that are not drawn on the pixel lattice.
 *
 * The contract a sheet has to keep is the cell, the order, and a mask in
 * currentColor. None of that says pixels. Chrome and dialup are pixel sets
 * because that is what they are; cyber wants hairlines and true diagonals,
 * and paper wants a lens that is actually round, and a 16x16 grid can give
 * neither.
 *
 * A vector glyph is a short list of primitives in the same 16x16 box. Each
 * one produces two things from the same numbers: SVG markup for the sheet,
 * and a footprint, the pixels at least half covered, sampled 4x4 per pixel.
 * The footprint is what the bearings and the tests measure, so a vector
 * glyph's ink is measured the same way a pixel glyph's is.
 *
 * Straight strokes sit on pixel centres (x.5) with square caps ending on a
 * centre too, so at 1x they land on whole pixels and do not blur. Diagonals
 * antialias, which is the point of drawing them this way.
 */

/** A polyline. `cap` is 'square' (miter joins) or 'round' (round joins). */
export const stroke = (pts, { w = 1, cap = 'square', closed = false } = {}) =>
  ({ t: 'stroke', pts, w, cap, closed });
export const fill = (pts) => ({ t: 'fill', pts });
export const box = (x, y, w, h) => fill([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
export const ring = (cx, cy, r, w) => ({ t: 'ring', cx, cy, r, w });
export const vector = (...prims) => ({ vector: prims });
export const isVector = (g) => Boolean(g && g.vector);

/* ── Exact transforms, the same turns icon-lattice.mjs makes on rows ────── */

const mapPts = (g, f) => vector(...g.vector.map((p) => {
  if (p.t === 'ring') {
    const [cx, cy] = f([p.cx, p.cy]);
    return { ...p, cx, cy };
  }
  return { ...p, pts: p.pts.map(f) };
}));

/* Clockwise, matching rot90 on rows: the cell's top-left goes top-right.
   `axis` is the coordinate the turn is about. A pixel sheet turns about 8,
   the cell's middle. A one pixel stroke cannot be centred there, so a
   hairline sheet is drawn about 8.5, the middle of pixel 8, and turns about
   that instead. */
export const rot90V = (g, axis = 8) => mapPts(g, ([x, y]) => [2 * axis - y, x]);
export const flipXV = (g, axis = 8) => mapPts(g, ([x, y]) => [2 * axis - x, y]);
export const rot180V = (g, axis = 8) => rot90V(rot90V(g, axis), axis);
export const unionV = (a, b) => vector(...a.vector, ...b.vector);

/** The nine derived glyphs, derived the way derive() does for pixel sheets. */
export function deriveVector(drawn, axis = 8) {
  const I = { ...drawn };
  I['chevron-left'] = rot90V(I['chevron-down'], axis);
  I['chevron-up'] = rot90V(I['chevron-left'], axis);
  I['chevron-right'] = rot90V(I['chevron-up'], axis);
  I.next = flipXV(I.previous, axis);
  I.plus = unionV(I.minus, rot90V(I.minus, axis));
  for (const k of [1, 2, 3, 4]) I[`spinner-${k + 4}`] = rot180V(I[`spinner-${k}`], axis);
  return I;
}

/* ── Coverage ─────────────────────────────────────────────────────────── */

const segments = (p) => {
  const out = [];
  for (let i = 0; i < p.pts.length - 1; i += 1) out.push([p.pts[i], p.pts[i + 1]]);
  if (p.closed) out.push([p.pts[p.pts.length - 1], p.pts[0]]);
  return out;
};

function inSegment(x, y, [[ax, ay], [bx, by]], w, cap) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const px = x - ax, py = y - ay;
  const h = w / 2;
  if (cap === 'round') {
    const t = len2 ? Math.max(0, Math.min(1, (px * dx + py * dy) / len2)) : 0;
    const ex = px - t * dx, ey = py - t * dy;
    return ex * ex + ey * ey <= h * h;
  }
  const len = Math.sqrt(len2);
  const along = (px * dx + py * dy) / len;
  const across = Math.abs(px * dy - py * dx) / len;
  return along >= -h && along <= len + h && across <= h;
}

function inPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function covers(p, x, y) {
  if (p.t === 'fill') return inPolygon(x, y, p.pts);
  if (p.t === 'ring') {
    const d = Math.hypot(x - p.cx, y - p.cy);
    return Math.abs(d - p.r) <= p.w / 2;
  }
  return segments(p).some((s) => inSegment(x, y, s, p.w, p.cap));
}

const SAMPLES = [0.125, 0.375, 0.625, 0.875];

/** The glyph as rows of '#' and '.', one per pixel at least half covered. */
export function footprint(g) {
  const rows = [];
  for (let py = 0; py < 16; py += 1) {
    let row = '';
    for (let px = 0; px < 16; px += 1) {
      let hit = 0;
      for (const sy of SAMPLES) {
        for (const sx of SAMPLES) {
          if (g.vector.some((p) => covers(p, px + sx, py + sy))) hit += 1;
        }
      }
      row += hit >= 8 ? '#' : '.';
    }
    rows.push(row);
  }
  return rows;
}

/* ── Markup ───────────────────────────────────────────────────────────── */

const d = (p) => `M${p.pts.map(([x, y]) => `${x} ${y}`).join(' L')}${p.closed ? ' Z' : ''}`;

function primMarkup(p) {
  if (p.t === 'fill') return `<path d="${d(p)}"/>`;
  if (p.t === 'ring') {
    return `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="none" stroke="#000" stroke-width="${p.w}"/>`;
  }
  const join = p.cap === 'round' ? 'round' : 'miter';
  return `<path d="${d(p)}" fill="none" stroke="#000" stroke-width="${p.w}"`
    + ` stroke-linecap="${p.cap}" stroke-linejoin="${join}"/>`;
}

/** Cell-local SVG. The sheet is crispEdges; a vector glyph opts out. */
export const markupOf = (g) =>
  `<g shape-rendering="geometricPrecision">${g.vector.map(primMarkup).join('')}</g>`;
