import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  practiceOrRound1Payout,
  round2PayoutA,
  round2PayoutB,
  maxFertilizerVA,
  maxFertilizerVB,
} from '../src/lib/payout.js';

describe('Round 1 / Practice truth table', () => {
  const rows = [
    [0, 25, 25, 25], [1, 24, 26, 24], [2, 23, 27, 23], [3, 22, 28, 22],
    [4, 21, 29, 21], [5, 20, 30, 20], [6, 19, 31, 19], [7, 18, 32, 18],
    [8, 17, 33, 17], [9, 16, 34, 16], [10, 15, 35, 15],
  ];
  it.each(rows)('fert=%i: savings=%i, good=%i, bad=%i', (f, sav, good, bad) => {
    const g = practiceOrRound1Payout({ fertilizer: f, rain: 'good' });
    const b = practiceOrRound1Payout({ fertilizer: f, rain: 'bad' });
    expect(g.savings).toBe(sav);
    expect(g.totalTokens).toBe(good);
    expect(b.totalTokens).toBe(bad);
  });
});

describe('Round 2 Version A truth table (budget=25, no video)', () => {
  const rows = [
    { f: 0, s: false, i: false, sav: 25, good: 25, bad: 25 },
    { f: 5, s: false, i: false, sav: 20, good: 30, bad: 20 },
    { f: 10, s: false, i: false, sav: 15, good: 35, bad: 15 },
    { f: 0, s: true, i: false, sav: 15, good: 45, bad: 15 },
    { f: 0, s: true, i: true, sav: 13, good: 43, bad: 23 },
    // NOTE: game_logic.md truth table lists good=40/38/36 for these rows
    // but the documented formulas yield 50/48/46. Trusting formulas (authoritative).
    { f: 5, s: true, i: false, sav: 10, good: 50, bad: 10 },
    { f: 5, s: true, i: true, sav: 8, good: 48, bad: 18 },
    { f: 3, s: true, i: true, sav: 10, good: 46, bad: 20 },
    { f: 10, s: true, i: false, sav: 5, good: 55, bad: 5 },
    { f: 10, s: true, i: true, sav: 3, good: 53, bad: 13 },
  ];
  it.each(rows)('f=$f s=$s i=$i', ({ f, s, i, sav, good, bad }) => {
    const g = round2PayoutA({ fertilizer: f, seeds: s, insurance: i, videoWatched: false, rain: 'good' });
    const b = round2PayoutA({ fertilizer: f, seeds: s, insurance: i, videoWatched: false, rain: 'bad' });
    expect(g.savings).toBe(sav);
    expect(g.totalTokens).toBe(good);
    expect(b.totalTokens).toBe(bad);
  });
});

describe('Round 2 Version A truth table (budget=24, video watched)', () => {
  const rows = [
    { f: 0, s: true, i: true, sav: 12, good: 42, bad: 22 },
    // spec table lists good=37; formula yields 47. Trusting formula.
    { f: 5, s: true, i: true, sav: 7, good: 47, bad: 17 },
    { f: 10, s: true, i: true, sav: 2, good: 52, bad: 12 },
  ];
  it.each(rows)('f=$f video=true', ({ f, s, i, sav, good, bad }) => {
    const g = round2PayoutA({ fertilizer: f, seeds: s, insurance: i, videoWatched: true, rain: 'good' });
    const b = round2PayoutA({ fertilizer: f, seeds: s, insurance: i, videoWatched: true, rain: 'bad' });
    expect(g.savings).toBe(sav);
    expect(g.totalTokens).toBe(good);
    expect(b.totalTokens).toBe(bad);
  });
});

describe('Round 2 Version B truth table (budget=25, no video)', () => {
  const rows = [
    { f: 0, b: false, sav: 25, good: 25, bad: 25 },
    { f: 5, b: false, sav: 20, good: 30, bad: 20 },
    { f: 10, b: false, sav: 15, good: 35, bad: 15 },
    { f: 0, b: true, sav: 13, good: 43, bad: 23 },
    // spec table lists good=38; formula yields 48. Trusting formula.
    { f: 5, b: true, sav: 8, good: 48, bad: 18 },
    { f: 10, b: true, sav: 3, good: 53, bad: 13 },
  ];
  it.each(rows)('f=$f b=$b', ({ f, b, sav, good, bad }) => {
    const g = round2PayoutB({ fertilizer: f, bundle: b, videoWatched: false, rain: 'good' });
    const bd = round2PayoutB({ fertilizer: f, bundle: b, videoWatched: false, rain: 'bad' });
    expect(g.savings).toBe(sav);
    expect(g.totalTokens).toBe(good);
    expect(bd.totalTokens).toBe(bad);
  });
});

describe('Round 2 Version B (budget=24, video watched)', () => {
  const rows = [
    { f: 0, b: true, sav: 12, good: 42, bad: 22 },
    // spec table lists good=37; formula yields 47. Trusting formula.
    { f: 5, b: true, sav: 7, good: 47, bad: 17 },
    { f: 10, b: true, sav: 2, good: 52, bad: 12 },
  ];
  it.each(rows)('f=$f video=true', ({ f, b, sav, good, bad }) => {
    const g = round2PayoutB({ fertilizer: f, bundle: b, videoWatched: true, rain: 'good' });
    const bd = round2PayoutB({ fertilizer: f, bundle: b, videoWatched: true, rain: 'bad' });
    expect(g.savings).toBe(sav);
    expect(g.totalTokens).toBe(good);
    expect(bd.totalTokens).toBe(bad);
  });
});

describe('Budget invariants (property-based)', () => {
  it('VA savings never negative under valid combos', () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 10 }),
      fc.boolean(), fc.boolean(), fc.boolean(),
      (f, s, i, v) => {
        if (!s && i) return true; // invalid per rules; UI prevents this
        const maxF = maxFertilizerVA({ videoWatched: v, seeds: s, insurance: (s && i) });
        if (f > maxF) return true;
        const r = round2PayoutA({ fertilizer: f, seeds: s, insurance: (s && i), videoWatched: v, rain: 'good' });
        return r.savings >= 0;
      }
    ));
  });
  it('VB savings never negative under valid combos', () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 10 }),
      fc.boolean(), fc.boolean(),
      (f, b, v) => {
        const maxF = maxFertilizerVB({ videoWatched: v, bundle: b });
        if (f > maxF) return true;
        const r = round2PayoutB({ fertilizer: f, bundle: b, videoWatched: v, rain: 'good' });
        return r.savings >= 0;
      }
    ));
  });
});
