import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runQa, reproduceWeather, GAME } from '../src/qa.js';

// ─────────────────────────────────────────────────────────────────────
// Helper: build a minimal valid session object so individual tests can
// patch one field at a time without repeating the full payload shape.
// ─────────────────────────────────────────────────────────────────────
function baseSession(overrides = {}) {
  return {
    sessionId: 'S-001',
    participantId: 'P-001',
    enumeratorId: 'E-001',
    country: 'UG',
    round2Version: 'A',
    language: 'en',
    currencyRate: 5000,
    sessionStartTime: '2026-04-20T10:00:00Z',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Weather reproducibility
// ─────────────────────────────────────────────────────────────────────

test('reproduceWeather returns deterministic outcome for a given seed', () => {
  const r1 = reproduceWeather('seed-abc');
  const r2 = reproduceWeather('seed-abc');
  assert.equal(r1.outcome, r2.outcome);
  assert.equal(r1.rawDraw, r2.rawDraw);
});

test('reproduceWeather decides good vs bad using 0.80 threshold', () => {
  const r = reproduceWeather('test-seed-1');
  assert.ok(r.outcome === 'good' || r.outcome === 'bad');
  if (r.rawDraw < 0.80) assert.equal(r.outcome, 'good');
  else assert.equal(r.outcome, 'bad');
});

test('runQa flags weather seed that does not reproduce stored outcome', () => {
  const seed = 'deterministic-seed-42';
  const genuine = reproduceWeather(seed);
  const fakeOutcome = genuine.outcome === 'good' ? 'bad' : 'good';
  const session = baseSession({
    round1: {
      fertilizerPurchased: 3,
      weatherSeed: seed,
      weatherOutcome: fakeOutcome,
      weatherRawDraw: genuine.rawDraw,
    },
  });
  const result = runQa(session);
  const wFlag = result.flags.find((f) => f.check === 'weather_outcome_not_reproducible');
  assert.ok(wFlag, 'should flag non-reproducible weather');
  assert.equal(wFlag.expected, genuine.outcome);
  assert.equal(wFlag.actual, fakeOutcome);
});

// ─────────────────────────────────────────────────────────────────────
// Budget + range invariants
// ─────────────────────────────────────────────────────────────────────

test('runQa flags spending above 25-token budget', () => {
  // 10 fert + 12 bundle + 10 seeds = 32 tokens, budget is 25 → overspent
  const session = baseSession({
    round2Version: 'A',
    round2: {
      fertilizerPurchased: 10,
      seedsPurchased: true,
      insurancePurchased: true,
      bundlePurchased: true,
      videoChosen: false,
    },
  });
  const result = runQa(session);
  const flag = result.flags.find((f) => f.check === 'budget_exceeded');
  assert.ok(flag, `expected budget_exceeded, got: ${JSON.stringify(result.flags)}`);
  assert.equal(flag.budget, 25);
  assert.equal(flag.spent, 34); // 10 + 10 + 2 + 12
});

test('runQa flags fertilizer above max units', () => {
  const session = baseSession({
    round1: { fertilizerPurchased: 15 },
  });
  const result = runQa(session);
  const flag = result.flags.find((f) => f.check === 'fertilizer_out_of_range');
  assert.ok(flag);
  assert.equal(flag.value, 15);
});

test('runQa flags negative fertilizer', () => {
  const session = baseSession({
    round1: { fertilizerPurchased: -1 },
  });
  const result = runQa(session);
  assert.ok(result.flags.find((f) => f.check === 'fertilizer_out_of_range'));
});

// ─────────────────────────────────────────────────────────────────────
// Insurance gating (V-A only)
// ─────────────────────────────────────────────────────────────────────

test('runQa flags insurance purchased without seeds in V-A', () => {
  const session = baseSession({
    round2Version: 'A',
    round2: {
      fertilizerPurchased: 3,
      seedsPurchased: false,
      insurancePurchased: true,
      videoChosen: false,
    },
  });
  const result = runQa(session);
  assert.ok(result.flags.find((f) => f.check === 'insurance_without_seeds'));
});

test('runQa does not apply V-A insurance gate to V-B sessions', () => {
  const session = baseSession({
    round2Version: 'B',
    round2: {
      fertilizerPurchased: 3,
      seedsPurchased: false,
      insurancePurchased: true, // Nonsensical for B but not a V-A gate violation
      videoChosen: false,
    },
  });
  const result = runQa(session);
  assert.equal(
    result.flags.find((f) => f.check === 'insurance_without_seeds'),
    undefined,
  );
});

// ─────────────────────────────────────────────────────────────────────
// Payout reconciliation
// ─────────────────────────────────────────────────────────────────────

test('runQa passes a clean V-A round-2 session with good rain', () => {
  const session = baseSession({
    round2Version: 'A',
    round2: {
      fertilizerPurchased: 5,
      seedsPurchased: true,
      insurancePurchased: true,
      videoChosen: false,
      weatherOutcome: 'good',
      fertilizerHarvest: 10,   // 5 × 2
      seedHarvest: 30,
      insurancePayout: 0,
      totalTokens: 48,         // savings (25-5-10-2=8) + 10 + 30 + 0
      effectiveBudget: 25,
    },
    round1: {
      fertilizerPurchased: 4,
      weatherOutcome: 'bad',
      fertilizerHarvest: 0,
      totalTokens: 21,         // savings 21 + 0 harvest
      effectiveBudget: 25,
    },
    totalIncentivizedTokens: 69,
  });
  const result = runQa(session);
  assert.equal(result.passed, true, `expected pass, got flags: ${JSON.stringify(result.flags)}`);
});

test('runQa flags mismatched fertilizerHarvest', () => {
  const session = baseSession({
    round1: {
      fertilizerPurchased: 4,
      weatherOutcome: 'good',
      fertilizerHarvest: 7,   // Should be 8
      effectiveBudget: 25,
    },
  });
  const result = runQa(session);
  const flag = result.flags.find((f) => f.check === 'fertilizer_harvest_mismatch');
  assert.ok(flag);
  assert.equal(flag.expected, 8);
  assert.equal(flag.actual, 7);
});

test('runQa flags mismatched total incentivized tokens', () => {
  const session = baseSession({
    round1: { totalTokens: 10 },
    round2: { totalTokens: 20 },
    totalIncentivizedTokens: 35, // Should be 30
  });
  const result = runQa(session);
  assert.ok(result.flags.find((f) => f.check === 'total_incentivized_tokens_mismatch'));
});

// ─────────────────────────────────────────────────────────────────────
// Stepper trajectory
// ─────────────────────────────────────────────────────────────────────

test('runQa flags stepper trajectory with negative lockbox', () => {
  const session = baseSession({
    round1: {
      fertilizerPurchased: 3,
      stepperTrajectory: [
        { input: 'fertilizer', action: 'plus', value: 1, lockbox: 24 },
        { input: 'fertilizer', action: 'plus', value: 1, lockbox: -3 },
      ],
    },
  });
  const result = runQa(session);
  assert.ok(result.flags.find((f) => f.check === 'stepper_lockbox_negative'));
});

// ─────────────────────────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────────────────────────

test('runQa returns passed=true when all checks pass', () => {
  const session = baseSession({
    round1: {
      fertilizerPurchased: 0,
      weatherOutcome: 'good',
      fertilizerHarvest: 0,
      totalTokens: 25,
      effectiveBudget: 25,
    },
  });
  const result = runQa(session);
  assert.equal(result.passed, true);
  assert.equal(result.flags.length, 0);
  assert.ok(result.checkedAt);
});

test('GAME constants mirror PWA values', () => {
  assert.equal(GAME.BUDGET_PER_ROUND, 25);
  assert.equal(GAME.VIDEO_COST, 1);
  assert.equal(GAME.GOOD_RAIN_PROBABILITY, 0.80);
  assert.equal(GAME.FERTILIZER.MAX_UNITS, 10);
  assert.equal(GAME.SEEDS.PRICE, 10);
  assert.equal(GAME.SEEDS.GOOD_RAIN_PAYOUT, 30);
  assert.equal(GAME.INSURANCE.PRICE, 2);
  assert.equal(GAME.INSURANCE.BAD_RAIN_PAYOUT, 10);
  assert.equal(GAME.BUNDLE.PRICE, 12);
  assert.equal(GAME.BUNDLE.GOOD_RAIN_PAYOUT, 30);
});
