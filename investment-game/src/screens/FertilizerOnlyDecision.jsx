import { useEffect, useRef, useState } from 'react';
import { GAME, SCREENS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { logEvent } from '../store/eventLog.js';
import { newRoundSeed, drawWeather } from '../lib/randomize.js';
import { practiceOrRound1Payout } from '../lib/payout.js';
import Lockbox from '../components/Lockbox.jsx';
import TokenStepper from '../components/TokenStepper.jsx';
import PlantButton from '../components/PlantButton.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import PayoutReminder from '../components/PayoutReminder.jsx';
import { FertilizerIcon } from '../components/Icons.jsx';

export default function FertilizerOnlyDecision({ screenName, roundKey, weatherScreen, title }) {
  const transition = useGameStore((s) => s.transition);
  const updateRound = useGameStore((s) => s.updateRound);
  const [fert, setFert] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const enterRef = useRef(performance.now());
  const trajectoryRef = useRef([]);

  const onFertChange = (next, meta) => {
    setFert(next);
    if (meta) trajectoryRef.current.push({
      input: 'fertilizer', action: meta.action, value: next, timestamp: new Date().toISOString(),
      lockbox: GAME.BUDGET_PER_ROUND - next,
    });
  };

  useEffect(() => {
    logEvent(screenName, 'screen_enter', {});
    const startedAt = new Date().toISOString();
    updateRound(roundKey, { decisionStartTime: startedAt });
    return () => logEvent(screenName, 'screen_exit', { duration_ms: performance.now() - enterRef.current });
  }, [screenName, roundKey, updateRound]);

  const lockbox = GAME.BUDGET_PER_ROUND - fert;
  const maxF = GAME.FERTILIZER.MAX_UNITS;

  const onPlant = () => {
    logEvent(screenName, 'plant_tap', { fertilizer: fert });
    setConfirming(true);
  };

  const onCancel = () => {
    logEvent(screenName, 'plant_cancel', {});
    setConfirming(false);
  };

  const onConfirm = async () => {
    const seed = newRoundSeed();
    const weather = drawWeather(seed);
    const payout = practiceOrRound1Payout({ fertilizer: fert, rain: weather.outcome });
    await updateRound(roundKey, {
      fertilizerPurchased: fert,
      tokensSaved: payout.savings,
      weatherOutcome: weather.outcome,
      weatherSeed: weather.seed,
      weatherRawDraw: weather.rawDraw,
      fertilizerHarvest: payout.fertilizerHarvest,
      totalTokens: payout.totalTokens,
      decisionEndTime: new Date().toISOString(),
      stepperTrajectory: trajectoryRef.current,
    });
    await logEvent(screenName, 'plant_confirm', { fertilizer: fert, savings: payout.savings });
    transition(weatherScreen);
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-canvas">
      <header className="flex items-center justify-between px-10 pt-6">
        <h1 className="text-heading">{title}</h1>
        <PayoutReminder variant="none" />
      </header>

      <div className="flex flex-1 items-center justify-between gap-10 px-10 pb-10">
        <Lockbox tokens={lockbox} />

        <div className="flex flex-1 items-center justify-center">
          <TokenStepper
            screenName={screenName}
            inputKey="fertilizer"
            label="Fertilizer"
            price={GAME.FERTILIZER.PRICE_PER_UNIT}
            icon={<FertilizerIcon size={120} />}
            value={fert}
            min={0}
            max={maxF}
            lockboxAfter={GAME.BUDGET_PER_ROUND - fert}
            onChange={onFertChange}
          />
        </div>

        <PlantButton onClick={onPlant} />
      </div>

      <ConfirmDialog open={confirming} onCancel={onCancel} onConfirm={onConfirm} />
    </div>
  );
}
