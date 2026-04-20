import { useEffect, useRef, useState } from 'react';
import { GAME, SCREENS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { logEvent } from '../store/eventLog.js';
import { newRoundSeed, drawWeather } from '../lib/randomize.js';
import { round2PayoutA, maxFertilizerVA } from '../lib/payout.js';
import Lockbox from '../components/Lockbox.jsx';
import TokenStepper from '../components/TokenStepper.jsx';
import PlantButton from '../components/PlantButton.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import PayoutReminder from '../components/PayoutReminder.jsx';
import { FertilizerIcon, SeedIcon, InsuranceIcon } from '../components/Icons.jsx';

export default function Round2VersionA() {
  const screenName = SCREENS.ROUND2_DECISION;
  const transition = useGameStore((s) => s.transition);
  const updateRound = useGameStore((s) => s.updateRound);
  const session = useGameStore((s) => s.session);
  const videoWatched = !!session?.round2?.videoChosen;

  const [fert, setFert] = useState(0);
  const [seeds, setSeeds] = useState(0);
  const [insurance, setInsurance] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const enterRef = useRef(performance.now());
  const trajectoryRef = useRef([]);

  const track = (inputKey, next, meta, after) => {
    if (meta) trajectoryRef.current.push({
      input: inputKey, action: meta.action, value: next,
      timestamp: new Date().toISOString(), lockbox: after,
    });
  };

  useEffect(() => {
    logEvent(screenName, 'screen_enter', { version: 'A', videoWatched });
    updateRound('round2', { decisionStartTime: new Date().toISOString() });
    return () => logEvent(screenName, 'screen_exit', { duration_ms: performance.now() - enterRef.current });
  }, [screenName, videoWatched, updateRound]);

  const budget = GAME.BUDGET_PER_ROUND - (videoWatched ? GAME.VIDEO_COST : 0);
  const spent = fert + seeds * GAME.SEEDS.PRICE + insurance * GAME.INSURANCE.PRICE;
  const lockbox = budget - spent;
  const maxF = maxFertilizerVA({ videoWatched, seeds: !!seeds, insurance: !!insurance });

  const onFert = (next, meta) => { setFert(next); track('fertilizer', next, meta, budget - (next + seeds * GAME.SEEDS.PRICE + insurance * GAME.INSURANCE.PRICE)); };
  const onSeeds = (next, meta) => {
    setSeeds(next); track('seeds', next, meta, budget - (fert + next * GAME.SEEDS.PRICE + (next === 0 ? 0 : insurance) * GAME.INSURANCE.PRICE));
    if (next === 0 && insurance) { setInsurance(0); track('insurance', 0, { action: 'auto_clear' }, budget - (fert + next * GAME.SEEDS.PRICE)); }
  };
  const onInsurance = (next, meta) => { setInsurance(next); track('insurance', next, meta, budget - (fert + seeds * GAME.SEEDS.PRICE + next * GAME.INSURANCE.PRICE)); };

  const insuranceDisabled = !seeds;

  const onPlant = () => {
    logEvent(screenName, 'plant_tap', { fertilizer: fert, seeds: !!seeds, insurance: !!insurance });
    setConfirming(true);
  };
  const onCancel = () => {
    logEvent(screenName, 'plant_cancel', {});
    setConfirming(false);
  };
  const onConfirm = async () => {
    const seed = newRoundSeed();
    const weather = drawWeather(seed);
    const p = round2PayoutA({
      fertilizer: fert,
      seeds: !!seeds,
      insurance: !!insurance,
      videoWatched,
      rain: weather.outcome,
    });
    await updateRound('round2', {
      version: 'A',
      effectiveBudget: p.effectiveBudget,
      fertilizerPurchased: fert,
      seedsPurchased: !!seeds,
      insurancePurchased: !!insurance,
      bundlePurchased: null,
      tokensSaved: p.savings,
      fertilizerHarvest: p.fertilizerHarvest,
      seedHarvest: p.seedHarvest,
      insurancePayout: p.insurancePayout,
      bundleHarvest: null,
      weatherOutcome: weather.outcome,
      weatherSeed: weather.seed,
      weatherRawDraw: weather.rawDraw,
      totalTokens: p.totalTokens,
      decisionEndTime: new Date().toISOString(),
      stepperTrajectory: trajectoryRef.current,
    });
    logEvent(screenName, 'plant_confirm', {
      fertilizer: fert, seeds: !!seeds, insurance: !!insurance, savings: p.savings,
    });
    transition(SCREENS.ROUND2_WEATHER);
  };

  return (
    <div className="flex h-full w-full flex-col bg-canvas">
      <header className="flex items-start justify-between px-10 pt-6">
        <h1 className="text-heading">Round 2 — buy what you need</h1>
        <PayoutReminder variant="A" />
      </header>

      <div className="flex flex-1 items-center justify-between gap-6 px-10 pb-6">
        <Lockbox tokens={lockbox} />

        <div className="flex flex-1 items-center justify-center gap-6">
          <TokenStepper
            screenName={screenName}
            inputKey="fertilizer"
            label="Fertilizer"
            price={GAME.FERTILIZER.PRICE_PER_UNIT}
            icon={<FertilizerIcon size={96} />}
            value={fert}
            min={0}
            max={maxF}
            lockboxAfter={lockbox}
            onChange={onFert}
          />
          <TokenStepper
            screenName={screenName}
            inputKey="seeds"
            label="Improved seeds"
            price={GAME.SEEDS.PRICE}
            icon={<SeedIcon size={96} />}
            value={seeds}
            min={0}
            max={1}
            lockboxAfter={lockbox}
            onChange={onSeeds}
            disabled={!seeds && fert + GAME.SEEDS.PRICE + insurance * GAME.INSURANCE.PRICE > budget}
            disabledReason={!seeds && fert + GAME.SEEDS.PRICE > budget ? 'Not enough tokens' : null}
          />
          <TokenStepper
            screenName={screenName}
            inputKey="insurance"
            label="Insurance"
            price={GAME.INSURANCE.PRICE}
            icon={<InsuranceIcon size={96} />}
            value={insurance}
            min={0}
            max={1}
            lockboxAfter={lockbox}
            onChange={onInsurance}
            disabled={insuranceDisabled}
            disabledReason={insuranceDisabled ? 'Requires seeds' : null}
          />
        </div>

        <PlantButton onClick={onPlant} />
      </div>

      <ConfirmDialog open={confirming} onCancel={onCancel} onConfirm={onConfirm} />
    </div>
  );
}
