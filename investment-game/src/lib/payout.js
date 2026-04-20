import { GAME } from './constants.js';

export function fertilizerHarvest(units, rain) {
  const mult = rain === 'good' ? GAME.FERTILIZER.GOOD_RAIN_MULTIPLIER : GAME.FERTILIZER.BAD_RAIN_MULTIPLIER;
  return units * mult;
}

export function seedHarvest(purchased, rain) {
  if (!purchased) return 0;
  return rain === 'good' ? GAME.SEEDS.GOOD_RAIN_PAYOUT : GAME.SEEDS.BAD_RAIN_PAYOUT;
}

export function insurancePayout(purchased, rain) {
  if (!purchased) return 0;
  return rain === 'good' ? GAME.INSURANCE.GOOD_RAIN_PAYOUT : GAME.INSURANCE.BAD_RAIN_PAYOUT;
}

export function bundleHarvest(purchased, rain) {
  if (!purchased) return 0;
  return rain === 'good' ? GAME.BUNDLE.GOOD_RAIN_PAYOUT : GAME.BUNDLE.BAD_RAIN_PAYOUT;
}

export function practiceOrRound1Payout({ fertilizer, rain }) {
  const savings = GAME.BUDGET_PER_ROUND - fertilizer;
  const harvest = fertilizerHarvest(fertilizer, rain);
  return { savings, fertilizerHarvest: harvest, totalTokens: savings + harvest };
}

export function round2PayoutA({ fertilizer, seeds, insurance, videoWatched, rain }) {
  const budget = GAME.BUDGET_PER_ROUND - (videoWatched ? GAME.VIDEO_COST : 0);
  const spent = fertilizer + (seeds ? GAME.SEEDS.PRICE : 0) + (insurance ? GAME.INSURANCE.PRICE : 0);
  const savings = budget - spent;
  const fH = fertilizerHarvest(fertilizer, rain);
  const sH = seedHarvest(seeds, rain);
  const iP = insurancePayout(insurance, rain);
  return {
    effectiveBudget: budget,
    savings,
    fertilizerHarvest: fH,
    seedHarvest: sH,
    insurancePayout: iP,
    totalTokens: savings + fH + sH + iP,
  };
}

export function round2PayoutB({ fertilizer, bundle, videoWatched, rain }) {
  const budget = GAME.BUDGET_PER_ROUND - (videoWatched ? GAME.VIDEO_COST : 0);
  const spent = fertilizer + (bundle ? GAME.BUNDLE.PRICE : 0);
  const savings = budget - spent;
  const fH = fertilizerHarvest(fertilizer, rain);
  const bH = bundleHarvest(bundle, rain);
  return {
    effectiveBudget: budget,
    savings,
    fertilizerHarvest: fH,
    bundleHarvest: bH,
    totalTokens: savings + fH + bH,
  };
}

export function maxFertilizerVA({ videoWatched, seeds, insurance }) {
  const budget = GAME.BUDGET_PER_ROUND - (videoWatched ? GAME.VIDEO_COST : 0);
  const remaining = budget - (seeds ? GAME.SEEDS.PRICE : 0) - (insurance ? GAME.INSURANCE.PRICE : 0);
  return Math.max(0, Math.min(GAME.FERTILIZER.MAX_UNITS, remaining));
}

export function maxFertilizerVB({ videoWatched, bundle }) {
  const budget = GAME.BUDGET_PER_ROUND - (videoWatched ? GAME.VIDEO_COST : 0);
  const remaining = budget - (bundle ? GAME.BUNDLE.PRICE : 0);
  return Math.max(0, Math.min(GAME.FERTILIZER.MAX_UNITS, remaining));
}

export function canAddSeedsVA({ fertilizer, insurance, videoWatched }) {
  const budget = GAME.BUDGET_PER_ROUND - (videoWatched ? GAME.VIDEO_COST : 0);
  return fertilizer + GAME.SEEDS.PRICE + (insurance ? GAME.INSURANCE.PRICE : 0) <= budget;
}

export function canAddBundleVB({ fertilizer, videoWatched }) {
  const budget = GAME.BUDGET_PER_ROUND - (videoWatched ? GAME.VIDEO_COST : 0);
  return fertilizer + GAME.BUNDLE.PRICE <= budget;
}
