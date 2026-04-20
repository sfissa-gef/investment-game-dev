import { useEffect, useRef, useState } from 'react';
import { GAME, SCREENS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { logEvent } from '../store/eventLog.js';
import { newRoundSeed, drawWeather } from '../lib/randomize.js';
import { round2PayoutB, maxFertilizerVB } from '../lib/payout.js';
import Lockbox from '../components/Lockbox.jsx';
import TokenStepper from '../components/TokenStepper.jsx';
import PlantButton from '../components/PlantButton.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import PayoutReminder from '../components/PayoutReminder.jsx';
import { FertilizerIcon, BundleIcon } from '../components/Icons.jsx';

export default function Round2VersionB() {
  const screenName = SCREENS.ROUND2_DECISION;
  const transition = useGameStore((s) => s.transition);
  const updateRound = useGameStore((s) => s.updateRound);
  const session = useGameStore((s) => s.session);
  const videoWatched = !!session?.round2?.videoChosen;

  const [fert, setFert] = useState(0);
  const [bundle, setBundle] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const enterRef = useRef(performance.now());
  const trajectoryRef = useRef([]);

  const track = (inputKey, next, meta, after) => {
    if (meta) trajectoryRef.current.push({
      input: inputKey, action: meta.action, value: next,
      timestamp: new Date().toISOString(), lockbox: after,
    });
  };
  const onFert = (next, meta) => { setFert(next); track('fertilizer', next, meta, (25 - (videoWatched ? 1 : 0)) - (next + bundle * 12)); };
  const onBundle = (next, meta) => { setBundle(next); track('bundle', next, meta, (25 - (videoWatched ? 1 : 0)) - (fert + next * 12)); };

  useEffect(() => {
    logEvent(screenName, 'screen_enter', { version: 'B', videoWatched });
    updateRound('round2', { decisionStartTime: new Date().toISOString() });
    return () => logEvent(screenName, 'screen_exit', { duration_ms: performance.now() - enterRef.current });
  }, [screenName, videoWatched, updateRound]);

  const budget = GAME.BUDGET_PER_ROUND - (videoWatched ? GAME.VIDEO_COST : 0);
  const spent = fert + bundle * GAME.BUNDLE.PRICE;
  const lockbox = budget - spent;
  const maxF = maxFertilizerVB({ videoWatched, bundle: !!bundle });

  const onPlant = () => {
    logEvent(screenName, 'plant_tap', { fertilizer: fert, bundle: !!bundle });
    setConfirming(true);
  };
  const onCancel = () => {
    logEvent(screenName, 'plant_cancel', {});
    setConfirming(false);
  };
  const onConfirm = async () => {
    const seed = newRoundSeed();
    const weather = drawWeather(seed);
    const p = round2PayoutB({ fertilizer: fert, bundle: !!bundle, videoWatched, rain: weather.outcome });
    await updateRound('round2', {
      version: 'B',
      effectiveBudget: p.effectiveBudget,
      fertilizerPurchased: fert,
      seedsPurchased: null,
      insurancePurchased: null,
      bundlePurchased: !!bundle,
      tokensSaved: p.savings,
      fertilizerHarvest: p.fertilizerHarvest,
      seedHarvest: null,
      insurancePayout: null,
      bundleHarvest: p.bundleHarvest,
      weatherOutcome: weather.outcome,
      weatherSeed: weather.seed,
      weatherRawDraw: weather.rawDraw,
      totalTokens: p.totalTokens,
      decisionEndTime: new Date().toISOString(),
      stepperTrajectory: trajectoryRef.current,
    });
    logEvent(screenName, 'plant_confirm', { fertilizer: fert, bundle: !!bundle, savings: p.savings });
    transition(SCREENS.ROUND2_WEATHER);
  };

  return (
    <div className="flex h-full w-full flex-col bg-canvas">
      <header className="flex items-start justify-between px-10 pt-6">
        <h1 className="text-heading">Round 2 — buy what you need</h1>
        <PayoutReminder variant="B" />
      </header>

      <div className="flex flex-1 items-center justify-between gap-6 px-10 pb-6">
        <Lockbox tokens={lockbox} />

        <div className="flex flex-1 items-center justify-center gap-10">
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
            inputKey="bundle"
            label="Seeds + Insurance"
            price={GAME.BUNDLE.PRICE}
            icon={<BundleIcon size={96} />}
            value={bundle}
            min={0}
            max={1}
            lockboxAfter={lockbox}
            onChange={onBundle}
            disabled={!bundle && fert + GAME.BUNDLE.PRICE > budget}
            disabledReason={!bundle && fert + GAME.BUNDLE.PRICE > budget ? 'Not enough tokens' : null}
          />
        </div>

        <PlantButton onClick={onPlant} />
      </div>

      <ConfirmDialog open={confirming} onCancel={onCancel} onConfirm={onConfirm} />
    </div>
  );
}
