import { describe, it, expect } from 'vitest';
import { assignVersion, drawWeather, newRoundSeed } from '../src/lib/randomize.js';

describe('assignVersion', () => {
  it('is idempotent per participant', () => {
    for (const id of ['p1', 'p-abc-001', 'UG-42', 'ZM-999']) {
      expect(assignVersion(id)).toBe(assignVersion(id));
    }
  });
  it('produces roughly 50/50 split across 10k ids', () => {
    let a = 0, b = 0;
    for (let i = 0; i < 10000; i++) {
      if (assignVersion(`p-${i}`) === 'A') a++; else b++;
    }
    const ratio = a / (a + b);
    expect(ratio).toBeGreaterThan(0.48);
    expect(ratio).toBeLessThan(0.52);
  });
});

describe('drawWeather', () => {
  it('is deterministic from seed', () => {
    const seed = 'fixed-seed';
    const a = drawWeather(seed);
    const b = drawWeather(seed);
    expect(a.outcome).toBe(b.outcome);
    expect(a.rawDraw).toBe(b.rawDraw);
  });
  it('produces ~80/20 good/bad over 10k fresh seeds', () => {
    let good = 0, bad = 0;
    for (let i = 0; i < 10000; i++) {
      const s = newRoundSeed();
      if (drawWeather(s).outcome === 'good') good++; else bad++;
    }
    const goodRatio = good / (good + bad);
    expect(goodRatio).toBeGreaterThan(0.78);
    expect(goodRatio).toBeLessThan(0.82);
  });
});
