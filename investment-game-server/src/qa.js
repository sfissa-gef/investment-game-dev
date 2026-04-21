// Per-session quality-assurance checks.
//
// Runs on every POST /api/sessions. Recomputes derived values from recorded
// inputs and compares against what the client sent. Divergence indicates one
// of:
//   (a) a tablet that was running a different app version than production
//   (b) data tampering
//   (c) a bug in the PWA's payout/randomize code (same bug here would cancel)
//
// Each check returns `null` if it passed, or an object `{ check, expected,
// actual, ... }` if it failed. The aggregated `qa_flags` array is stored
// alongside the session and surfaced in the admin dashboard.
//
// IMPORTANT: the constants below must stay in sync with
// `investment-game/src/lib/constants.js`. Any change in one requires the
// other. Do not ship a PR that updates only one side — the `qa-constants`
// guard test in test/qa-constants.test.js enforces this.

import seedrandom from 'seedrandom';

// ─────────────────────────────────────────────────────────────────────
// Mirrored constants (keep in sync with PWA constants.js)
// ─────────────────────────────────────────────────────────────────────
export const GAME = {
  BUDGET_PER_ROUND: 25,
  VIDEO_COST: 1,
  GOOD_RAIN_PROBABILITY: 0.80,
  FERTILIZER: {
    PRICE_PER_UNIT: 1,
    MAX_UNITS: 10,
    GOOD_RAIN_MULTIPLIER: 2,
    BAD_RAIN_MULTIPLIER: 0,
  },
  SEEDS: { PRICE: 10, GOOD_RAIN_PAYOUT: 30, BAD_RAIN_PAYOUT: 0 },
  INSURANCE: { PRICE: 2, GOOD_RAIN_PAYOUT: 0, BAD_RAIN_PAYOUT: 10 },
  BUNDLE: { PRICE: 12, GOOD_RAIN_PAYOUT: 30, BAD_RAIN_PAYOUT: 10 },
};

// ─────────────────────────────────────────────────────────────────────
// Recomputation helpers (mirror of investment-game/src/lib/payout.js)
// ─────────────────────────────────────────────────────────────────────
function fertilizerHarvest(units, rain) {
  const mult = rain === 'good' ? GAME.FERTILIZER.GOOD_RAIN_MULTIPLIER : GAME.FERTILIZER.BAD_RAIN_MULTIPLIER;
  return units * mult;
}
function seedHarvest(purchased, rain) {
  if (!purchased) return 0;
  return rain === 'good' ? GAME.SEEDS.GOOD_RAIN_PAYOUT : GAME.SEEDS.BAD_RAIN_PAYOUT;
}
function insurancePayout(purchased, rain) {
  if (!purchased) return 0;
  return rain === 'good' ? GAME.INSURANCE.GOOD_RAIN_PAYOUT : GAME.INSURANCE.BAD_RAIN_PAYOUT;
}
function bundleHarvest(purchased, rain) {
  if (!purchased) return 0;
  return rain === 'good' ? GAME.BUNDLE.GOOD_RAIN_PAYOUT : GAME.BUNDLE.BAD_RAIN_PAYOUT;
}

// Regenerate a weather draw from its seed. Matches drawWeather() in randomize.js.
export function reproduceWeather(seed) {
  if (!seed) return null;
  const rng = seedrandom(seed);
  const draw = rng();
  return {
    outcome: draw < GAME.GOOD_RAIN_PROBABILITY ? 'good' : 'bad',
    rawDraw: draw,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Individual checks — each returns null (pass) or a flag object (fail)
// ─────────────────────────────────────────────────────────────────────

function checkBudget(round, opts, label) {
  if (!round) return null;
  const budget = GAME.BUDGET_PER_ROUND - (round.videoChosen ? GAME.VIDEO_COST : 0);
  const fert = round.fertilizerPurchased ?? 0;
  const seedsCost = round.seedsPurchased ? GAME.SEEDS.PRICE : 0;
  const insCost = round.insurancePurchased ? GAME.INSURANCE.PRICE : 0;
  const bundleCost = round.bundlePurchased ? GAME.BUNDLE.PRICE : 0;
  const spent = fert + seedsCost + insCost + bundleCost;
  if (spent > budget) {
    return { check: 'budget_exceeded', round: label, budget, spent };
  }
  if (fert < 0 || fert > GAME.FERTILIZER.MAX_UNITS) {
    return { check: 'fertilizer_out_of_range', round: label, value: fert };
  }
  return null;
}

function checkInsuranceGating(round, label, version) {
  if (!round) return null;
  if (version !== 'A') return null;
  if (round.insurancePurchased && !round.seedsPurchased) {
    return { check: 'insurance_without_seeds', round: label };
  }
  return null;
}

function checkPayoutReconciliation(round, label, version) {
  if (!round) return null;
  if (round.weatherOutcome == null) return null;
  const rain = round.weatherOutcome;

  const flags = [];

  if (label === 'practice' || label === 'round1') {
    const f = fertilizerHarvest(round.fertilizerPurchased ?? 0, rain);
    if (round.fertilizerHarvest != null && round.fertilizerHarvest !== f) {
      flags.push({ check: 'fertilizer_harvest_mismatch', round: label, expected: f, actual: round.fertilizerHarvest });
    }
  }

  if (label === 'round2' && version === 'A') {
    const f = fertilizerHarvest(round.fertilizerPurchased ?? 0, rain);
    const s = seedHarvest(round.seedsPurchased, rain);
    const i = insurancePayout(round.insurancePurchased, rain);
    if (round.fertilizerHarvest != null && round.fertilizerHarvest !== f) {
      flags.push({ check: 'fertilizer_harvest_mismatch', round: label, expected: f, actual: round.fertilizerHarvest });
    }
    if (round.seedHarvest != null && round.seedHarvest !== s) {
      flags.push({ check: 'seed_harvest_mismatch', round: label, expected: s, actual: round.seedHarvest });
    }
    if (round.insurancePayout != null && round.insurancePayout !== i) {
      flags.push({ check: 'insurance_payout_mismatch', round: label, expected: i, actual: round.insurancePayout });
    }
  }

  if (label === 'round2' && version === 'B') {
    const f = fertilizerHarvest(round.fertilizerPurchased ?? 0, rain);
    const b = bundleHarvest(round.bundlePurchased, rain);
    if (round.fertilizerHarvest != null && round.fertilizerHarvest !== f) {
      flags.push({ check: 'fertilizer_harvest_mismatch', round: label, expected: f, actual: round.fertilizerHarvest });
    }
    if (round.bundleHarvest != null && round.bundleHarvest !== b) {
      flags.push({ check: 'bundle_harvest_mismatch', round: label, expected: b, actual: round.bundleHarvest });
    }
  }

  // totalTokens = savings + all harvests
  if (round.totalTokens != null && round.effectiveBudget != null) {
    const fert = round.fertilizerPurchased ?? 0;
    const seedsCost = round.seedsPurchased ? GAME.SEEDS.PRICE : 0;
    const insCost = round.insurancePurchased ? GAME.INSURANCE.PRICE : 0;
    const bundleCost = round.bundlePurchased ? GAME.BUNDLE.PRICE : 0;
    const savings = round.effectiveBudget - fert - seedsCost - insCost - bundleCost;
    const harvests =
      fertilizerHarvest(fert, rain) +
      seedHarvest(round.seedsPurchased, rain) +
      insurancePayout(round.insurancePurchased, rain) +
      bundleHarvest(round.bundlePurchased, rain);
    const expected = savings + harvests;
    if (round.totalTokens !== expected) {
      flags.push({ check: 'total_tokens_mismatch', round: label, expected, actual: round.totalTokens });
    }
  }

  return flags;
}

function checkWeatherReproduction(round, label) {
  if (!round || !round.weatherSeed || !round.weatherOutcome) return null;
  const r = reproduceWeather(round.weatherSeed);
  if (!r) return null;
  const flags = [];
  if (r.outcome !== round.weatherOutcome) {
    flags.push({
      check: 'weather_outcome_not_reproducible',
      round: label,
      seed: round.weatherSeed,
      expected: r.outcome,
      actual: round.weatherOutcome,
    });
  }
  // rawDraw is float — compare with tolerance in case of JSON round-trip precision
  if (round.weatherRawDraw != null && Math.abs(r.rawDraw - round.weatherRawDraw) > 1e-9) {
    flags.push({
      check: 'weather_rawdraw_mismatch',
      round: label,
      seed: round.weatherSeed,
      expected: r.rawDraw,
      actual: round.weatherRawDraw,
    });
  }
  return flags;
}

function checkStepperTrajectory(round, label) {
  if (!round || !round.stepperTrajectory) return null;
  const flags = [];
  for (const [i, entry] of round.stepperTrajectory.entries()) {
    if (entry.lockbox != null && entry.lockbox < 0) {
      flags.push({ check: 'stepper_lockbox_negative', round: label, index: i, lockbox: entry.lockbox });
    }
    if (entry.value != null && entry.value < 0) {
      flags.push({ check: 'stepper_value_negative', round: label, index: i, value: entry.value });
    }
  }
  return flags;
}

function checkFinalPayout(session) {
  const r1 = session.round1?.totalTokens;
  const r2 = session.round2?.totalTokens;
  if (r1 == null || r2 == null || session.totalIncentivizedTokens == null) return null;
  const expected = r1 + r2;
  if (session.totalIncentivizedTokens !== expected) {
    return {
      check: 'total_incentivized_tokens_mismatch',
      expected,
      actual: session.totalIncentivizedTokens,
    };
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────────

export function runQa(session) {
  const flags = [];
  const version = session.round2Version;

  const rounds = [
    ['practice', session.practiceRound],
    ['round1', session.round1],
    ['round2', session.round2],
  ];

  for (const [label, round] of rounds) {
    if (!round) continue;
    const budget = checkBudget(round, null, label);
    if (budget) flags.push(budget);

    const gating = checkInsuranceGating(round, label, version);
    if (gating) flags.push(gating);

    const payout = checkPayoutReconciliation(round, label, version);
    if (payout && payout.length) flags.push(...payout);

    const weather = checkWeatherReproduction(round, label);
    if (weather && weather.length) flags.push(...weather);

    const stepper = checkStepperTrajectory(round, label);
    if (stepper && stepper.length) flags.push(...stepper);
  }

  const finalP = checkFinalPayout(session);
  if (finalP) flags.push(finalP);

  return {
    passed: flags.length === 0,
    flags,
    checkedAt: new Date().toISOString(),
  };
}
