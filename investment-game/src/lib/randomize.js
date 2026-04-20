import seedrandom from 'seedrandom';
import { GAME } from './constants.js';

export function assignVersion(participantId) {
  const rng = seedrandom(`version-${participantId}`);
  return rng() < 0.5 ? 'A' : 'B';
}

export function newRoundSeed() {
  return (crypto.randomUUID && crypto.randomUUID()) || `seed-${Date.now()}-${Math.random()}`;
}

export function drawWeather(roundSeed) {
  const rng = seedrandom(roundSeed);
  const draw = rng();
  return {
    outcome: draw < GAME.GOOD_RAIN_PROBABILITY ? 'good' : 'bad',
    seed: roundSeed,
    rawDraw: draw,
  };
}
