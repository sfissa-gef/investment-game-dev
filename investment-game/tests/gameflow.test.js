import { describe, it, expect } from 'vitest';
import { FLOW, SCREENS, COUNTRY_LANGUAGES, LANGUAGE_LABELS } from '../src/lib/constants.js';

describe('state machine flow shape', () => {
  it('starts at WELCOME and ends at COMPLETION', () => {
    expect(FLOW[0]).toBe(SCREENS.WELCOME);
    expect(FLOW[FLOW.length - 1]).toBe(SCREENS.COMPLETION);
  });
  it('contains both practice and round1 decision screens in order', () => {
    const i = FLOW.indexOf(SCREENS.PRACTICE_DECISION);
    const j = FLOW.indexOf(SCREENS.ROUND1_DECISION);
    expect(i).toBeGreaterThan(0);
    expect(j).toBeGreaterThan(i);
  });
  it('has the video offer between round 1 and round 2', () => {
    const offerIdx = FLOW.indexOf(SCREENS.VIDEO_OFFER);
    expect(offerIdx).toBeGreaterThan(FLOW.indexOf(SCREENS.ROUND1_SUMMARY));
    expect(offerIdx).toBeLessThan(FLOW.indexOf(SCREENS.ROUND2_DECISION));
  });
  it('round 2 intro sits between round 1 summary and video offer', () => {
    const intro = FLOW.indexOf(SCREENS.ROUND2_INTRO);
    expect(intro).toBeGreaterThan(FLOW.indexOf(SCREENS.ROUND1_SUMMARY));
    expect(intro).toBeLessThan(FLOW.indexOf(SCREENS.VIDEO_OFFER));
  });
  it('survey precedes completion', () => {
    expect(FLOW.indexOf(SCREENS.SURVEY)).toBeLessThan(FLOW.indexOf(SCREENS.COMPLETION));
  });
  it('enumerator setup precedes language select (country → language)', () => {
    const enu = FLOW.indexOf(SCREENS.ENUMERATOR_SETUP);
    const lang = FLOW.indexOf(SCREENS.LANGUAGE_SELECT);
    expect(enu).toBeGreaterThan(0);
    expect(lang).toBeGreaterThan(enu);
    expect(lang).toBeLessThan(FLOW.indexOf(SCREENS.INSTRUCTIONS));
  });
});

describe('language configuration', () => {
  it('both countries offer English plus at least one local language', () => {
    expect(COUNTRY_LANGUAGES.UG).toContain('en');
    expect(COUNTRY_LANGUAGES.ZM).toContain('en');
    expect(COUNTRY_LANGUAGES.UG.length).toBeGreaterThan(1);
    expect(COUNTRY_LANGUAGES.ZM.length).toBeGreaterThan(1);
  });
  it('every offered language has a display label', () => {
    for (const langs of Object.values(COUNTRY_LANGUAGES)) {
      for (const l of langs) {
        expect(LANGUAGE_LABELS[l]).toBeTruthy();
      }
    }
  });
});
