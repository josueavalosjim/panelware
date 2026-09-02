/**
 * The equaliser, and the reason it is not a multi-thumb slider.
 *
 * HANDOFF.md deferred multi-thumb because the WAI-ARIA APG flags unresolved
 * gaps in its own reference pattern. Building this found out what that means,
 * and it is not an accessibility compromise to accept: a multi-thumb slider
 * is a RANGE. Its thumbs are ordered and Radix re-sorts them, so driving one
 * band moves it to a different index and the focused element reports a value
 * belonging to a band nobody touched. For a price filter that is right. For
 * an equaliser, where 3kHz is 3kHz permanently, it is unfixable.
 *
 * These assert the properties that follow from that decision, because the
 * decision is invisible in the rendered output: ten sliders and one slider
 * with ten thumbs look identical until you drive one.
 */
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { describe, test } from 'node:test';

import { Equalizer } from '../dist/index.js';

const BANDS = [
  { id: 'a', label: '60', name: '60 hertz', value: 4 },
  { id: 'b', label: '170', name: '170 hertz', value: -6 },
  { id: 'c', label: '310', name: '310 hertz', value: 0 },
];
const eq = (props = {}) =>
  render(h(Equalizer, { label: 'Equaliser', bands: BANDS, ...props }));

describe('the equaliser', () => {
  test('is a named group of independent sliders, one per band', () => {
    const html = eq();
    assert.match(html, /role="group"/);
    assert.match(html, /aria-label="Equaliser"/);
    assert.equal(html.match(/role="slider"/g).length, BANDS.length);
  });

  test('no slider carries more than one thumb', () => {
    /* This is the whole architectural claim, and it is the one thing that
       would silently regress if someone "simplified" this into one Radix
       Slider with an array of values. */
    const html = eq();
    const roots = html.split('data-orientation="vertical"').length - 1;
    assert.ok(roots >= BANDS.length,
      'fewer slider roots than bands, so some bands share one');
    for (const chunk of html.split(/(?=<span[^>]*class="pw-slider")/).slice(1)) {
      const thumbs = (chunk.match(/role="slider"/g) ?? []).length;
      assert.ok(thumbs <= 1, `a slider root carries ${thumbs} thumbs`);
    }
  });

  test('every band is named, and named for itself', () => {
    /* Identity is the property a multi-thumb slider cannot keep. Each band
       carries its own name, so re-ordering the array cannot rename a
       control. */
    const html = eq();
    for (const band of BANDS) {
      assert.ok(html.includes(`aria-label="${band.name}"`), `${band.name} is unnamed`);
    }
  });

  test('a signed value is spoken with its sign, not as a bare number', () => {
    /* "minus 6" and "6" are the same sound in a list of numbers. A decibel
       scale that does not say which side of flat it is on has not said
       anything. */
    const html = eq({ format: (v, b) => `${b.name}, ${v > 0 ? 'plus' : v < 0 ? 'minus' : 'flat at'} ${Math.abs(v)} decibels` });
    assert.match(html, /aria-valuetext="60 hertz, plus 4 decibels"/);
    assert.match(html, /aria-valuetext="170 hertz, minus 6 decibels"/);
  });

  test('the fill leaves the zero line, not the floor', () => {
    /* Radix's own Range fills from the minimum to the value, which draws a
       cut as a SHORT bar rising from the bottom: it reads as "a little above
       the quietest possible" when it means "six below flat". On a signed
       scale the fill has to travel from zero. */
    const html = eq();
    /* -12 to +12 puts zero at 50%. +4 is at 33.33%, so its fill runs from
       33.33% down to 50%: top 33.33, height 16.67. -6 is at 75%, so its fill
       runs from 50% down to 75%: top 50, height 25. */
    assert.match(html, /top:33\.33[^;"]*%;height:16\.6[^;"]*%/);
    assert.match(html, /top:50%;height:25%/);
  });

  test('a band sitting exactly on zero draws no fill', () => {
    const html = eq();
    assert.match(html, /top:50%;height:0%/);
  });

  test('the zero rule is only drawn when the scale actually spans zero', () => {
    /* A 0 to 24 scale has no zero line to draw: every value is a boost, and
       a rule along the floor says nothing. */
    assert.match(eq(), /data-zero=""/);
    assert.doesNotMatch(eq({ min: 0, max: 24 }), /data-zero=""/);
  });
});
